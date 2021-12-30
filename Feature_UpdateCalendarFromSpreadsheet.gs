class Feature_UpdateCalendarFromSpreadsheet extends Feature {
  execute() {
    state.people.forEach((person) => {
      this.discoverMatchingEvents(person);
      this.deleteUnmatchedCalendarEvents(person);
      this.createUnmatchedSpreadsheetEvents(person);
      logNewline();
    });
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
        this.deleteCalendarEvent(calendarEvent);
      }
    });
  }

  createUnmatchedSpreadsheetEvents(person) {
    person.spreadsheetEvents.forEach((spreadsheetEvent) => {
      if(!spreadsheetEvent.existsInCalendar) {
        this.createCalendarEvent(spreadsheetEvent, person.calendar);
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