function logString(str) {
  state.log += str + "\n";
}

function logEventFound(event, hasMatch) {
  if(config.toggles.logAllEvents) {
    state.log += (hasMatch ? '' : '* ') + buildEventLogStr(event);
  } else if(!hasMatch) {
    state.log += '* ' + buildEventLogStr(event);
  }
}

function buildEventLogStr(event) {
  return '[' + event.options.location + '] ' +
      event.title.replace(/(\r\n|\n|\r)/gm, ' ') + ' ' +
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

function logFeatureExecution(featureName) {
  state.log += "Executing feature \'" + featureName + "\'\n";
}

function logNewline() {
  state.log += "\n";
}

function outputLog() {
  console.log(state.log);
  if(config.toggles.showLogAlert) SpreadsheetApp.getUi().alert(state.log);
}

function alertError(reason){
  var output = state.texts.errorLabel + reason;
  console.log(output);
  if(config.toggles.showLogAlert) SpreadsheetApp.getUi().alert(output);
}

function alert(text){
  SpreadsheetApp.getUi().alert(text);
}