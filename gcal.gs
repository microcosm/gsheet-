var state, cyclesGlobal, cyclesRegular, cyclesChecklist, todoList;

function init() {
  state = {
    execution: {
      performDataUpdates: true,
      showLogAlert: false
    },
    spreadsheet: SpreadsheetApp.getActiveSpreadsheet(),
    season: null,        //Can be: ['Summer', 'Winter']
    transition: null,    //Can be: [false, 'Summer->Winter', 'Winter->Summer']
    people: null,
    eventDescription: 'Created by <a href="https://docs.google.com/spreadsheets/d/1uNxspHrfm9w-DPH1wfhTNdySxupd7h1RFrWlHCYPVcs/edit?usp=sharing#gid=966806031">mega—</a>&nbsp;&larr; Click here for more',
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
    todo: {
      sheetName: 'Todo',
      sheet: null,
      triggerColumns: null,
      range: {
        offsets: {
          row: 2,
          col: 2
        },
        maxRows: 500,
        maxCols: 11
      },
      columns: {
        noun: 2,
        verb: 3,
        done: 5,
        name: 7,
        workDate: 8,
        startTime: 9,
        durationHours: 10
      },
      rangeColumns: {},
      hasDoneCol: true,
      allowFillInTheBlanksDates: true
    },
    cycles: {
      sheetName: 'Cycles',
      sheet: null,
      triggerColumns: null,
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
          rangeColumns: {},
          hasDoneCol: false
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
          rangeColumns: {},
          hasDoneCol: false,
          allowFillInTheBlanksDates: false
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
          rangeColumns: {},
          hasDoneCol: true,
          allowFillInTheBlanksDates: true
        }
      }
    }
  };

  state.cycles.sheet = state.spreadsheet.getSheetByName(state.cycles.sheetName);
  state.values.sheet = state.spreadsheet.getSheetByName(state.values.sheetName);
  state.todo.sheet = state.spreadsheet.getSheetByName(state.todo.sheetName);

  state.people = getPeople();

  cyclesGlobal = state.cycles.sections.global;
  cyclesRegular = state.cycles.sections.regular;
  cyclesChecklist = state.cycles.sections.checklist;
  todoList = state.todo;
  generateRangeColumns(cyclesGlobal, state.cycles.range.offsets);
  generateRangeColumns(cyclesRegular, state.cycles.range.offsets);
  generateRangeColumns(cyclesChecklist, state.cycles.range.offsets);
  generateRangeColumns(todoList, state.todo.range.offsets);

  state.todo.triggerColumns = [
    todoList.columns.noun,
    todoList.columns.verb,
    todoList.columns.done,
    todoList.columns.name,
    todoList.columns.workDate,
    todoList.columns.startTime,
    todoList.columns.durationHours
  ];

  state.cycles.triggerColumns = [
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

function generateRangeColumns(section, rangeOffsets){
  for(var key in section.columns) {
    section.rangeColumns[key] = section.columns[key] - rangeOffsets.col;
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
  const activeSheetName = state.spreadsheet.getActiveSheet().getName();
  return (
    activeSheetName === state.cycles.sheetName && state.cycles.triggerColumns.includes(e.range.columnStart)) || (
    activeSheetName === state.todo.sheetName && state.todo.triggerColumns.includes(e.range.columnStart)
  );
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
      const name = values[i][0];
      const calendar = CalendarApp.getCalendarById(values[i + 1][0]);
      const calendarEvents = getCalendarEvents(calendar);
      people.push({ name: name, calendar: calendar, calendarEvents: calendarEvents });
    }
  }
  return people;
}

function getCalendarEvents(calendar) {
  const fromDate = new Date('January 1, 2000'), toDate = new Date('January 1, 3000');
  const googleCalendarEvents = calendar.getEvents(fromDate, toDate);
  var calendarEvents = [];
  googleCalendarEvents.forEach(function(googleCalendarEvent) {
    calendarEvents.push(buildEventFromCalendar(googleCalendarEvent));
  });
  return calendarEvents;
}

function updateCalendars() {
  state.people.forEach(function(person) {
    const rangeValuesBySheetName = getRangeValuesBySheetName();
    updateCalendarFromTodo(person, rangeValuesBySheetName[state.todo.sheetName]);
    updateCalendarFromCycles(person, rangeValuesBySheetName[state.cycles.sheetName]);
  });
}

function updateCalendarFromTodo(person, rangeValues) {
  //?
}

function updateCalendarFromCycles(person, rangeValues) {
  setSeason(rangeValues);
  var spreadsheetEvents = getSpreadsheetEvents(person, rangeValues);
  linkMatchingEvents(person, spreadsheetEvents);
  updateChangedEvents(person, spreadsheetEvents);
}

function linkMatchingEvents(person, spreadsheetEvents) {
  spreadsheetEvents.forEach(function(spreadsheetEvent) {
    var matchingCalendarEvent = findInCalendarEvents(spreadsheetEvent, person.calendarEvents);
    if(matchingCalendarEvent) {
      matchingCalendarEvent.existsInSpreadsheet = true;
      spreadsheetEvent.existsInCalendar = true;
    }
    logEventFound(spreadsheetEvent, matchingCalendarEvent);
  });
  logNewline();
}

function updateChangedEvents(person, spreadsheetEvents) {
  person.calendarEvents.forEach(function(calendarEvent) {
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

function getRangeValuesBySheetName() {
  return {
    'Todo': state.todo.sheet.getRange(
      state.todo.range.offsets.row,
      state.todo.range.offsets.col,
      state.todo.range.maxRows,
      state.todo.range.maxCols).getValues(),
    'Cycles': state.cycles.sheet.getRange(
      state.cycles.range.offsets.row,
      state.cycles.range.offsets.col,
      state.cycles.range.maxRows,
      state.cycles.range.maxCols).getValues()
    };
}

function getSpreadsheetEvents(person, rangeValues) {
  var extractionState = {
    rangeValues: rangeValues,
    eventsBySeason: [],
    seasonIndex: 0,
    exclusionListNames: getOtherPeopleNames(person),
    fillInTheBlanksDate: getStarterDate()
  }
  extractionState.eventsBySeason[extractionState.seasonIndex] = [];
  populateSpreadsheetSectionEvents(extractionState, cyclesRegular);
  populateSpreadsheetSectionEvents(extractionState, cyclesChecklist);
  return collapseEventsToArray(extractionState.eventsBySeason);
}

function getStarterDate() {
  var date = new Date();
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

function populateSpreadsheetSectionEvents(extractionState, section) {
  for(var i = 0; i < extractionState.rangeValues.length; i++) {
    const row = extractionState.rangeValues[i];
    if(isWorkDateLabel(row[section.rangeColumns.workDate])) {
      extractionState.seasonIndex++;
      extractionState.eventsBySeason[extractionState.seasonIndex] = [];
    } else if(isValidEventData(row, extractionState, section)) {
      var eventFromSpreadsheet = buildEventFromSpreadsheet(row, extractionState, section);
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

function isValidEventData(row, extractionState, section) {
  var currentExtractionSeason = state.cycles.seasonNames[extractionState.seasonIndex];
  return (currentExtractionSeason === state.season || currentExtractionSeason === state.transition || currentExtractionSeason === 'Evergreen') &&
         !getIsDone(section, row) &&
         (typeof row[section.rangeColumns.noun] == 'string' &&  row[section.rangeColumns.noun].length > 0) &&
         (typeof row[section.rangeColumns.verb] == 'string' &&  row[section.rangeColumns.verb].length > 0) &&
         (section.allowFillInTheBlanksDates || row[section.rangeColumns.workDate] instanceof Date) &&
         !extractionState.exclusionListNames.includes(row[section.rangeColumns.name])
}

function buildEventFromSpreadsheet(row, extractionState, section) {
  const fillInTheBlanks = section.allowFillInTheBlanksDates && (!(row[section.rangeColumns.workDate] instanceof Date));
  var startDateTime, endDateTime, isAllDay;

  if(fillInTheBlanks) {
    isAllDay = true;
    extractionState.fillInTheBlanksDate = extractionState.fillInTheBlanksDate.addDays(1);
    startDateTime = new Date(extractionState.fillInTheBlanksDate);
    endDateTime = null;
  } else {
    const startTime = row[section.rangeColumns.startTime];
    const durationHours = row[section.rangeColumns.durationHours];
    isAllDay = getIsAllDay(startTime, durationHours);
    startDateTime = new Date(row[section.rangeColumns.workDate]);

    if(isAllDay) {
      endDateTime = null;
    } else {
      startDateTime.setHours(startTime);
      endDateTime = new Date(row[section.rangeColumns.workDate]);
      endDateTime.setHours(startTime + durationHours);
      endDateTime.setMinutes((durationHours - Math.floor(durationHours)) * 60);
      endDateTime.setSeconds(0);
      endDateTime.setMilliseconds(0);
    }
  }

  const isDone = getIsDone(section, row);
  const seasonName = state.cycles.seasonNames[extractionState.seasonIndex];

  return {
    title: row[section.rangeColumns.noun] + ': ' + row[section.rangeColumns.verb],
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    isAllDay: isAllDay,
    isDone: isDone,
    options: {
      description: generateDescription(row, section, seasonName),
      location: seasonName
    },
    isAlreadyInCalendar: false
  };
}

function generateDescription(row, section, seasonName) {
  var name = row[section.rangeColumns.name];
  name = name.replace('Either', 'either Julie or Andy');
  name = name.replace('Both', 'both Julie and Andy together');
  return 'This is a ' + seasonName + ' ' + (seasonName.includes('->') ? 'checklist' : 'regular') + ' task for ' +  name + '.\n\n' +
    state.eventDescription;
}

function getIsAllDay(startTime, durationHours) {
  return !(
    startTime >= 0 &&
    startTime <= 24 &&
    durationHours > 0);
}

function getIsDone(section, row) {
  if(section.hasDoneCol) {
    return row[section.rangeColumns.done] === 'Yes';
  }
  return false;
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

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}