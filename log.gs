/* OUTPUT */

function outputLog() {
  console.log(state.log);
  if(state.toggles.showLogAlert) SpreadsheetApp.getUi().alert(state.log);
}

function alertError(cause){
  var output = 'Custom script failed: ' + cause +
    (cause.hasOwnProperty('stack') ? cause.stack : '');

  console.log(output);
  if(state.toggles.showLogAlert) SpreadsheetApp.getUi().alert(output);
}

function alert(text){
  SpreadsheetApp.getUi().alert(text);
}

/* GENERIC */

let logIndentation = false;

function startLogBlock() {
  logString('[');
  logIndentation = true;
}

function startLogBlockVerbose() {
  logStringVerbose('[');
  logIndentation = true;
}

function endLogBlock() {
  logIndentation = false;
  logString(']');
}

function endLogBlockVerbose() {
  logIndentation = false;
  logStringVerbose(']');
}

function indentLog(str) {
  return logIndentation ? `  ` + indentLogNewlines(str) : str;
}

function indentLogNewlines(str) {
  return str.replaceAll(`\n`, `\n  `);
}

function logString(str) {
  state.log += indentLog(str) + `\n`;
}

function logStringVerbose(str) {
  if(state.toggles.verboseLogging) logString(str);
}

function logObject(str, obj) {
  state.log += indentLog(str) + (isObject(obj) ? JSON.stringify(obj, null, 2) : `[not an object]`) + `\n`;
}

function logObjectVerbose(str, obj) {
  if(state.toggles.verboseLogging) {
    logObject(str, obj);
    logString('');
  }
}

/* MAIN */

function logEventExecution(event, eventData=false) {
  state.log += `Event ` + event + ` called.\n`;
  if(eventData) logObjectVerbose(`Event data:\n`, eventData);
}

function logFeatureEvaluation(feature, respondsToEvent, isValidEventData) {
  if(state.toggles.verboseLogging) {
    state.log += ((respondsToEvent && isValidEventData) ? `* ` : ``) + `Feature '` + feature.name + `' with Sheet '` + feature.sheet.name + `' DOES` + (respondsToEvent ? `` : ` NOT`) + ` respond to event and HAS` + (isValidEventData ? `` : ` NOT`) + ` received valid event data\n\n`;
  } else if(respondsToEvent && isValidEventData) {
    state.log += `Feature '` + feature.name + `' with Sheet '` + feature.sheet.name + `' DOES respond to event and HAS received valid event data\n`;
  }
}

function logFeatureExecution(feature) {
  state.log += `Executing feature '` + feature.name + `' on Sheet ` + feature.sheet.name + ` (` + feature.getPriority() + `)\n`;
}

function logLockObtained() {
  state.log += `Lock obtained...\n`;
}

function logLockReleased() {
  state.log += `Lock released.\n`;
}

/* FEATURES */

function logCalendarEventFound(event, hasMatch) {
  if(state.toggles.verboseLogging) {
    state.log += (hasMatch ? '' : '* ') + buildCalendarEventLogStr(event);
  } else if(!hasMatch) {
    state.log += '* ' + buildCalendarEventLogStr(event);
  }
}

function buildCalendarEventLogStr(event) {
  return '[' + event.options.location + '] ' +
      removeNewlines(event.title) + ' ' +
      event.startDateTime +
      (event.isAllDay ?
        ' ALL DAY' :
        ' until ' + event.endDateTime.getHours() + ':' + event.endDateTime.getMinutes()
      ) + '\n';
}

function logCalendarEventDeleted(event) {
  state.log += `Deleting ` + removeNewlines(event.title) + `\n`;
}

function logCalendarEventCreated(event) {
  state.log += `Creating ` + removeNewlines(event.title) + `\n`;
}