var state;

function init(spreadsheet) {
  state = {
    toggles: {
      performDataUpdates: true,
      showLogAlert: false
    },
    spreadsheet: spreadsheet,
    season: null,        //Can be: ['Summer', 'Winter']
    transition: null,    //Can be: [false, 'Summer->Winter', 'Winter->Summer']
    validEventCategories: null,
    people: [],
    rangeValues: {},
    log: '',
    lock: null,
    errorText: 'Calendar update failed: ',
    workDateLabelText: 'Work date',
    today: getTodaysDate(),
    values: {
      tab: {
        name: '(dropdowns)',
        ref: null
      },
      numPerPerson: 3,
      range: {
        start: 'K2',
        end: 'K6'
      }
    },
    todo: {
      tab: {
        name: 'Todo',
        id: '997054615',
        ref: null
      },
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
      tab: {
        name: 'Cycles',
        id: '966806031',
        ref: null
      },
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
      eventCategories: {
        1: 'Evergreen',
        2: 'Summer',
        3: 'Winter',
        4: 'Winter->Summer',
        5: 'Summer->Winter',
        6: 'Todo',
        7: 'Completed',
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

  state.cycles.tab.ref = state.spreadsheet.getSheetByName(state.cycles.tab.name);
  state.values.tab.ref = state.spreadsheet.getSheetByName(state.values.tab.name);
  state.todo.tab.ref = state.spreadsheet.getSheetByName(state.todo.tab.name);

  generateRangeColumns(state.cycles.sections.global, state.cycles.range.offsets);
  generateRangeColumns(state.cycles.sections.regular, state.cycles.range.offsets);
  generateRangeColumns(state.cycles.sections.checklist, state.cycles.range.offsets);
  generateRangeColumns(state.todo, state.todo.range.offsets);

  state.todo.triggerColumns = [
    state.todo.columns.noun,
    state.todo.columns.verb,
    state.todo.columns.done,
    state.todo.columns.name,
    state.todo.columns.workDate,
    state.todo.columns.startTime,
    state.todo.columns.durationHours
  ];

  state.cycles.triggerColumns = [
    state.cycles.sections.global.columns.season,
    state.cycles.sections.regular.columns.noun,
    state.cycles.sections.regular.columns.verb,
    state.cycles.sections.regular.columns.lastDone,
    state.cycles.sections.regular.columns.name,
    state.cycles.sections.regular.columns.cycleDays,
    state.cycles.sections.regular.columns.nudgeDays,
    state.cycles.sections.regular.columns.startTime,
    state.cycles.sections.regular.columns.durationHours,
    state.cycles.sections.checklist.columns.noun,
    state.cycles.sections.checklist.columns.verb,
    state.cycles.sections.checklist.columns.done,
    state.cycles.sections.checklist.columns.name,
    state.cycles.sections.checklist.columns.workDate,
    state.cycles.sections.checklist.columns.startTime,
    state.cycles.sections.checklist.columns.durationHours
  ];

  setRangeValues();
  setSeason();
  setPeople();
}

function onTimedTrigger() {
  init(SpreadsheetApp.openById(config.gsheet.id));
  run();
}

function onEditInstalledTrigger(e) {
  init(SpreadsheetApp.getActiveSpreadsheet());
  if(!isValidTrigger(e)) return;
  run();
}

function run() {
  if(!waitForLocks()){
    alertError("couldn't lock script");
    return;
  }
  try {
    updateCalendars();
    outputLog();
  } catch(e) {
    alertError(e);
  } finally {
    releaseLock();
  }
}

function isValidTrigger(e){
  const activeSheetName = state.spreadsheet.getActiveSheet().getName();
  return (
    activeSheetName === state.cycles.tab.name && state.cycles.triggerColumns.includes(e.range.columnStart)) || (
    activeSheetName === state.todo.tab.name && state.todo.triggerColumns.includes(e.range.columnStart)
  );
}

function generateRangeColumns(section, rangeOffsets){
  for(var key in section.columns) {
    section.rangeColumns[key] = section.columns[key] - rangeOffsets.col;
  }
}

function setPeople() {
  const values = state.values.tab.ref.getRange(state.values.range.start + ':' + state.values.range.end).getValues();
  for(var i = 0; i < values.length; i += state.values.numPerPerson) {
    if(values[i][0] && values[i + 1][0]){
      const name = values[i][0];
      const inviteEmail = values.length >= i + state.values.numPerPerson ? values[i + 2][0] : '';
      const calendar = CalendarApp.getCalendarById(values[i + 1][0]);
      state.people.push({
        name: name,
        calendar: calendar,
        inviteEmail: inviteEmail,
        calendarEvents: getCalendarEvents(calendar),
        spreadsheetEvents: null });
    }
  }
  state.people.forEach(function(person) {
    person.spreadsheetEvents = getSpreadsheetEvents(person);
  });
}

function updateCalendars() {
  state.people.forEach(function(person) {
    linkMatchingEvents(person);
    updateChangedEvents(person);
  });
}

function getTodaysDate() {
  var date = new Date();
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

function linkMatchingEvents(person) {
  person.spreadsheetEvents.forEach(function(spreadsheetEvent) {
    var matchingCalendarEvent = findInCalendarEvents(spreadsheetEvent, person.calendarEvents);
    if(matchingCalendarEvent) {
      matchingCalendarEvent.existsInSpreadsheet = true;
      spreadsheetEvent.existsInCalendar = true;
    }
    logEventFound(spreadsheetEvent, matchingCalendarEvent);
  });
  logNewline();
}

function updateChangedEvents(person) {
  deleteOrphanedCalendarEvents(person);
  createNewCalendarEvents(person);
  logNewline();
}

function getIsAllDay(startTime, durationHours) {
  return !(startTime.isANumber() &&
    durationHours.isANumber() &&
    startTime >= 0 &&
    startTime <= 23 &&
    durationHours > 0);
}

function findInCalendarEvents(spreadsheetEvent, calendarEvents) {
  var match = false;
  calendarEvents.forEach(function(calendarEvent) {
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