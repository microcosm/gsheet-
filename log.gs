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
      removeNewlines(event.title) + ' ' +
      event.startDateTime +
      (event.isAllDay ?
        ' ALL DAY' :
        ' until ' + event.endDateTime.getHours() + ':' + event.endDateTime.getMinutes()
      ) + '\n';
}

function logEventDeleted(event) {
  state.log += "Deleting " + removeNewlines(event.title) + "\n";
}

function logEventCreated(event) {
  state.log += "Creating " + removeNewlines(event.title) + "\n";
}

function logExecution(event) {
  state.log += 'Event ' + event + ' called.\n';
}

function logFeatureEvaluation(featureName, sheetName, respondsToEvent, isValidEventData) {
  if(config.toggles.logAllEvents) {
    state.log += ((respondsToEvent && isValidEventData) ? '* ' : '') + '[Feature \'' + featureName + '\' with Sheet \'' + sheetName + '\'] DOES' + (respondsToEvent ? '' : ' NOT') + ' respond to event, and HAS' + (isValidEventData ? '' : ' NOT') + ' received valid event data\n';
  } else if(respondsToEvent && isValidEventData) {
    state.log += '[Feature \'' + featureName + '\' with Sheet \'' + sheetName + '\'] DOES respond to event, and HAS received valid event data\n';
  }
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

function alertError(cause){
  var output = state.texts.errorLabel + cause +
    (cause.hasOwnProperty('stack') ? cause.stack : '');

  console.log(output);
  if(config.toggles.showLogAlert) SpreadsheetApp.getUi().alert(output);
}

function alert(text){
  SpreadsheetApp.getUi().alert(text);
}