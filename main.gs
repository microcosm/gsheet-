/* Installed Triggers */
function onSpreadsheetOpen() {
  startEventResponse(Event.onSpreadsheetOpen);
  const stateBuilder = new StateBuilder(SpreadsheetSource.getActive);
  stateBuilder.buildSheetState().buildUserInterfaceState();
  state.ui.onSpreadsheetOpen();
  executeFeaturesForEvent(Event.onSpreadsheetOpen);
}

function onSheetEdit(eventData) {
  startEventResponse(Event.onSheetEdit);
  const stateBuilder = new StateBuilder(SpreadsheetSource.getActive);
  stateBuilder.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onSheetEdit, eventData);
}

function onCalendarEdit() {
  startEventResponse(Event.onCalendarEdit);
  const stateBuilder = new StateBuilder(SpreadsheetSource.openById);
  stateBuilder.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onCalendarEdit);
}

function onOvernightTimer() {
  startEventResponse(Event.onOvernightTimer);
  const stateBuilder = new StateBuilder(SpreadsheetSource.openById);
  stateBuilder.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onOvernightTimer);
}

function onHourTimer() {
  startEventResponse(Event.onHourTimer);
  const stateBuilder = new StateBuilder(SpreadsheetSource.openById);
  stateBuilder.buildSheetState().buildUsersState();
  executeFeaturesForEvent(Event.onHourTimer);
}

/* Simple Triggers */
function onSelectionChange() {
  startEventResponse(Event.onSelectionChange);
  const stateBuilder = new StateBuilder(SpreadsheetSource.getActive);
  stateBuilder.buildSheetState().buildUserInterfaceState();
  state.ui.onSelectionChange();
  executeFeaturesForEvent(Event.onSelectionChange);
}

/* Callbacks */
function onShowSidebar() {
  startEventResponse(Event.onShowSidebar);
  const stateBuilder = new StateBuilder(SpreadsheetSource.getActive);
  stateBuilder.buildSheetState().buildUserInterfaceState();
  state.ui.sidebar.onShowSidebar();
  endEventResponse();
}

function onSidebarSubmit(eventData) {
  startEventResponse(Event.onSidebarSubmit, eventData);
  const stateBuilder = new StateBuilder(SpreadsheetSource.getActive);
  stateBuilder.buildSheetState().buildUserInterfaceState();
  executeFeaturesForEvent(Event.onSidebarSubmit, eventData);
}

function onGetActiveSheetControlID() {
  startEventResponse(Event.onGetActiveSheetID);
  const activeSheetID = getHtmlSafeID(SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName());
  endEventResponse(activeSheetID);
  return activeSheetID;
}

/* Execution */
function executeFeaturesForEvent(event, eventData=false) {
  logString('Searching registered features for valid responses...');
  logObjectVerbose('eventData is ', eventData);
  for(const feature of state.features.registered) {
    if(feature.respondsTo(event, eventData)) {
      state.features.executions.push(feature);
    }
  }
  executeFeatures();
}

function executeFeatures() {
  const numExecutableFeatures = state.features.executions.length;
  logString((numExecutableFeatures === 0 ? 'No' : numExecutableFeatures) + ' executable features found');
  if(numExecutableFeatures > 0) {
    if(!waitForLocks()){
      alertError('Could not lock script');
      return;
    }
    try {
      state.builder.prepareForExecution();
      state.features.executions.forEach((feature) => { feature.execute() });
    } catch(exception) {
      logString('Current user:', Session.getActiveUser().getEmail());
      alertError(exception);
      endEventResponse();
      releaseLock();
      throw exception;
    } finally {
      endEventResponse();
      releaseLock();
    }
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

function startEventResponse(event, eventData=false) {
  logEventExecution(event, eventData)
}

function endEventResponse(returnValue=false) {
  if(returnValue) {
    logString('Returning value: ' + returnValue);
  }
  logString('Completed.');
  outputLog();
}