var data;

function loadData() {
  data = {
    spreadsheet: null,
    people: null,
    values: {
      sheetName: '(dropdowns)',
      sheet: null,
      range: {
        start: 'K2',
        end: 'K5'
      }
    },
    cycles: {
      sheetName: 'Cycles',
      sheet: null,
      range: {
        offsets: {
          row: 2,
          col: 2
        },
        maxRows: 500,
        maxCols: 14
      },
      workDateLabel: 'Work date (calc)',
      columns: {
        noun: 2,
        verb: 3,
        lastDone: 4,
        name: 6,
        cycleDays: 7,
        nudgeDays: 11,
        startTime: 12,
        durationHours: 13,
        workDate: 14
      },
      triggerColumns: null
    }
  };

  data.cycles.triggerColumns = [
    data.cycles.columns.noun,
    data.cycles.columns.verb,
    data.cycles.columns.lastDone,
    data.cycles.columns.name,
    data.cycles.columns.cycleDays,
    data.cycles.columns.nudgeDays,
    data.cycles.columns.startTime,
    data.cycles.columns.durationHours
  ];

  data.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  data.cycles.sheet = data.spreadsheet.getSheetByName(data.cycles.sheetName);
  data.values.sheet = data.spreadsheet.getSheetByName(data.values.sheetName);
}

function onEditInstalledTrigger(e) {
  loadData();
  if (!isValidTrigger(e)) return;
  updateCalendar();
}

function isValidTrigger(e){
  return data.spreadsheet.getActiveSheet().getName() === data.cycles.sheetName &&
    data.cycles.triggerColumns.indexOf(e.range.columnStart) != -1
}

function updateCalendar() {
  data.people = getPeople();
  data.people.forEach(function(person) {
    clearCalendar(person);
    populateCalendar(person);
  });
}

function getPeople() {
  const values = data.values.sheet.getRange(data.values.range.start + ':' + data.values.range.end).getValues();
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

function populateCalendar(person) {
  const values = data.cycles.sheet.getRange(data.cycles.range.offsets.row, data.cycles.range.offsets.col, data.cycles.range.maxRows, data.cycles.range.maxCols).getValues();
  data.cycles.rangeColumns = getRangeColumns();
  data.otherPeopleNames = getOtherPeopleNames(person);
  var events = getEvents(values);
  var season = getSeason(values);
  alertEvents(events, season);
  //person.calendar.createAllDayEvent('TEST5', new Date('May 12, 2021'));
}

function getRangeColumns() {
  return {
    noun: data.cycles.columns.noun - data.cycles.range.offsets.col,
    verb: data.cycles.columns.verb - data.cycles.range.offsets.col,
    name: data.cycles.columns.name - data.cycles.range.offsets.col,
    workDate: data.cycles.columns.workDate - data.cycles.range.offsets.col
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

function getEvents(values) {
  var events = [];
  var currentRange = 0;
  events[currentRange] = [];

  for(var i = 0; i < values.length; i++) {
    if(values[i][data.cycles.rangeColumns.workDate] === data.cycles.workDateLabel) {
      currentRange++;
      events[currentRange] = [];
    } else if(isApplicableEvent(values[i])){
      events[currentRange].push({
        title: values[i][data.cycles.rangeColumns.noun] + ': ' + values[i][data.cycles.rangeColumns.verb],
        name: values[i][data.cycles.rangeColumns.name],
        date: values[i][data.cycles.rangeColumns.workDate]
      });
    }
  }

  return events;
}

function isApplicableEvent(value) {
  return value[data.cycles.rangeColumns.workDate] instanceof Date &&
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