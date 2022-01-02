var state;

function init(spreadsheet) {
  var applicationStateBuilder = new Builder_ApplicationStateFromSpreadsheet(spreadsheet);
  applicationStateBuilder.build();
  preProcessSheets();//build twa mega sheets etc
  state.buildList.push(state.builders.peopleFromSpreadsheetValues);
  state.buildList.push(state.builders.eventsFromPersonCalendar);
  state.buildList.push(state.builders.eventsFromSpreadsheet);
  state.buildList.forEach((builder) => { builder.build() });
}

function onOvernightTimer() {
  init(SpreadsheetApp.openById(config.gsheet.id));
  state.executionList.push(state.features.updateCalendarFromSpreadsheet);
  executeFeatures();
}

function onCalendarEdit() {
  init(SpreadsheetApp.openById(config.gsheet.id));
  if(typeof customOnEdit !== "undefined") customOnEdit();
}

function onSpreadsheetEdit(e) {
  init(SpreadsheetApp.getActiveSpreadsheet());
  const activeSheetName = state.spreadsheet.getActiveSheet().getName();
  const activeColumn = e.range.columnStart;

  const features = Object.values(state.features);
  features.forEach((feature) => {
    if(feature.isRegisteredFor(activeSheetName, activeColumn)) {
      state.executionList.push(feature);
    }
  });

  executeFeatures();
}

function onSpreadsheetOpen() {
  if(typeof customOnOpen !== "undefined") {
    init(SpreadsheetApp.openById(config.gsheet.id));
    customOnOpen();
    executeFeatures();
  }
}

function executeFeatures() {
  if(!waitForLocks()){
    alertError("couldn't lock script");
    return;
  }
  try {
    state.executionList.forEach((feature) => { feature.execute() });
  } catch(exception) {
    alertError(exception);
  } finally {
    releaseLock();
    outputLog();
  }
}

function registerSheetForFeature(sheet, feature) {
  state.scriptSheets.push(sheet);
  feature.registerSheet(sheet);
}

function waitForLocks() {
  state.execution.lock = LockService.getScriptLock();
  try {
    state.execution.lock.waitLock(state.execution.timeout);
    logLockObtained();
    return true;
  } catch(e) {
    return false;
  }
}

function releaseLock() {
  SpreadsheetApp.flush();
  state.execution.lock.releaseLock();
  logLockReleased();
}