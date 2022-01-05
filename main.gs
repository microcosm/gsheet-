/* Installed Triggers */
function onSpreadsheetOpen() {
  const stateManager = new ApplicationStateManager(SpreadsheetApp.getActiveSpreadsheet());
  stateManager.buildUserInterfaceState();
  state.menu.onSpreadsheetOpen();
}

function onSpreadsheetEdit(e) {
  const stateManager = new ApplicationStateManager(SpreadsheetApp.getActiveSpreadsheet());
  stateManager.buildSheetState().buildFeatureState();

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
  const stateManager = new ApplicationStateManager(SpreadsheetApp.openById(config.gsheet.id));
  stateManager.buildSheetState().buildFeatureState();
  executeFeaturesForEvent(Event.onCalendarEdit);
}

function onOvernightTimer() {
  const stateManager = new ApplicationStateManager(SpreadsheetApp.openById(config.gsheet.id));
  stateManager.buildSheetState().buildFeatureState();
  executeFeaturesForEvent(Event.onOvernightTimer);
}

/* Simple Triggers */
function onSelectionChange() {
  const stateManager = new ApplicationStateManager(SpreadsheetApp.getActiveSpreadsheet());
  stateManager.buildUserInterfaceState();
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

function registerValuesSheet(config) {
  var sheet = new ValuesSheet(config);
  state.valuesSheet = sheet;
  return sheet;
}

function registerFeatureSheet(config, features) {
  var sheet = new FeatureSheet(config);
  state.sheets.push(sheet);
  features.forEach((feature) => {
    feature.registerSheet(sheet);
  });
  return sheet;
}

function registerSheet(config) {
  var sheet = new FeatureSheet(config, []);
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