var data;

function init() {
  data = {
    spreadsheet: SpreadsheetApp.getActiveSpreadsheet(),
    season: null,
    transition: null,
    people: null,
    eventDescription: 'Created by <a href="https://docs.google.com/spreadsheets/d/1uNxspHrfm9w-DPH1wfhTNdySxupd7h1RFrWlHCYPVcs/edit?usp=sharing#gid=966806031">mega—</a>',
    log: '',
    lock: null,
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
        maxCols: 24
      },
      workDateLabel: 'Work date (calc)',
      seasonStringLength: 6,
      seasons: {
        evergreen: 1,
        summer: 2,
        winter: 3,
        winterToSummer: 4,
        summerToWinter: 5
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
      rangeColumns: {}
    },
    checklists: {
      columns: {
        noun: 17,
        verb: 18,
        done: 19,
        name: 21,
        day: 22,
        startTime: 23,
        durationHours: 24
      },
      rangeColumns: {}
    },
    triggerColumns: null
  };

  data.cycles.sheet = data.spreadsheet.getSheetByName(data.cycles.sheetName);
  data.values.sheet = data.spreadsheet.getSheetByName(data.values.sheetName);

  data.people = getPeople();

  data.triggerColumns = [
    data.cycles.columns.noun,
    data.cycles.columns.verb,
    data.cycles.columns.lastDone,
    data.cycles.columns.name,
    data.cycles.columns.cycleDays,
    data.cycles.columns.nudgeDays,
    data.cycles.columns.startTime,
    data.cycles.columns.durationHours,
    data.cycles.columns.season,
    data.checklists.columns.noun,
    data.checklists.columns.verb,
    data.checklists.columns.done,
    data.checklists.columns.name,
    data.checklists.columns.day,
    data.checklists.columns.startTime,
    data.checklists.columns.durationHours
  ];

  for(var key in data.cycles.columns) {
    data.cycles.rangeColumns[key] = data.cycles.columns[key] - data.cycles.range.offsets.col;
  }

  for(var key in data.checklists.columns) {
    data.checklists.rangeColumns[key] = data.checklists.columns[key] - data.cycles.range.offsets.col;
  }
}

function onEditInstalledTrigger(e) {
  init();
  if(!isValidTrigger(e)) return;
  if(!waitForLocks()) return;
  updateCalendars();
  releaseLock();
  alertLog();
}

function isValidTrigger(e){
  return data.spreadsheet.getActiveSheet().getName() === data.cycles.sheetName &&
    data.triggerColumns.indexOf(e.range.columnStart) != -1
}

function waitForLocks(){
  data.lock = LockService.getScriptLock();
  try {
    data.lock.waitLock(60000);
    logLockObtained();
    return true;
  } catch(e) {
    return false;
  }
}

function releaseLock() {
  SpreadsheetApp.flush();
  data.lock.releaseLock();
  logLockReleased();
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
    const rangeValues = getRangeValues();
    setSeason(rangeValues);
    var spreadsheetEvents = getSpreadsheetEvents(person, rangeValues);
    var calendarEvents = getCalendarEvents(person);
    linkMatchingEvents(spreadsheetEvents, calendarEvents);
    updateChangedEvents(person, spreadsheetEvents, calendarEvents);
  });
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
      //calendarEvent.gcal.deleteEvent();
    }
  });
  spreadsheetEvents.forEach(function(spreadsheetEvent){
    if(!spreadsheetEvent.existsInCalendar) {
      logEventCreated(spreadsheetEvent);
      //spreadsheetEvent.isAllDay ?
      //  person.calendar.createAllDayEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.options) :
      //  person.calendar.createEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.endDateTime, spreadsheetEvent.options);
    }
  });
  logNewline();
}

function getRangeValues() {
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

function getSpreadsheetEvents(person, rangeValues) {
  var events = [];
  var currentRange = 0;
  events[currentRange] = [];
  const exclusionListNames = getOtherPeopleNames(person);

  for(var i = 0; i < rangeValues.length; i++) {
    const cyclesRow = rangeValues[i];
    if(cyclesRow[data.cycles.rangeColumns.workDate] === data.cycles.workDateLabel) {
      currentRange++;
      events[currentRange] = [];
    } else if(isApplicableEvent(cyclesRow, exclusionListNames)){
      events[currentRange].push(buildEventFromSpreadsheet(cyclesRow, data.cycles.seasonNames[currentRange]));
    }
  }

  return generateEventArray(events);
}

function generateEventArray(eventsHash) {
  var eventArray = eventsHash[data.cycles.seasons.evergreen];

  eventArray = eventArray.concat(
    data.season === 'Summer' ?
    eventsHash[data.cycles.seasons.summer] :
    eventsHash[data.cycles.seasons.winter]);

  return eventArray;
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
  const isAllDay = getIsAllDay(startTime, durationHours)
  var startDateTime = new Date(cyclesRow[data.cycles.rangeColumns.workDate]);
  if(!isAllDay) startDateTime.setHours(startTime);
  var endDateTime = new Date(cyclesRow[data.cycles.rangeColumns.workDate]);
  endDateTime.setHours(startTime + durationHours);
  endDateTime.setMinutes((durationHours - Math.floor(durationHours)) * 60);

  return {
    title: cyclesRow[data.cycles.rangeColumns.noun] + ': ' + cyclesRow[data.cycles.rangeColumns.verb] + ' (' + cyclesRow[data.cycles.rangeColumns.name] + ')',
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    isAllDay: isAllDay,
    options: {
      description: data.eventDescription,
      location: seasonName
    },
    isAlreadyInCalendar: false
  };
}

function getIsAllDay(startTime, durationHours) {
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

function setSeason(rangeValues) {
  const statusStr = rangeValues[0][data.cycles.rangeColumns.season];
  data.season = statusStr.substring(statusStr.length - data.cycles.seasonStringLength);
  var fromSeason = statusStr.substring(0, data.cycles.seasonStringLength);
  data.transition = fromSeason === data.season ? false : statusStr;
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

function logString(str) {
  data.log += str + "\n";
}

function logEventFound(event, hasMatch) {
  data.log +=
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
  data.log += "Deleting " + event.title + "\n";
}

function logEventCreated(event) {
  data.log += "Creating " + event.title + "\n";
}

function logLockObtained() {
  data.log += "Lock obtained...\n";
}

function logLockReleased() {
  data.log += "Lock released.\n";
}

function logNewline() {
  data.log += "\n";
}

function alertLog() {
  SpreadsheetApp.getUi().alert(data.log);
}