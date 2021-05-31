var data, log;

function init() {
  log = "";
  data = {
    spreadsheet: SpreadsheetApp.getActiveSpreadsheet(),
    season: null,
    people: null,
    eventDescription: 'Created by <a href="https://docs.google.com/spreadsheets/d/1uNxspHrfm9w-DPH1wfhTNdySxupd7h1RFrWlHCYPVcs/edit?usp=sharing#gid=966806031">mega—</a>',
    values: {
      sheetName: '(dropdowns)',
      sheet: null,
      range: {
        start: 'K2',
        end: 'K5'
      }
    },
    cycles: {
      sheetName: 'Cycles',
      sheet: null,
      range: {
        offsets: {
          row: 2,
          col: 2
        },
        maxRows: 500,
        maxCols: 14
      },
      workDateLabel: 'Work date (calc)',
      seasonStringLength: 6,
      seasons: {
        evergreen: 1,
        summer: 2,
        winter: 3
      },
      seasonNames: {
        1: 'Evergreen',
        2: 'Summer',
        3: 'Winter'
      },
      columns: {
        noun: 2,
        verb: 3,
        lastDone: 4,
        name: 6,
        cycleDays: 7,
        nudgeDays: 11,
        startTime: 12,
        durationHours: 13,
        workDate: 14,
        season: 15
      },
      triggerColumns: null,
      rangeColumns: {}
    }
  };

  data.cycles.sheet = data.spreadsheet.getSheetByName(data.cycles.sheetName);
  data.values.sheet = data.spreadsheet.getSheetByName(data.values.sheetName);

  data.people = getPeople();

  data.cycles.triggerColumns = [
    data.cycles.columns.noun,
    data.cycles.columns.verb,
    data.cycles.columns.lastDone,
    data.cycles.columns.name,
    data.cycles.columns.cycleDays,
    data.cycles.columns.nudgeDays,
    data.cycles.columns.startTime,
    data.cycles.columns.durationHours,
    data.cycles.columns.season
  ];

  for(var key in data.cycles.columns) {
    data.cycles.rangeColumns[key] = data.cycles.columns[key] - data.cycles.range.offsets.col;
  }
}

function onEditInstalledTrigger(e) {
  init();
  if(!isValidTrigger(e)) return;
  updateCalendars();
}

function isValidTrigger(e){
  return data.spreadsheet.getActiveSheet().getName() === data.cycles.sheetName &&
    data.cycles.triggerColumns.indexOf(e.range.columnStart) != -1
}

function getPeople() {
  const values = data.values.sheet.getRange(data.values.range.start + ':' + data.values.range.end).getValues();
  var people = [];
  for(var i = 0; i < values.length; i+=2) {
    if(values[i][0] && values[i + 1][0]){
      people.push({
        name: values[i][0],
        calendar: CalendarApp.getCalendarById(values[i + 1][0])
      });
    }
  }
  return people;
}

function updateCalendars() {
  data.people.forEach(function(person) {
    const cyclesRangeValues = getCyclesRangeValues();
    data.season = getSeason(cyclesRangeValues);
    var spreadsheetEvents = getSpreadsheetEvents(person, cyclesRangeValues);
    var calendarEvents = getCalendarEvents(person);
    linkMatchingEvents(spreadsheetEvents, calendarEvents);
    updateChangedEvents(person, spreadsheetEvents, calendarEvents);
  });
  alertLog();
}

function linkMatchingEvents(spreadsheetEvents, calendarEvents) {
  spreadsheetEvents.forEach(function(spreadsheetEvent) {
    var matchingCalendarEvent = findInCalendarEvents(spreadsheetEvent, calendarEvents);
    if(matchingCalendarEvent) {
      matchingCalendarEvent.existsInSpreadsheet = true;
      spreadsheetEvent.existsInCalendar = true;
    }
    logEventFound(spreadsheetEvent, matchingCalendarEvent);
  });
  logNewline();
}

function updateChangedEvents(person, spreadsheetEvents, calendarEvents) {
  calendarEvents.forEach(function(calendarEvent) {
    if(!calendarEvent.existsInSpreadsheet){
      logEventDeleted(calendarEvent);
      calendarEvent.gcal.deleteEvent();
    }
  });
  spreadsheetEvents.forEach(function(spreadsheetEvent){
    if(!spreadsheetEvent.existsInCalendar) {
      logEventCreated(spreadsheetEvent);
      spreadsheetEvent.isAllDay ?
        person.calendar.createAllDayEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.options) :
        person.calendar.createEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.endDateTime, spreadsheetEvent.options);
    }
  });
  logNewline();
}

function getCyclesRangeValues() {
  return data.cycles.sheet.getRange(
    data.cycles.range.offsets.row,
    data.cycles.range.offsets.col,
    data.cycles.range.maxRows,
    data.cycles.range.maxCols).getValues();
}

function getCalendarEvents(person) {
  const fromDate = new Date('January 1, 2000');
  const toDate = new Date('January 1, 3000');
  const googleCalendarEvents = person.calendar.getEvents(fromDate, toDate);
  var calendarEvents = [];
  googleCalendarEvents.forEach(function(googleCalendarEvent) {
    calendarEvents.push(buildEventFromCalendar(googleCalendarEvent));
  });
  return calendarEvents;
}

function getSpreadsheetEvents(person, cyclesRange) {
  var events = [];
  var currentRange = 0;
  events[currentRange] = [];
  const exclusionListNames = getOtherPeopleNames(person);

  for(var i = 0; i < cyclesRange.length; i++) {
    const cyclesRow = cyclesRange[i];
    if(cyclesRow[data.cycles.rangeColumns.workDate] === data.cycles.workDateLabel) {
      currentRange++;
      events[currentRange] = [];
    } else if(isApplicableEvent(cyclesRow, exclusionListNames)){
      events[currentRange].push(buildEventFromSpreadsheet(cyclesRow, data.cycles.seasonNames[currentRange]));
    }
  }

  return events[data.cycles.seasons.evergreen].concat(data.season === 'Summer' ? events[data.cycles.seasons.summer] : events[data.cycles.seasons.winter]);
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

function buildEventFromSpreadsheet(cyclesRow, seasonName) {
  const startTime = cyclesRow[data.cycles.rangeColumns.startTime];
  const durationHours = cyclesRow[data.cycles.rangeColumns.durationHours];
  var startDateTime = new Date(cyclesRow[data.cycles.rangeColumns.workDate]);
  startDateTime.setHours(startTime);
  var endDateTime = new Date(cyclesRow[data.cycles.rangeColumns.workDate]);
  endDateTime.setHours(startTime + durationHours);
  endDateTime.setMinutes((durationHours - Math.floor(durationHours)) * 60);

  return {
    title: cyclesRow[data.cycles.rangeColumns.noun] + ': ' + cyclesRow[data.cycles.rangeColumns.verb] + ' (' + cyclesRow[data.cycles.rangeColumns.name] + ')',
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    isAllDay: isAllDay(startTime, durationHours),
    options: {
      description: data.eventDescription,
      location: seasonName
    },
    isAlreadyInCalendar: false
  };
}

function isAllDay(startTime, durationHours) {
  return !(
    startTime >= 0 &&
    startTime <= 24 &&
    durationHours > 0);
}

function getOtherPeopleNames(person) {
  var otherPeopleNames = [];
  data.people.forEach(function(possibleOther) {
    if(possibleOther.name != person.name) {
      otherPeopleNames.push(possibleOther.name);
    }
  });
  return otherPeopleNames;
}

function isApplicableEvent(cyclesRow, exclusionListNames) {
  return cyclesRow[data.cycles.rangeColumns.workDate] instanceof Date &&
         !exclusionListNames.includes(cyclesRow[data.cycles.rangeColumns.name])
}

function getSeason(cyclesRange) {
  const statusStr = cyclesRange[0][data.cycles.rangeColumns.season];
  return statusStr.substring(statusStr.length - data.cycles.seasonStringLength);
}

function findInCalendarEvents(spreadsheetEvent, calendarEvents) {
  var match = false;
  calendarEvents.forEach(function(calendarEvent) {
    var isEqual =
      calendarEvent.title === spreadsheetEvent.title &&
      calendarEvent.startDateTime.getTime() === spreadsheetEvent.startDateTime.getTime() &&
      (calendarEvent.isAllDay ? true : calendarEvent.endDateTime.getTime() === spreadsheetEvent.endDateTime.getTime()) &&
      calendarEvent.isAllDay === spreadsheetEvent.isAllDay &&
      calendarEvent.options.location === spreadsheetEvent.options.location;
    if(isEqual) {
      match = calendarEvent;
    }
  });
  return match;
}

function logEventFound(event, hasMatch) {
  log +=
    (hasMatch ? '' : '* ') +
    ' [' + event.options.location + '] ' +
    event.title + ' ' +
    event.startDateTime + 
    (event.isAllDay ?
      ' ALL DAY' :
      ' until ' + event.endDateTime.getHours() + ':' + event.endDateTime.getMinutes()
    ) + '\n';
}

function logEventDeleted(event) {
  log += "Deleting " + event.title + "\n";
}

function logEventCreated(event) {
  log += "Creating " + event.title + "\n";
}

function logNewline() {
  log += "\n";
}

function alertLog() {
  SpreadsheetApp.getUi().alert(log);
}