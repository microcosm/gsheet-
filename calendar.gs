function getCalendarEvents(calendar) {
  const fromDate = new Date('January 1, 2000'), toDate = new Date('January 1, 3000');
  const googleCalendarEvents = calendar.getEvents(fromDate, toDate);
  var calendarEvents = [];
  googleCalendarEvents.forEach(function(googleCalendarEvent) {
    calendarEvents.push(buildEventFromCalendar(googleCalendarEvent));
  });
  return calendarEvents;
}

function updateCalendarChangedEvents(person) {
  person.calendarEvents.forEach(function(calendarEvent) {
    if(!calendarEvent.existsInSpreadsheet){
      logEventDeleted(calendarEvent);
      if(state.execution.performDataUpdates) calendarEvent.gcal.deleteEvent();
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

function generateDescription(row, section, seasonName) {
  var name = row[section.rangeColumns.name];
  name = name.replace('Either', 'either Julie or Andy');
  name = name.replace('Both', 'both Julie and Andy together');
  return 'This is a ' + seasonName + ' ' + (seasonName.includes('->') ? 'checklist' : 'regular') + ' task for ' +  name + '.\n\n' +
    state.eventDescription;
}function getCalendarEvents(calendar) {
  const fromDate = new Date('January 1, 2000'), toDate = new Date('January 1, 3000');
  const googleCalendarEvents = calendar.getEvents(fromDate, toDate);
  var calendarEvents = [];
  googleCalendarEvents.forEach(function(googleCalendarEvent) {
    calendarEvents.push(buildEventFromCalendar(googleCalendarEvent));
  });
  return calendarEvents;
}

function updateCalendarChangedEvents(person) {
  person.calendarEvents.forEach(function(calendarEvent) {
    if(!calendarEvent.existsInSpreadsheet){
      logEventDeleted(calendarEvent);
      if(state.execution.performDataUpdates) calendarEvent.gcal.deleteEvent();
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

function generateDescription(row, section, seasonName) {
  var name = row[section.rangeColumns.name];
  name = name.replace('Either', 'either Julie or Andy');
  name = name.replace('Both', 'both Julie and Andy together');
  return 'This is a ' + seasonName + ' ' + (seasonName.includes('->') ? 'checklist' : 'regular') + ' task for ' +  name + '.\n\n' +
    state.eventDescription;
}