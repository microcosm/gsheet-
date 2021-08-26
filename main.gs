var state;

function onTimedTrigger() {
  init(SpreadsheetApp.openById(config.gsheet.id));
  run();
}

function onEditInstalledTrigger(e) {
  init(SpreadsheetApp.getActiveSpreadsheet());
  if(typeof customOnEdit !== "undefined") customOnEdit();
  if(!isValidTrigger(e)) return;
  run();
}

function onOpen() {
  if(typeof customOnOpen !== "undefined") customOnOpen();
}

function init(spreadsheet) {
  state = {
    spreadsheet: spreadsheet,
    validEventCategories: [],
    people: [],
    rangeValues: {},
    log: '',
    lock: null,
    errorText: 'Calendar update failed: ',
    workDateLabelText: 'Work date',
    today: getTodaysDate(),
    personValuesSubsheet: null,
    eventSubsheets: []
  };

  preProcessSubsheets();
  populateRangeValuesFromSubsheets();
  postProcessSubsheets();

  setPeople();
}

function run() {
  if(!waitForLocks()){
    alertError("couldn't lock script");
    return;
  }
  try {
    if(typeof customUpdates !== "undefined") customUpdates();
    updateCalendars();
  } catch(e) {
    alertError(e);
  } finally {
    releaseLock();
    outputLog();
  }
}

function isValidTrigger(e){
  const activeSheetName = state.spreadsheet.getActiveSheet().getName();
  var found = false;
  state.eventSubsheets.forEach(function(subsheet) {
    if(activeSheetName === subsheet.name && subsheet.triggerCols.includes(e.range.columnStart)) {
      found = true;
    }
  });
  return found;
}

function populateRangeValuesFromSubsheets() {
  state.eventSubsheets.forEach(function(subsheet) {
    state.rangeValues[subsheet.name] = subsheet.getRangeValues();
  });
}

function setPeople() {
  const values = state.personValuesSubsheet.tab.getRange(state.personValuesSubsheet.range.start + ':' + state.personValuesSubsheet.range.end).getValues();
  for(var i = 0; i < values.length; i += state.personValuesSubsheet.numValuesPerPerson) {
    if(values[i][0] && values[i + 1][0]){
      const name = values[i][0];
      const inviteEmail = values.length >= i + state.personValuesSubsheet.numValuesPerPerson ? values[i + 2][0] : '';
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