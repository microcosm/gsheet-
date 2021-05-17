var data = {
  range: {
    offsets: {
      row: 2,
      col: 2
    },
    maxRows: 500,
    maxCols: 9
  },
  peopleCalendars: {
    sheetName: '(dropdowns)',
    start: 'K2',
    end: 'K5'
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
  const peopleCalendarsSheet = spreadsheet.getSheetByName(data.peopleCalendars.sheetName);
  updateCalendar(triggeringSheet, peopleCalendarsSheet);
}

function updateCalendar(cyclesSheet, peopleCalendarsSheet) {
  data.people = getPeople(peopleCalendarsSheet);
  data.people.forEach(function(person) {
    clearCalendar(person);
    populateCalendar(cyclesSheet, person);
  });
}

function getPeople(peopleCalendarsSheet) {
  const values = peopleCalendarsSheet.getRange(data.peopleCalendars.start + ':' + data.peopleCalendars.end).getValues();
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

function clearCalendar(person) {
  const fromDate = new Date('January 1, 2000');
  const toDate = new Date('January 1, 3000');
  const events = person.calendar.getEvents(fromDate, toDate);
  for(var i = 0; i < events.length; i++){
    events[i].deleteEvent();
  }
}

function populateCalendar(cyclesSheet, person) {
  const values = cyclesSheet.getRange(data.range.offsets.row, data.range.offsets.col, data.range.maxRows, data.range.maxCols).getValues();
  data.cycles.rangeColumns = getRangeColumns();
  data.otherPeopleNames = getOtherPeopleNames(person);
  var events = getEvents(values, person);
  var season = getSeason(values);
  alertEvents(events, season);
  person.calendar.createAllDayEvent('TEST', new Date('May 12, 2021'));
}

function getRangeColumns() {
  return {
    noun: data.cycles.sheetColumns.noun - data.range.offsets.col,
    verb: data.cycles.sheetColumns.verb - data.range.offsets.col,
    date: data.cycles.sheetColumns.date - data.range.offsets.col,
    name: data.cycles.sheetColumns.name - data.range.offsets.col
  };
}

function getOtherPeopleNames(person) {
  var otherPeopleNames = [];
  data.people.forEach(function(possibleOther) {
    if(possibleOther.name != person.name) {
      otherPeopleNames.push(possibleOther.name);
    }
  });
  return otherPeopleNames;
}

function getEvents(values, person) {
  var events = [];
  var currentRange = 0;
  events[currentRange] = [];

  for(var i = 0; i < values.length; i++) {
    if(values[i][data.cycles.rangeColumns.date] === data.cycles.dateLabel) {
      currentRange++;
      events[currentRange] = [];
    } else if(isApplicableEvent(values[i])){
      events[currentRange].push({
        title: values[i][data.cycles.rangeColumns.noun] + ': ' + values[i][data.cycles.rangeColumns.verb],
        name: values[i][data.cycles.rangeColumns.name],
        date: values[i][data.cycles.rangeColumns.date]
      });
    }
  }

  return events;
}

function isApplicableEvent(value) {
  return value[data.cycles.rangeColumns.date] instanceof Date &&
         !data.otherPeopleNames.includes(value[data.cycles.rangeColumns.name])
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