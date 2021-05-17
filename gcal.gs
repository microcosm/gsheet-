var data = {
  range: {
    offsets: {
      row: 2,
      col: 2
    },
    maxRows: 500,
    maxCols: 9
  },
  values: {
    sheetName: '(dropdowns)',
    gcalColumnId: 'K'
  },
  cycles: {
    sheetName: 'Cycles',
    dateLabel: 'Last done',
    sheetColumns: {
      noun: 2,
      verb: 3,
      date: 4,
      name: 6
    }
  }
};

function onEditInstalledTrigger(e) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const triggeringSheet = spreadsheet.getActiveSheet();
  if (triggeringSheet.getName() !== data.cycles.sheetName || Object.values(data.cycles.sheetColumns).indexOf(e.range.columnStart) == -1) return;
  const valuesSheet = spreadsheet.getSheetByName(data.values.sheetName);
  updateCalendar(triggeringSheet, valuesSheet);
}

function updateCalendar(cyclesSheet, valuesSheet) {
  const people = getPeople(valuesSheet);
  people.forEach(function(person) {
    clearCalendar(person.calendar);
    populateCalendar(person.calendar, cyclesSheet);
  });
}

function getPeople(valuesSheet) {
  const values = valuesSheet.getRange(data.values.gcalColumnId + '2:' + data.values.gcalColumnId + '5').getValues();
  var people = [];
  for(var i = 0; i < values.length; i+=2) {
    if(values[i][0] && values[i + 1][0]){
      people.push({
        name: values[i][0],
        calendar: CalendarApp.getCalendarById(values[i + 1][0])
      });
    }
  }
  return people;
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
  const values = cyclesSheet.getRange(data.range.offsets.row, data.range.offsets.col, data.range.maxRows, data.range.maxCols).getValues();
  data.cycles.rangeColumns = getRangeColumns();
  var events = getEvents(values);
  var season = getSeason(values);
  alertEvents(events, season);
  calendar.createAllDayEvent('TEST', new Date('May 12, 2021'));
}

function getRangeColumns() {
  return {
    noun: data.cycles.sheetColumns.noun - data.range.offsets.col,
    verb: data.cycles.sheetColumns.verb - data.range.offsets.col,
    date: data.cycles.sheetColumns.date - data.range.offsets.col,
    name: data.cycles.sheetColumns.name - data.range.offsets.col
  };
}

function getEvents(values) {
  var events = [];
  var currentRange = 0;
  events[currentRange] = [];

  for(var i = 0; i < values.length; i++) {
    if(values[i][data.cycles.rangeColumns.date] === data.cycles.dateLabel) {
      currentRange++;
      events[currentRange] = [];
    } else if(values[i][data.cycles.rangeColumns.date] instanceof Date){
      events[currentRange].push({
        title: values[i][data.cycles.rangeColumns.noun] + ': ' + values[i][data.cycles.rangeColumns.verb],
        name: values[i][data.cycles.rangeColumns.name],
        date: values[i][data.cycles.rangeColumns.date]
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