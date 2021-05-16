//const eventRangeLabels = ['BLANK', 'Evergreen', 'Summer', 'Winter'];
const rangeRowOffset = 2, rangeColOffset = 2, rangeMaxRows = 500, rangeMaxCols = 9;
const cyclesSheetName = 'Cycles', cyclesDateLabel = 'Last done', valuesSheetName = '(dropdowns)', valuesCalendarIdCell = 'K2';
var cyclesNounColIndex, cyclesVerbColIndex, cyclesDateColIndex, cyclesNameColIndex;
const cyclesNounCol = 2, cyclesVerbCol = 3, cyclesDateCol = 4, cyclesNameCol = 6;
const cyclesWatchColumns = [cyclesNounCol, cyclesVerbCol, cyclesDateCol, cyclesNameCol];

function onEditInstalledTrigger(e) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const triggeringSheet = spreadsheet.getActiveSheet();
  if (triggeringSheet.getName() !== cyclesSheetName || cyclesWatchColumns.indexOf(e.range.columnStart) == -1) return;
  const valuesSheet = spreadsheet.getSheetByName(valuesSheetName);
  updateCalendar(triggeringSheet, valuesSheet);
}

function updateCalendar(cyclesSheet, valuesSheet) {
  const calendarId = valuesSheet.getRange(valuesCalendarIdCell).getValue();
  const calendar = CalendarApp.getCalendarById(calendarId);
  clearCalendar(calendar);
  populateCalendar(calendar, cyclesSheet);
}

function clearCalendar(calendar) {
  const fromDate = new Date('January 1, 2000');
  const toDate = new Date('January 1, 3000');
  const events = calendar.getEvents(fromDate, toDate);
  for(var i = 0; i < events.length; i++){
    events[i].deleteEvent();
  }
}

function populateCalendar(calendar, cyclesSheet) {
  const values = cyclesSheet.getRange(rangeRowOffset, rangeColOffset, rangeMaxRows, rangeMaxCols).getValues();
  calculateColumnDataIndices();
  var events = getEvents(values);
  var season = getSeason(values);
  alertEvents(events, season);
  calendar.createAllDayEvent('TEST', new Date('May 11, 2021'));
}

function calculateColumnDataIndices() {
  cyclesNounColIndex = cyclesNounCol - rangeColOffset;
  cyclesVerbColIndex = cyclesVerbCol - rangeColOffset;
  cyclesDateColIndex = cyclesDateCol - rangeColOffset;
  cyclesNameColIndex = cyclesNameCol - rangeColOffset;
}

function getEvents(values) {
  var events = [];
  var currentRange = 0;
  events[currentRange] = [];

  for(var i = 0; i < values.length; i++) {
    if(values[i][cyclesDateColIndex] === cyclesDateLabel) {
      currentRange++;
      events[currentRange] = [];
    } else if(values[i][cyclesDateColIndex] instanceof Date){
      events[currentRange].push({
        title: values[i][cyclesNounColIndex] + ': ' + values[i][cyclesVerbColIndex],
        name: values[i][cyclesNameColIndex],
        date: values[i][cyclesDateColIndex]
      });
    }
  }

  return events;
}

function getSeason(values) {
  const statusStr = values[0][values[0].length - 1];
  return statusStr.substring(statusStr.length - 6);
}

function alertEvents(events, season) {
  var str = '';

  str += 'Evergreen\n';
  var i = 1;
  for(var j = 0; j < events[i].length; j++) {
    str += '[' + events[i][j].name + '] ' + events[i][j].title + ' ' + events[i][j].date + '\n';
  }

  str += season + '\n';
  i = season === 'Summer' ? 2 : 3;
  for(var j = 0; j < events[i].length; j++) {
    str += '[' + events[i][j].name + '] ' + events[i][j].title + ' ' + events[i][j].date + '\n';
  }
  SpreadsheetApp.getUi().alert(str);
}