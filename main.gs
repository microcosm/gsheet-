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
  var stateAssembler = new DashboardState(spreadsheet);
  stateAssembler.assemble();
}

function run() {
  if(!waitForLocks()){
    alertError("couldn't lock script");
    return;
  }
  try {
    if(typeof customUpdates !== "undefined") customUpdates();
    state.features.updateCalendarFromSpreadsheet.execute();
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
  state.scriptSheets.forEach((sheet) => {
    if(sheet.name === activeSheetName && sheet.triggerCols.includes(e.range.columnStart)) {
      found = true;
    }
  });
  return found;
}

function registerSheetForFeature(sheet, widgets, feature) {
  state.scriptSheets.push(sheet);
  feature.registerSheet(sheet);
  state.scriptResponsiveWidgets = state.scriptResponsiveWidgets.concat(widgets);
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