var state, cyclesGlobal, cyclesRegular, cyclesChecklist;

function init() {
  state = {
    execution: {
      performDataUpdates: true,
      showLogAlert: true
    },
    spreadsheet: SpreadsheetApp.getActiveSpreadsheet(),
    triggerColumns: null,
    season: null,
    transition: null,
    people: null,
    eventDescription: 'Created by <a href="https://docs.google.com/spreadsheets/d/1uNxspHrfm9w-DPH1wfhTNdySxupd7h1RFrWlHCYPVcs/edit?usp=sharing#gid=966806031">mega—</a>',
    log: '',
    lock: null,
    workDateLabelText: 'Work date',
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
        3: 'Winter',
        4: 'Winter->Summer',
        5: 'Summer->Winter'
      },
      sections: {
        global: {
          columns: {
            season: 15
          },
          rangeColumns: {}
        },
        regular: {
          columns: {
            noun: 2,
            verb: 3,
            lastDone: 4,
            name: 6,
            cycleDays: 7,
            nudgeDays: 11,
            startTime: 12,
            durationHours: 13,
            workDate: 14
          },
          rangeColumns: {}
        },
        checklist: {
          columns: {
            noun: 17,
            verb: 18,
            done: 19,
            name: 21,
            workDate: 22,
            startTime: 23,
            durationHours: 24
          },
          rangeColumns: {}
        }
      }
    }
  };

  state.cycles.sheet = state.spreadsheet.getSheetByName(state.cycles.sheetName);
  state.values.sheet = state.spreadsheet.getSheetByName(state.values.sheetName);

  state.people = getPeople();

  cyclesGlobal = state.cycles.sections.global;
  cyclesRegular = state.cycles.sections.regular;
  cyclesChecklist = state.cycles.sections.checklist;
  generateRangeColumns(cyclesGlobal);
  generateRangeColumns(cyclesRegular);
  generateRangeColumns(cyclesChecklist);

  state.triggerColumns = [
    cyclesGlobal.columns.season,
    cyclesRegular.columns.noun,
    cyclesRegular.columns.verb,
    cyclesRegular.columns.lastDone,
    cyclesRegular.columns.name,
    cyclesRegular.columns.cycleDays,
    cyclesRegular.columns.nudgeDays,
    cyclesRegular.columns.startTime,
    cyclesRegular.columns.durationHours,
    cyclesChecklist.columns.noun,
    cyclesChecklist.columns.verb,
    cyclesChecklist.columns.done,
    cyclesChecklist.columns.name,
    cyclesChecklist.columns.workDate,
    cyclesChecklist.columns.startTime,
    cyclesChecklist.columns.durationHours
  ];
}

function generateRangeColumns(cyclesSection){
  for(var key in cyclesSection.columns) {
    cyclesSection.rangeColumns[key] = cyclesSection.columns[key] - state.cycles.range.offsets.col;
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
  return state.spreadsheet.getActiveSheet().getName() === state.cycles.sheetName &&
    state.triggerColumns.indexOf(e.range.columnStart) != -1
}

function waitForLocks(){
  state.lock = LockService.getScriptLock();
  try {
    state.lock.waitLock(60000);
    logLockObtained();
    return true;
  } catch(e) {
    return false;
  }
}

function releaseLock() {
  SpreadsheetApp.flush();
  state.lock.releaseLock();
  logLockReleased();
}

function getPeople() {
  const values = state.values.sheet.getRange(state.values.range.start + ':' + state.values.range.end).getValues();
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
  state.people.forEach(function(person) {
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
      if(state.execution.performDataUpdates) calendarEvent.gcal.deleteEvent();
    }
  });
  spreadsheetEvents.forEach(function(spreadsheetEvent){
    if(!spreadsheetEvent.existsInCalendar) {
      logEventCreated(spreadsheetEvent);
      if(state.execution.performDataUpdates) {
        spreadsheetEvent.isAllDay ?
          person.calendar.createAllDayEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.options) :
          person.calendar.createEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.endDateTime, spreadsheetEvent.options);
      }
    }
  });
  logNewline();
}

function getRangeValues() {
  return state.cycles.sheet.getRange(
    state.cycles.range.offsets.row,
    state.cycles.range.offsets.col,
    state.cycles.range.maxRows,
    state.cycles.range.maxCols).getValues();
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
  var extractionState = {
    rangeValues: rangeValues,
    eventsBySeason: [],
    seasonIndex: 0,
    exclusionListNames: getOtherPeopleNames(person)
  }
  extractionState.eventsBySeason[extractionState.seasonIndex] = [];

  populateSpreadsheetSectionEvents(extractionState, cyclesRegular);
  populateSpreadsheetSectionEvents(extractionState, cyclesChecklist);

  return collapseEventsToArray(extractionState.eventsBySeason);
}

function populateSpreadsheetSectionEvents(extractionState, section) {
  for(var i = 0; i < extractionState.rangeValues.length; i++) {
    const row = extractionState.rangeValues[i];
    if(isWorkDateLabel(row[section.rangeColumns.workDate])) {
      extractionState.seasonIndex++;
      extractionState.eventsBySeason[extractionState.seasonIndex] = [];
    } else if(isValidEventData(row, extractionState.exclusionListNames, section)){
      var eventFromSpreadsheet = buildEventFromSpreadsheet(row, state.cycles.seasonNames[extractionState.seasonIndex], section);
      extractionState.eventsBySeason[extractionState.seasonIndex].push(eventFromSpreadsheet);
    }
  }
}

function isWorkDateLabel(str) {
  return typeof str == 'string' && str.substring(0, state.workDateLabelText.length) === state.workDateLabelText;
}

function collapseEventsToArray(eventsBySeason) {
  var eventArray = eventsBySeason[state.cycles.seasons.evergreen];

  eventArray = eventArray.concat(
    state.season === 'Summer' ?
      eventsBySeason[state.cycles.seasons.summer] :
      eventsBySeason[state.cycles.seasons.winter]);

  if(state.transition) {
    var checklistEvents = state.transition === 'Winter->Summer' ?
      eventsBySeason[state.cycles.seasons.winterToSummer] :
      eventsBySeason[state.cycles.seasons.summerToWinter];
    eventArray = eventArray.concat(checklistEvents);
  }

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

function isValidEventData(row, exclusionListNames, section) {
  return row[section.rangeColumns.workDate] instanceof Date &&
         !exclusionListNames.includes(row[section.rangeColumns.name])
}

function buildEventFromSpreadsheet(row, seasonName, section) {
  const startTime = row[section.rangeColumns.startTime];
  const durationHours = row[section.rangeColumns.durationHours];
  const isAllDay = getIsAllDay(startTime, durationHours)
  var startDateTime = new Date(row[section.rangeColumns.workDate]);
  if(!isAllDay) startDateTime.setHours(startTime);
  var endDateTime = new Date(row[section.rangeColumns.workDate]);
  endDateTime.setHours(startTime + durationHours);
  endDateTime.setMinutes((durationHours - Math.floor(durationHours)) * 60);

  return {
    title: row[section.rangeColumns.noun] + ': ' + row[section.rangeColumns.verb] + ' (' + row[section.rangeColumns.name] + ')',
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    isAllDay: isAllDay,
    options: {
      description: state.eventDescription,
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
  state.people.forEach(function(possibleOther) {
    if(possibleOther.name != person.name) {
      otherPeopleNames.push(possibleOther.name);
    }
  });
  return otherPeopleNames;
}

function setSeason(rangeValues) {
  const statusStr = rangeValues[0][cyclesGlobal.rangeColumns.season];
  state.season = statusStr.substring(statusStr.length - state.cycles.seasonStringLength);
  var fromSeason = statusStr.substring(0, state.cycles.seasonStringLength);
  state.transition = fromSeason === state.season ? false : statusStr;
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
  state.log += str + "\n";
}

function logEventFound(event, hasMatch) {
  state.log +=
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
  state.log += "Deleting " + event.title + "\n";
}

function logEventCreated(event) {
  state.log += "Creating " + event.title + "\n";
}

function logLockObtained() {
  state.log += "Lock obtained...\n";
}

function logLockReleased() {
  state.log += "Lock released.\n";
}

function logNewline() {
  state.log += "\n";
}

function alertLog() {
  if(state.execution.showLogAlert) SpreadsheetApp.getUi().alert(state.log);
}