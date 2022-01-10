/* Installed Triggers */
function onSpreadsheetOpen() {
  startEventResponse(Event.onSpreadsheetOpen);
  const stateBuilder = new StateBuilder(SpreadsheetApp.getActiveSpreadsheet());
  stateBuilder.buildSheetState().buildUserInterfaceState();
  state.ui.onSpreadsheetOpen();
  endEventResponse();
}

function onSpreadsheetEdit(eventData) {
  startEventResponse(Event.onSpreadsheetEdit);
  const stateBuilder = new StateBuilder(SpreadsheetApp.getActiveSpreadsheet());
  stateBuilder.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onSpreadsheetEdit, eventData);
  endEventResponse();
}

function onCalendarEdit() {
  startEventResponse(Event.onCalendarEdit);
  const stateBuilder = new StateBuilder(SpreadsheetApp.openById(config.gsheet.id));
  stateBuilder.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onCalendarEdit);
  endEventResponse();
}

function onOvernightTimer() {
  startEventResponse(Event.onOvernightTimer);
  const stateBuilder = new StateBuilder(SpreadsheetApp.openById(config.gsheet.id));
  stateBuilder.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onOvernightTimer);
  endEventResponse();
}

/* Simple Triggers */
function onSelectionChange() {
  startEventResponse(Event.onSelectionChange);
  const stateBuilder = new StateBuilder(SpreadsheetApp.getActiveSpreadsheet());
  stateBuilder.buildUserInterfaceState();
  state.ui.onSelectionChange();
  endEventResponse();
}

/* Callbacks */
function onShowSidebar() {
  startEventResponse(Event.onShowSidebar);
  const stateBuilder = new StateBuilder(SpreadsheetApp.getActiveSpreadsheet());
  stateBuilder.buildSheetState().buildUserInterfaceState();
  state.ui.sidebar.onShowSidebar();
  endEventResponse();
}

function onSidebarSubmit(eventData) {
  startEventResponse(Event.onSidebarSubmit);
  const stateBuilder = new StateBuilder(SpreadsheetApp.getActiveSpreadsheet());
  stateBuilder.buildSheetState().buildUserInterfaceState();
  executeFeaturesForEvent(Event.onSidebarSubmit, eventData);
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
  state.builder.appendFeatures(
    config.featureClasses.map((feature) => {
      return new feature(sheet)
    })
  );
  return sheet;
}

/* Execution */
function executeFeaturesForEvent(event, eventData=false) {
  logString('Searching registered features for valid responses...');
  for(key in state.features.registered) {
    const feature = state.features.registered[key];
    if(feature.respondsTo(event, eventData)) {
      feature.setEventData(eventData);
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

function startEventResponse(event) {
  logEventExecution(event)
}

function endEventResponse() {
  logString('Execution completed.')
  outputLog();
}