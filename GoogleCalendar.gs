class GoogleCalendar {
  deleteOrphanedCalendarEvents(person) {
    person.calendarEvents.forEach(function(calendarEvent) {
      if(!calendarEvent.existsInSpreadsheet){
        logEventDeleted(calendarEvent);
        if(config.toggles.performDataUpdates) calendarEvent.gcal.deleteEvent();
      }
    });
  }

  createNewCalendarEvents(person) {
    person.spreadsheetEvents.forEach(function(spreadsheetEvent){
      if(!spreadsheetEvent.existsInCalendar) {
        logEventCreated(spreadsheetEvent);
        if(config.toggles.performDataUpdates) {
          spreadsheetEvent.isAllDay ?
            person.calendar.createAllDayEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.options) :
            person.calendar.createEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.endDateTime, spreadsheetEvent.options);
        }
      }
    });
  }

  getCalendarEvents(calendar, fromDate=new Date('January 1, 2000'), toDate=new Date('January 1, 3000')) {
    const googleCalendarEvents = calendar.getEvents(fromDate, toDate);
    var calendarEvents = [];
    googleCalendarEvents.forEach(function(googleCalendarEvent) {
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