/* Installed Triggers */
function onSpreadsheetOpen(e) {
  const stateManager = new ApplicationStateManager(SpreadsheetApp.getActiveSpreadsheet());
  stateManager.buildUserInterfaceState();
  state.ui.onSpreadsheetOpen();
  endEventResponse();
}

function onSpreadsheetEdit(e) {
  const stateManager = new ApplicationStateManager(SpreadsheetApp.getActiveSpreadsheet());
  stateManager.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onSpreadsheetEdit, e.source.getActiveSheet().getName(), e.range.columnStart);
  endEventResponse();
}

function onCalendarEdit() {
  const stateManager = new ApplicationStateManager(SpreadsheetApp.openById(config.gsheet.id));
  stateManager.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onCalendarEdit);
  endEventResponse();
}

function onOvernightTimer() {
  const stateManager = new ApplicationStateManager(SpreadsheetApp.openById(config.gsheet.id));
  stateManager.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onOvernightTimer);
  endEventResponse();
}

/* Simple Triggers */
function onSelectionChange() {
  const stateManager = new ApplicationStateManager(SpreadsheetApp.getActiveSpreadsheet());
  stateManager.buildUserInterfaceState();
  state.ui.onSelectionChange();
  endEventResponse();
}

function executeFeaturesForEvent(event, sheetName=false, column=false) {
  for(key in state.features.registered) {
    const feature = state.features.registered[key];
    if(feature.respondsTo(event) && (!sheetName || !column || feature.isRegisteredFor(sheetName, column))) {
      state.features.executions.push(feature);
    }
  }
  executeFeatures();
}

/* Application Callbacks */
function onShowGuidanceDialog() {
  const stateManager = new ApplicationStateManager(SpreadsheetApp.getActiveSpreadsheet());
  stateManager.buildUserInterfaceState();
  state.ui.menu.onShowGuidanceDialog();
  endEventResponse();
}

function executeFeatures() {
  if(!waitForLocks()){
    alertError("couldn't lock script");
    return;
  }
  try {
    state.features.executions.forEach((feature) => { feature.execute() });
  } catch(exception) {
    alertError(exception);
  } finally {
    releaseLock();
  }
}

function registerValuesSheet(config) {
  var sheet = new ValuesSheet(config);
  state.valuesSheet = sheet;
  return sheet;
}

function registerFeatureSheet(config) {
  const sheet = new FeatureSheet(config);
  state.sheets.push(sheet);
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

function endEventResponse() {
  outputLog();
}