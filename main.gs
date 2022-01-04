var state;

function init(spreadsheet, isRunningViaInstalledTrigger=true) {
  var applicationStateBuilder = new Builder_ApplicationStateFromSpreadsheet(spreadsheet);
  applicationStateBuilder.build();
  if(isRunningViaInstalledTrigger) {
    setUpSheets();
    state.buildList.push(state.builders.usersFromSpreadsheet);
    state.buildList.push(state.builders.eventsFromUserCalendars);
    state.buildList.push(state.builders.eventsFromSpreadsheet);
    state.buildList.forEach((builder) => { builder.build() });
  }
  return applicationStateBuilder;
}

/* Installed Triggers */
function onSpreadsheetOpen() {
  applicationStateBuilder = init(SpreadsheetApp.openById(config.gsheet.id));
  applicationStateBuilder.buildForUI();
  state.menu.onSpreadsheetOpen();
  executeFeaturesForEvent(Event.onSpreadsheetOpen);
}

function onSpreadsheetEdit(e) {
  init(SpreadsheetApp.getActiveSpreadsheet());
  const activeSheetName = state.spreadsheet.getActiveSheet().getName();
  const activeColumn = e.range.columnStart;

  for(key in state.features) {
    const feature = state.features[key];
    if(feature.respondsTo(Event.onSpreadsheetEdit) && feature.isRegisteredFor(activeSheetName, activeColumn)) {
      state.executionList.push(feature);
    }
  }
  executeFeatures();
}

function onCalendarEdit() {
  init(SpreadsheetApp.openById(config.gsheet.id));
  executeFeaturesForEvent(Event.onCalendarEdit);
}

function onOvernightTimer() {
  init(SpreadsheetApp.openById(config.gsheet.id));
  executeFeaturesForEvent(Event.onOvernightTimer);
}

/* Simple Triggers */
function onSelectionChange() {
  applicationStateBuilder = init(SpreadsheetApp.getActiveSpreadsheet(), false);
  applicationStateBuilder.buildForUI();
  state.menu.checkForSheetChange();
}

function executeFeaturesForEvent(event) {
  for(key in state.features) {
    const feature = state.features[key];
    if(feature.respondsTo(event)) {
      state.executionList.push(feature);
    }
  }
  executeFeatures();
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

function registerValuesSheet(sheetConfig) {
  var sheet = new ValuesSheet(sheetConfig);
  state.valuesSheet = sheet;
  return sheet;
}

function registerFeatureSheet(feature, sheetConfig) {
  var sheet = new FeatureSheet(sheetConfig);
  state.featureSheets.push(sheet);
  feature.registerSheet(sheet);
  return sheet;
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