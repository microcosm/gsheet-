class DashExecutor {
  updateGoogleCalendarsFromSpreadsheet() {
    state.people.forEach((person) => {
      this.linkMatchingEvents(person);
      this.updateChangedEvents(person);
    });
  }

  waitForLocks() {
    state.execution.lock = LockService.getScriptLock();
    try {
      state.execution.lock.waitLock(state.execution.timeout);
      logLockObtained();
      return true;
    } catch(e) {
      return false;
    }
  }

  releaseLock() {
    SpreadsheetApp.flush();
    state.execution.lock.releaseLock();
    logLockReleased();
  }

  linkMatchingEvents(person) {
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

  updateChangedEvents(person) {
    state.googleCalendar.deleteOrphanedCalendarEvents(person);
    state.googleCalendar.createNewCalendarEvents(person);
    logNewline();
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