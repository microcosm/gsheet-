class UpdateCalendarFromSpreadsheet extends Feature {
  constructor(sheet) {
    super(sheet);
    this.featureName = 'Update Calendar From Spreadsheet';
    this.addResponseCapability(Event.onSpreadsheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
    this.eventsFromUserCalendarsStateBuilder = new EventsFromUserCalendarsStateBuilder();
    this.eventsFromSpreadsheetStateBuilder = new EventsFromSpreadsheetStateBuilder();
  }

  execute() {
    logFeatureExecution(this.featureName);
    state.users.forEach((user) => {
      user.calendarEvents = this.eventsFromUserCalendarsStateBuilder.build(user);
      user.spreadsheetEvents = this.eventsFromSpreadsheetStateBuilder.build(user);
      this.updateCalendar(user);
    });
  }

  updateCalendar(user) {
    this.discoverMatchingEvents(user);
    this.deleteUnmatchedCalendarEvents(user);
    this.createUnmatchedSpreadsheetEvents(user);
  }

  discoverMatchingEvents(user) {
    user.spreadsheetEvents.forEach((spreadsheetEvent) => {
      var matchingCalendarEvent = this.findInCalendarEvents(spreadsheetEvent, user.calendarEvents);
      if(matchingCalendarEvent) {
        matchingCalendarEvent.existsInSpreadsheet = true;
        spreadsheetEvent.existsInCalendar = true;
      }
      logEventFound(spreadsheetEvent, matchingCalendarEvent);
    });
  }

  deleteUnmatchedCalendarEvents(user) {
    user.calendarEvents.forEach((calendarEvent) => {
      if(!calendarEvent.existsInSpreadsheet){
        this.deleteCalendarEvent(calendarEvent);
      }
    });
  }

  createUnmatchedSpreadsheetEvents(user) {
    user.spreadsheetEvents.forEach((spreadsheetEvent) => {
      if(!spreadsheetEvent.existsInCalendar) {
        this.createCalendarEvent(spreadsheetEvent, user.calendar);
      }
    });
  }

  findInCalendarEvents(spreadsheetEvent, calendarEvents) {
    var match = false;
    calendarEvents.forEach((calendarEvent) => {
      var isEqual =
        calendarEvent.title === spreadsheetEvent.title &&
        calendarEvent.startDateTime.getTime() === spreadsheetEvent.startDateTime.getTime() &&
        calendarEvent.isAllDay === spreadsheetEvent.isAllDay &&
        (calendarEvent.isAllDay ? true : calendarEvent.endDateTime.getTime() === spreadsheetEvent.endDateTime.getTime()) &&
        calendarEvent.options.location === spreadsheetEvent.options.location;
      if(isEqual) {
        match = calendarEvent;
      }
    });
    return match;
  }

  deleteCalendarEvent(calendarEvent) {
    logEventDeleted(calendarEvent);
    if(config.toggles.performDataUpdates) {
      calendarEvent.gcal.deleteEvent();
    }
  }

  createCalendarEvent(spreadsheetEvent, calendar) {
    logEventCreated(spreadsheetEvent);
    if(config.toggles.performDataUpdates) {
      spreadsheetEvent.isAllDay ?
        calendar.createAllDayEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.options) :
        calendar.createEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.endDateTime, spreadsheetEvent.options);
    }
  }
}

class EventsFromUserCalendarsStateBuilder {
  build(user, fromDate=new Date('January 1, 2000'), toDate=new Date('January 1, 3000')) {
    const googleCalendarEvents = user.calendar.getEvents(fromDate, toDate);
    var calendarEvents = [];
    googleCalendarEvents.forEach((googleCalendarEvent) => {
      calendarEvents.push({
        title: googleCalendarEvent.getTitle(),
        startDateTime: googleCalendarEvent.getStartTime(),
        endDateTime: googleCalendarEvent.getEndTime(),
        isAllDay: googleCalendarEvent.isAllDayEvent(),
        existsInSpreadsheet: false,
        options: {
          description: googleCalendarEvent.getDescription(),
          location: googleCalendarEvent.getLocation()
        },
        gcal: googleCalendarEvent,
        gcalId: googleCalendarEvent.getId()
      });
    });
    return calendarEvents;
  }
}

class EventsFromSpreadsheetStateBuilder {
  build(user) {
    var extractionState = {
      currentWidget: '',
      events: [],
      user: user,
      exclusionListNames: this.getOtherUsersNames(user),
      fillInTheBlanksDate: state.today
    }

    state.sheets.forEach((sheet) => {
      if(sheet.hasWidgets) {
        for(var widgetName in sheet.widgets) {
          var widget = sheet.widgets[widgetName];
          if(widget.hasEvents) {
            this.buildEventsFromWidget(sheet, widget, extractionState);
          }
        }
      }
    });

    return extractionState.events;
  }

  getOtherUsersNames(user) {
    var otherNames = [];
    state.users.forEach((possibleOther) => {
      if(possibleOther.name != user.name) {
        otherNames.push(possibleOther.name);
      }
    });
    return otherNames;
  }

  buildEventsFromWidget(sheet, widget, extractionState) {
    const sheetValues = sheet.sheetRef.getDataRange().getValues();
    for(var i = 0; i < sheetValues.length; i++) {
      const row = sheetValues[i];

      if(this.isWorkDateLabel(row[widget.columns.workDate])) {
        extractionState.currentWidget = sheetValues[i + widget.name.rowOffset][widget.name.column];
      } else if(this.isValidEvent(sheet, row, widget, extractionState)) {
        var eventFromSpreadsheet = this.buildEventFromSheet(sheet, widget, extractionState, row);
        extractionState.events.push(eventFromSpreadsheet);
      }
    }
  }

  isWorkDateLabel(str) {
    return typeof str == 'string' && str.substring(0, state.texts.workDateLabel.length) === state.texts.workDateLabel;
  }

  isValidEvent(sheet, row, widget, extractionState) {
    var validity = {
      isScriptResponsiveWidget: sheet.scriptResponsiveWidgetNames.includes(extractionState.currentWidget),
      isNotDoneOrWaiting:       !this.getIsDoneOrWaiting(widget, row),
      isNounColValidString:     typeof row[widget.columns.noun] == 'string' && row[widget.columns.noun].length > 0,
      isVerbColValidString:     typeof row[widget.columns.verb] == 'string' && row[widget.columns.verb].length > 0,
      isValidDate:              widget.allowFillInTheBlanksDates || row[widget.columns.workDate] instanceof Date,
      isValidUser:              !extractionState.exclusionListNames.includes(row[widget.columns.name]),
      isCustomValidated:        typeof customEventWidgetValidation === "undefined" || customEventWidgetValidation(row, widget)
    };
    return Object.values(validity).every(check => check === true);
  }

  buildEventFromSheet(sheet, widget, extractionState, row) {
    var startDateTime, endDateTime, isAllDay;

    if(this.isFillInTheBlanks(row, widget)) {
      isAllDay = true;
      startDateTime = new Date(extractionState.fillInTheBlanksDate);
      endDateTime = null;
    } else {
      const startTime = row[widget.columns.startTime];
      const startTimeHours = this.getStartTimeHours(startTime);
      const startTimeMinutes = this.getStartTimeMinutes(startTime);
      const durationHours = row[widget.columns.durationHours];
      isAllDay = this.getIsAllDay(startTimeHours, startTimeMinutes, durationHours);
      startDateTime = new Date(row[widget.columns.workDate]);
      startDateTime = this.getPulledForward(startDateTime);

      if(isAllDay) {
        endDateTime = null;
      } else {
        startDateTime.setHours(startTimeHours);
        startDateTime.setMinutes(startTimeMinutes);
        startDateTime.setSeconds(0);
        startDateTime.setMilliseconds(0);
        endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + durationHours);
        endDateTime.setMinutes((durationHours - Math.floor(durationHours)) * 60);
        endDateTime.setSeconds(0);
        endDateTime.setMilliseconds(0);
      }
    }

    return {
      title: row[widget.columns.noun] + ': ' + row[widget.columns.verb],
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      isAllDay: isAllDay,
      options: {
        description: this.generateDescription(sheet, widget, extractionState, row),
        location: extractionState.currentWidget,
        guests: extractionState.user.inviteEmail
      },
      isAlreadyInCalendar: false
    };
  }

  getIsAllDay(startTimeHours, startTimeMinutes, durationHours) {
    return !(
      isValidNumber(startTimeHours) && startTimeHours >= 0 && startTimeHours <= 23 &&
      isValidNumber(startTimeMinutes) && startTimeMinutes >= 0 && startTimeMinutes <= 59 &&
      isValidNumber(durationHours) && durationHours > 0
    );
  }

  getStartTimeHours(startTime) {
    return isValidTimeString(startTime) ? startTime.split(':')[0] : false;
  }

  getStartTimeMinutes(startTime) {
    return isValidTimeString(startTime) ? startTime.split(':')[1] : false;
  }

  isFillInTheBlanks(row, widget) {
    return widget.allowFillInTheBlanksDates && (!(row[widget.columns.workDate] instanceof Date));
  }

  getPulledForward(dateTime) {
    if(dateTime < state.today) {
      var pulledForwardDate = new Date(dateTime);
      pulledForwardDate.setFullYear(state.today.getFullYear());
      pulledForwardDate.setMonth(state.today.getMonth());
      pulledForwardDate.setDate(state.today.getDate());
      return pulledForwardDate;
    }
    return dateTime;
  }

  getIsDoneOrWaiting(widget, row) {
    if(widget.hasDoneCol) {
      return row[widget.columns.done] === 'Yes' || row[widget.columns.done] === 'Waiting';
    }
    return false;
  }

  generateDescription(sheet, widget, extractionState, row) {
    var name = row[widget.columns.name];
    name = typeof customNameSubstitution === "undefined" ? name : customNameSubstitution(name);

    return 'This event is from the "' + extractionState.currentWidget +
      '" widget' + (name ? ' for ' + name : '') +
      '.\n\nCreated by <a href="https://docs.google.com/spreadsheets/d/' + config.gsheet.id +
      '/edit?usp=sharing' +
      (sheet.hasId ? '#gid=' + sheet.id : '') +
      '">' + config.gsheet.name + '</a>&nbsp;&larr; Click here for more';
  }
}