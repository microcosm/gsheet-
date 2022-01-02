class Feature_UpdateCalendarFromSpreadsheet extends Feature {
  constructor() {
    super();
    this.featureName = 'Update Calendar From Spreadsheet';
  }

  execute() {
    logFeatureExecution(this.featureName);
    state.users.forEach((user) => {
      this.discoverMatchingEvents(user);
      this.deleteUnmatchedCalendarEvents(user);
      this.createUnmatchedSpreadsheetEvents(user);
      logNewline();
    });
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
    logNewline();
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