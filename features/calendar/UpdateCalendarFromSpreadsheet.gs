class UpdateCalendarFromSpreadsheet extends Feature {
  constructor(sheet) {
    super(sheet);
    this.name = 'Update Calendar From Spreadsheet';
    this.addResponseCapability(Event.onSpreadsheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
  }

  execute() {
    super.execute();
    this.eventsFromUserCalendarsStateBuilder = new EventsFromUserCalendarsStateBuilder();
    this.eventsFromSpreadsheetStateBuilder = new EventsFromSheetStateBuilder(this);
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
      logCalendarEventFound(spreadsheetEvent, matchingCalendarEvent);
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
    logCalendarEventDeleted(calendarEvent);
    if(config.toggles.performDataUpdates) {
      calendarEvent.gcal.deleteEvent();
    }
  }

  createCalendarEvent(spreadsheetEvent, calendar) {
    logCalendarEventCreated(spreadsheetEvent);
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

class EventsFromSheetStateBuilder {
  constructor(feature) {
    this.sheet = feature.sheet;
    this.config = feature.config;
    this.currentWidget = '';
    this.events = [];
    this.fillInTheBlanksDate = state.today;
  }

  build(user) {
    this.user = user;
    this.exclusionListNames = this.getOtherUsersNames(user);
    for(var widgetCategory in this.config.widgetCategories) {
      this.widgetCategory = this.config.widgetCategories[widgetCategory];
      this.columns = this.widgetCategory.columns.zeroBasedIndices;
      this.buildEventsFromWidgetCategory();
    }
    return this.events;
  }

  buildEventsFromWidgetCategory() {
    const sheetValues = this.sheet.getValues();
    for(var i = 0; i < sheetValues.length; i++) {
      const row = sheetValues[i];

      if(this.isWorkDateLabel(row[this.columns.workDate])) {
        this.currentWidget = sheetValues[i + this.widgetCategory.name.rowOffset][this.widgetCategory.name.column.zeroBasedIndex];
      } else if(this.isValidEvent(row)) {
        var eventFromSpreadsheet = this.buildEventFromRow(row);
        this.events.push(eventFromSpreadsheet);
      }
    }
  }

  isWorkDateLabel(str) {
    return typeof str == 'string' && str.substring(0, state.texts.workDateLabel.length) === state.texts.workDateLabel;
  }

  isValidEvent(row) {
    var validity = {
      isScriptResponsiveWidget: this.config.scriptResponsiveWidgetNames.includes(this.currentWidget),
      isNotDoneOrWaiting:       !this.getIsDoneOrWaiting(this.widgetCategory, row),
      isNounColValidString:     typeof row[this.columns.noun] == 'string' && row[this.columns.noun].length > 0,
      isVerbColValidString:     typeof row[this.columns.verb] == 'string' && row[this.columns.verb].length > 0,
      isValidDate:              this.widgetCategory.allowFillInTheBlanksDates || row[this.columns.workDate] instanceof Date,
      isValidUser:              !this.exclusionListNames.includes(row[this.columns.name]),
      isCustomValidated:        typeof isValidCustomSheetEventData === "undefined" || isValidCustomSheetEventData(row, this.widgetCategory.columns)
    };
    return Object.values(validity).every(check => check === true);
  }

  buildEventFromRow(row) {
    var startDateTime, endDateTime, isAllDay;

    if(this.isFillInTheBlanks(row, this.widgetCategory)) {
      isAllDay = true;
      startDateTime = new Date(this.fillInTheBlanksDate);
      endDateTime = null;
    } else {
      const startTime = row[this.columns.startTime];
      const startTimeHours = this.getStartTimeHours(startTime);
      const startTimeMinutes = this.getStartTimeMinutes(startTime);
      const durationHours = row[this.columns.durationHours];
      isAllDay = this.getIsAllDay(startTimeHours, startTimeMinutes, durationHours);
      startDateTime = new Date(row[this.columns.workDate]);
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
      title: row[this.columns.noun] + ': ' + row[this.columns.verb],
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      isAllDay: isAllDay,
      options: {
        description: this.generateDescription(row),
        location: this.currentWidget,
        guests: this.user.inviteEmail
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

  isFillInTheBlanks(row, widgetCategory) {
    return widgetCategory.allowFillInTheBlanksDates && (!(row[this.columns.workDate] instanceof Date));
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

  getIsDoneOrWaiting(widgetCategory, row) {
    if(widgetCategory.hasDoneCol) {
      return row[this.columns.done] === 'Yes' || row[this.columns.done] === 'Waiting';
    }
    return false;
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

  generateDescription(row) {
    var name = row[this.columns.name];
    name = typeof customNameSubstitution === "undefined" ? name : customNameSubstitution(name);

    return 'This event is from the "' + this.currentWidget +
      '" widget' + (name ? ' for ' + name : '') +
      '.\n\nCreated by <a href="https://docs.google.com/spreadsheets/d/' + config.gsheet.id +
      '/edit?usp=sharing' +
      (this.sheet.hasId ? '#gid=' + this.sheet.id : '') +
      '">' + config.gsheet.name + '</a>&nbsp;&larr; Click here for more';
  }
}