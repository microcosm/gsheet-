function getCalendarEvents(calendar) {
  const fromDate = new Date('January 1, 2000'), toDate = new Date('January 1, 3000');
  const googleCalendarEvents = calendar.getEvents(fromDate, toDate);
  var calendarEvents = [];
  googleCalendarEvents.forEach(function(googleCalendarEvent) {
    calendarEvents.push(buildEventFromCalendar(googleCalendarEvent));
  });
  return calendarEvents;
}

function deleteOrphanedCalendarEvents(person) {
  person.calendarEvents.forEach(function(calendarEvent) {
    if(!calendarEvent.existsInSpreadsheet){
      logEventDeleted(calendarEvent);
      if(state.execution.performDataUpdates) calendarEvent.gcal.deleteEvent();
    }
  });
}

function createNewCalendarEvents(person) {
  person.spreadsheetEvents.forEach(function(spreadsheetEvent){
    if(!spreadsheetEvent.existsInCalendar) {
      logEventCreated(spreadsheetEvent);
      if(state.execution.performDataUpdates) {
        spreadsheetEvent.isAllDay ?
          person.calendar.createAllDayEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.options) :
          person.calendar.createEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.endDateTime, spreadsheetEvent.options);
      }
    }
  });
}

function buildEventFromCalendar(googleCalendarEvent) {
  return {
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
  };
}

function getCalendarEventDescription() {
  return 'Created by <a href="https://docs.google.com/spreadsheets/d/' +
    config.gsheet.id +
    '/edit?usp=sharing' +
    (config.gsheet.tab ? '#gid=' + config.gsheet.tab : '') +
    '">mega—</a>&nbsp;&larr; Click here for more';
}