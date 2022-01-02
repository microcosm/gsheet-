class Builder_ApplicationStateFromSpreadsheet {
  constructor(spreadsheet) {
    state = {
      spreadsheet: spreadsheet,
      people: [],
      scriptSheets: [],
      builders: {
        peopleFromSpreadsheetValues: new Builder_PeopleFromSpreadsheetValues(),
        eventsFromPersonCalendar: new Builder_EventsFromPersonCalendar(),
        eventsFromSpreadsheet: new Builder_EventsFromSpreadsheet()
      },
      buildList: [],
      features: {
        updateCalendarFromSpreadsheet: new Feature_UpdateCalendarFromSpreadsheet()
      },
      executionList: [],
      texts: {
        errorLabel: 'Custom script failed: ',
        workDateLabel: 'Work date'
      },
      valuesSheet: null,
      today: getTodaysDate(),
      execution: { lock: null, timeout: 60000 },
      log: '',
    };
  }
}

class Builder_PeopleFromSpreadsheetValues {
  build() {
    const peopleColumnIndex = state.valuesSheet.config.columns.people;
    const values = state.valuesSheet.getValuesOf(peopleColumnIndex);

    const numValuesPerPerson = 3;

    for(var i = 0; i < values.length; i += numValuesPerPerson) {
      if(values[i] && values[i + 1]){
        state.people.push({
          name: values[i],
          calendar: CalendarApp.getCalendarById(values[i + 1]),
          inviteEmail: values.length >= i + numValuesPerPerson ? values[i + 2] : '',
          calendarEvents: null,
          spreadsheetEvents: null
        });
      }
    }
  }
}

class Builder_EventsFromPersonCalendar {
  build() {
    state.people.forEach((person) => {
      person.calendarEvents = this.getCalendarEventsForPerson(person);
    });
  }

  getCalendarEventsForPerson(person, fromDate=new Date('January 1, 2000'), toDate=new Date('January 1, 3000')) {
    const googleCalendarEvents = person.calendar.getEvents(fromDate, toDate);
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

class Builder_EventsFromSpreadsheet {
  build() {
    state.people.forEach((person) => {
      person.spreadsheetEvents = this.getSpreadsheetEventsForPerson(person);
    });
  }

  getSpreadsheetEventsForPerson(person) {
    var extractionState = {
      currentWidget: '',
      events: [],
      person: person,
      exclusionListNames: this.getOtherPeopleNames(person),
      fillInTheBlanksDate: state.today
    }

    state.scriptSheets.forEach((sheet) => {
      for(var widgetName in sheet.widgets) {
        var widget = sheet.widgets[widgetName];
        if(widget.hasEvents) {
          this.buildEventsFromWidget(sheet, widget, extractionState);
        }
      }
    });

    return extractionState.events;
  }

  getOtherPeopleNames(person) {
    var otherPeopleNames = [];
    state.people.forEach((possibleOther) => {
      if(possibleOther.name != person.name) {
        otherPeopleNames.push(possibleOther.name);
      }
    });
    return otherPeopleNames;
  }

  buildEventsFromWidget(sheet, widget, extractionState) {
    const scriptRangeValues = sheet.getScriptRangeValues();

    for(var i = 0; i < scriptRangeValues.length; i++) {
      const row = scriptRangeValues[i];

      if(this.isWorkDateLabel(row[widget.scriptRangeColumns.workDate])) {
        extractionState.currentWidget = scriptRangeValues[i - 1][widget.scriptRangeColumns.label];
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
    return sheet.scriptResponsiveWidgetNames.includes(extractionState.currentWidget) &&
           !this.getIsDoneOrWaiting(widget, row) &&
           (typeof row[widget.scriptRangeColumns.noun] == 'string' && row[widget.scriptRangeColumns.noun].length > 0) &&
           (typeof row[widget.scriptRangeColumns.verb] == 'string' && row[widget.scriptRangeColumns.verb].length > 0) &&
           (widget.allowFillInTheBlanksDates || row[widget.scriptRangeColumns.workDate] instanceof Date) &&
           !extractionState.exclusionListNames.includes(row[widget.scriptRangeColumns.name]) &&
           (typeof customEventWidgetValidation === "undefined" || customEventWidgetValidation(row, widget))
  }

  buildEventFromSheet(sheet, widget, extractionState, row) {
    var startDateTime, endDateTime, isAllDay;

    if(this.isFillInTheBlanks(row, widget)) {
      isAllDay = true;
      startDateTime = new Date(extractionState.fillInTheBlanksDate);
      endDateTime = null;
    } else {
      const startTime = row[widget.scriptRangeColumns.startTime];
      const startTimeHours = this.getStartTimeHours(startTime);
      const startTimeMinutes = this.getStartTimeMinutes(startTime);
      const durationHours = row[widget.scriptRangeColumns.durationHours];
      isAllDay = this.getIsAllDay(startTimeHours, startTimeMinutes, durationHours);
      startDateTime = new Date(row[widget.scriptRangeColumns.workDate]);
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
      title: row[widget.scriptRangeColumns.noun] + ': ' + row[widget.scriptRangeColumns.verb],
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      isAllDay: isAllDay,
      options: {
        description: this.generateDescription(sheet, widget, extractionState, row),
        location: extractionState.currentWidget,
        guests: extractionState.person.inviteEmail
      },
      isAlreadyInCalendar: false
    };
  }

  getIsAllDay(startTimeHours, startTimeMinutes, durationHours) {
    return !(
      isValidNumber(startTimeHours) && startTimeHours >= 0 && startTimeHours <= 23 &&
      isValidNumber(startTimeMinutes) && startTimeMinutes >= 0 && startTimeMinutes <= 59 &&
      isValidNumber(durationHours) && durationHours > 0);
  }

  getStartTimeHours(startTime) {
    return isValidTimeString(startTime) ? startTime.split(':')[0] : false;
  }

  getStartTimeMinutes(startTime) {
    return isValidTimeString(startTime) ? startTime.split(':')[1] : false;
  }

  isFillInTheBlanks(row, widget) {
    return widget.allowFillInTheBlanksDates && (!(row[widget.scriptRangeColumns.workDate] instanceof Date));
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
      return row[widget.scriptRangeColumns.done] === 'Yes' || row[widget.scriptRangeColumns.done] === 'Waiting';
    }
    return false;
  }

  generateDescription(sheet, widget, extractionState, row) {
    const name = getNameSubstitution(row[widget.scriptRangeColumns.name]);

    return 'This event is from the "' + extractionState.currentWidget +
      '" widget' + (name ? ' for ' + name : '') +
      '.\n\nCreated by <a href="https://docs.google.com/spreadsheets/d/' + config.gsheet.id +
      '/edit?usp=sharing' +
      (sheet.hasOwnProperty('id') ? '#gid=' + sheet.id : '') +
      '">' + config.gsheet.name + '</a>&nbsp;&larr; Click here for more';
  }
}