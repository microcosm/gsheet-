/* Installed Triggers */
function onSpreadsheetOpen(e) {
  const stateManager = new StateBuilder(SpreadsheetApp.getActiveSpreadsheet());
  stateManager.buildUserInterfaceState();
  state.ui.onSpreadsheetOpen();
  endEventResponse();
}

function onSpreadsheetEdit(e) {
  const stateManager = new StateBuilder(SpreadsheetApp.getActiveSpreadsheet());
  stateManager.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onSpreadsheetEdit, e.source.getActiveSheet().getName(), e.range.columnStart);
  endEventResponse();
}

function onCalendarEdit() {
  const stateManager = new StateBuilder(SpreadsheetApp.openById(config.gsheet.id));
  stateManager.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onCalendarEdit);
  endEventResponse();
}

function onOvernightTimer() {
  const stateManager = new StateBuilder(SpreadsheetApp.openById(config.gsheet.id));
  stateManager.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onOvernightTimer);
  endEventResponse();
}

/* Simple Triggers */
function onSelectionChange() {
  const stateManager = new StateBuilder(SpreadsheetApp.getActiveSpreadsheet());
  stateManager.buildUserInterfaceState();
  state.ui.onSelectionChange();
  endEventResponse();
}

/* Callbacks */
function onShowSidebar() {
  const stateManager = new StateBuilder(SpreadsheetApp.getActiveSpreadsheet());
  stateManager.buildSheetState().buildUserInterfaceState();
  state.ui.sidebar.onShowSidebar();
  endEventResponse();
}

function onSidebarSubmit(e) {
  const stateManager = new StateBuilder(SpreadsheetApp.getActiveSpreadsheet());
  stateManager.buildSheetState().buildUsersState().buildUserInterfaceState(); //yeah?
  state.ui.sidebar.onSidebarSubmit(e);
  endEventResponse();
}

/* Sheet Registration */
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

/* Execution */
function executeFeaturesForEvent(event, sheetName=false, column=false) {
  for(key in state.features.registered) {
    const feature = state.features.registered[key];
    if(feature.respondsTo(event) && (!sheetName || !column || feature.isRegisteredFor(sheetName, column))) {
      state.features.executions.push(feature);
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
    state.features.executions.forEach((feature) => { feature.execute() });
  } catch(exception) {
    alertError(exception);
  } finally {
    releaseLock();
  }
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