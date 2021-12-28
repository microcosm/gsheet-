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
  if(typeof customOnOpen !== "undefined") {
    init(SpreadsheetApp.openById(config.gsheet.id));
    customOnOpen();
    run();
  }
}

function init(spreadsheet) {
  var stateAssembler = new DashStateAssembler(spreadsheet);
  stateAssembler.assemble();
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

function isValidTrigger(e){
  const activeSheetName = state.spreadsheet.getActiveSheet().getName();
  var found = false;
  state.scriptSheets.forEach(function(sheet) {
    if(sheet.name === activeSheetName && sheet.triggerCols.includes(e.range.columnStart)) {
      found = true;
    }
  });
  return found;
}

function updateCalendars() {
  state.people.forEach(function(person) {
    linkMatchingEvents(person);
    updateChangedEvents(person);
  });
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
  state.googleCalendar.deleteOrphanedCalendarEvents(person);
  state.googleCalendar.createNewCalendarEvents(person);
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