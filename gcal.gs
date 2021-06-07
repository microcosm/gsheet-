var state;

function init() {
  state = {
    execution: {
      performDataUpdates: false,
      showLogAlert: true
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
    },
    cyclesGlobal: null,
    regularSection: null,
    checklistSection: null,
    todoSection: null
  };

  state.cyclesGlobal = state.cycles.sections.global;
  state.regularSection = state.cycles.sections.regular;
  state.checklistSection = state.cycles.sections.checklist;
  state.todoSection = state.todo;

  state.cycles.sheet = state.spreadsheet.getSheetByName(state.cycles.sheetName);
  state.values.sheet = state.spreadsheet.getSheetByName(state.values.sheetName);
  state.todo.sheet = state.spreadsheet.getSheetByName(state.todo.sheetName);

  state.people = getPeople();

  generateRangeColumns(state.cyclesGlobal, state.cycles.range.offsets);
  generateRangeColumns(state.regularSection, state.cycles.range.offsets);
  generateRangeColumns(state.checklistSection, state.cycles.range.offsets);
  generateRangeColumns(state.todoSection, state.todo.range.offsets);

  state.todo.triggerColumns = [
    state.todoSection.columns.noun,
    state.todoSection.columns.verb,
    state.todoSection.columns.done,
    state.todoSection.columns.name,
    state.todoSection.columns.workDate,
    state.todoSection.columns.startTime,
    state.todoSection.columns.durationHours
  ];

  state.cycles.triggerColumns = [
    state.cyclesGlobal.columns.season,
    state.regularSection.columns.noun,
    state.regularSection.columns.verb,
    state.regularSection.columns.lastDone,
    state.regularSection.columns.name,
    state.regularSection.columns.cycleDays,
    state.regularSection.columns.nudgeDays,
    state.regularSection.columns.startTime,
    state.regularSection.columns.durationHours,
    state.checklistSection.columns.noun,
    state.checklistSection.columns.verb,
    state.checklistSection.columns.done,
    state.checklistSection.columns.name,
    state.checklistSection.columns.workDate,
    state.checklistSection.columns.startTime,
    state.checklistSection.columns.durationHours
  ];
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

function generateRangeColumns(section, rangeOffsets){
  for(var key in section.columns) {
    section.rangeColumns[key] = section.columns[key] - rangeOffsets.col;
  }
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

function updateChangedEvents(person, spreadsheetEvents) { ///rm spreadsheetEvents...
  updateCalendarChangedEvents(person);
  updateSpreadsheetChangedEvents(person, spreadsheetEvents);
  logNewline();
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