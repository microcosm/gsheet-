class Feature_UpdateCalendarFromSpreadsheet {
  constructor() {
    this.sheets = [];
  }

  execute() {
    state.people.forEach((person) => {
      this.discoverMatchingEvents(person);
      this.deleteUnmatchedCalendarEvents(person);
      this.createUnmatchedSpreadsheetEvents(person);
      logNewline();
    });
  }

  registerSheet(sheet) {
    this.sheets.push(sheet);
  }

  isRegisteredFor(sheetName, column) {
    var found = false;
    this.sheets.forEach((sheet) => {
      if(sheet.name === sheetName && sheet.triggerCols.includes(column)) {
        found = true;
      }
    });
    return found;
  }

  discoverMatchingEvents(person) {
    person.spreadsheetEvents.forEach((spreadsheetEvent) => {
      var matchingCalendarEvent = this.findInCalendarEvents(spreadsheetEvent, person.calendarEvents);
      if(matchingCalendarEvent) {
        matchingCalendarEvent.existsInSpreadsheet = true;
        spreadsheetEvent.existsInCalendar = true;
      }
      logEventFound(spreadsheetEvent, matchingCalendarEvent);
    });
    logNewline();
  }

  deleteUnmatchedCalendarEvents(person) {
    person.calendarEvents.forEach((calendarEvent) => {
      if(!calendarEvent.existsInSpreadsheet){
        state.googleCalendar.deleteEvent(calendarEvent);
      }
    });
  }

  createUnmatchedSpreadsheetEvents(person) {
    person.spreadsheetEvents.forEach((spreadsheetEvent) => {
      if(!spreadsheetEvent.existsInCalendar) {
        state.googleCalendar.createEvent(spreadsheetEvent, person.calendar);
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
}