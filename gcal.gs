//const eventRangeLabels = ['BLANK', 'Evergreen', 'Summer', 'Winter'];
const cyclesSheetName = 'Cycles', cyclesColumns = [4];
const valuesSheetName = '(dropdowns)', valuesCalendarIdCell = 'K2';

function onEditInstalledTrigger(e) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const triggeringSheet = spreadsheet.getActiveSheet();
  if (triggeringSheet.getName() !== cyclesSheetName || cyclesColumns.indexOf(e.range.columnStart) == -1) return;
  const valuesSheet = spreadsheet.getSheetByName(valuesSheetName);
  updateCalendar(triggeringSheet, valuesSheet);
}

function updateCalendar(cyclesSheet, valuesSheet) {
  const calendarId = valuesSheet.getRange(valuesCalendarIdCell).getValue();
  const calendar = CalendarApp.getCalendarById(calendarId);
  clearCalendar(calendar);
  repopulateCalendar(calendar, cyclesSheet);
}

function clearCalendar(calendar) {
  const fromDate = new Date('January 1, 2000');
  const toDate = new Date('January 1, 3000');
  const events = calendar.getEvents(fromDate, toDate);
  for(var i = 0; i < events.length; i++){
    events[i].deleteEvent();
  }
}

function repopulateCalendar(calendar, cyclesSheet) {
  const startRow = 2, maxRows = 500;
  const startCol = 4, maxCols = 7;
  const values = cyclesSheet.getRange(startRow, startCol, maxRows, maxCols).getValues();
  const status = values[0][maxCols-1];
  
  var events = getEvents(values);
  var season = getSeason(values);
  alertEvents(events, season);
  calendar.createAllDayEvent('TEST2', new Date('May 15, 2021'));
}

function getEvents(values) {
  var events = [];
  var currentRange = 0;
  events[currentRange] = [];

  for(var i = 0; i < values.length; i++) {
    if(values[i][0] === 'Last done') {
      currentRange++;
      events[currentRange] = [];
    } else if(values[i][0] instanceof Date){
      events[currentRange].push({
        date: values[i][0]
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
    str += events[i][j].date + '\n';
  }

  str += season + '\n';
  i = season === 'Summer' ? 2 : 3;
  for(var j = 0; j < events[i].length; j++) {
    str += events[i][j].date + '\n';
  }
  SpreadsheetApp.getUi().alert(str);
}