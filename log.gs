function logString(str) {
  state.log += str + "\n";
}

function logEventFound(event, hasMatch) {
  state.log +=
    (hasMatch ? '' : '* ') +
    ' [' + event.options.location + '] ' +
    event.title + ' ' +
    event.startDateTime + 
    (event.isAllDay ?
      ' ALL DAY' :
      ' until ' + event.endDateTime.getHours() + ':' + event.endDateTime.getMinutes()
    ) + '\n';
}

function logEventDeleted(event) {
  state.log += "Deleting " + event.title + "\n";
}

function logEventCreated(event) {
  state.log += "Creating " + event.title + "\n";
}

function logLockObtained() {
  state.log += "Lock obtained...\n";
}

function logLockReleased() {
  state.log += "Lock released.\n";
}

function logNewline() {
  state.log += "\n";
}

function outputLog() {
  console.log(state.log);
  if(state.toggles.showLogAlert) SpreadsheetApp.getUi().alert(state.log);
}

function alertError(reason){
  var output = state.errorText + reason;
  console.log(output);
  if(state.toggles.showLogAlert) SpreadsheetApp.getUi().alert(output);
}