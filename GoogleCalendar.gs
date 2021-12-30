class GoogleCalendar {
  deleteEvent(calendarEvent) {
    logEventDeleted(calendarEvent);
    if(config.toggles.performDataUpdates) {
      calendarEvent.gcal.deleteEvent();
    }
  }

  createEvent(spreadsheetEvent, calendar) {
    logEventCreated(spreadsheetEvent);
    if(config.toggles.performDataUpdates) {
      spreadsheetEvent.isAllDay ?
        calendar.createAllDayEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.options) :
        calendar.createEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.endDateTime, spreadsheetEvent.options);
    }
  }

  getEvents(calendar, fromDate=new Date('January 1, 2000'), toDate=new Date('January 1, 3000')) {
    const googleCalendarEvents = calendar.getEvents(fromDate, toDate);
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