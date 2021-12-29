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
  var executor = new DashExecutor();
  if(!executor.waitForLocks()){
    alertError("couldn't lock script");
    return;
  }
  try {
    if(typeof customUpdates !== "undefined") customUpdates();
    executor.updateGoogleCalendarsFromSpreadsheet();
  } catch(e) {
    alertError(e);
  } finally {
    executor.releaseLock();
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