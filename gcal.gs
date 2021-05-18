var data;

function loadData() {
  data = {
    gsheets: {
      spreadsheet: null,
      cyclesSheet: null,
      valuesSheet: null
    },
    people: null,
    range: {
      offsets: {
        row: 2,
        col: 2
      },
      maxRows: 500,
      maxCols: 14
    },
    valuesSheet: {
      name: '(dropdowns)',
      peopleCalendars: {
        start: 'K2',
        end: 'K5'
      }
    },
    cyclesSheet: {
      name: 'Cycles',
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

  data.cyclesSheet.triggerColumns = [
    data.cyclesSheet.columns.noun,
    data.cyclesSheet.columns.verb,
    data.cyclesSheet.columns.lastDone,
    data.cyclesSheet.columns.name,
    data.cyclesSheet.columns.cycleDays,
    data.cyclesSheet.columns.nudgeDays,
    data.cyclesSheet.columns.startTime,
    data.cyclesSheet.columns.durationHours
  ];

  data.gsheets.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  data.gsheets.cyclesSheet = data.gsheets.spreadsheet.getSheetByName(data.cyclesSheet.name);
  data.gsheets.valuesSheet = data.gsheets.spreadsheet.getSheetByName(data.valuesSheet.name);
}

function onEditInstalledTrigger(e) {
  loadData();
  if (!isValidTrigger(e)) return;
  updateCalendar();
}

function isValidTrigger(e){
  return data.gsheets.spreadsheet.getActiveSheet().getName() === data.cyclesSheet.name &&
    data.cyclesSheet.triggerColumns.indexOf(e.range.columnStart) != -1
}

function updateCalendar() {
  data.people = getPeople();
  data.people.forEach(function(person) {
    clearCalendar(person);
    populateCalendar(person);
  });
}

function getPeople() {
  const values = data.gsheets.valuesSheet.getRange(data.valuesSheet.peopleCalendars.start + ':' + data.valuesSheet.peopleCalendars.end).getValues();
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
  const values = data.gsheets.cyclesSheet.getRange(data.range.offsets.row, data.range.offsets.col, data.range.maxRows, data.range.maxCols).getValues();
  data.cyclesSheet.rangeColumns = getRangeColumns();
  data.otherPeopleNames = getOtherPeopleNames(person);
  var events = getEvents(values);
  var season = getSeason(values);
  alertEvents(events, season);
  //person.calendar.createAllDayEvent('TEST5', new Date('May 12, 2021'));
}

function getRangeColumns() {
  return {
    noun: data.cyclesSheet.columns.noun - data.range.offsets.col,
    verb: data.cyclesSheet.columns.verb - data.range.offsets.col,
    name: data.cyclesSheet.columns.name - data.range.offsets.col,
    workDate: data.cyclesSheet.columns.workDate - data.range.offsets.col
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
    str += values[i][data.cyclesSheet.rangeColumns.workDate] + " ";
    if(values[i][data.cyclesSheet.rangeColumns.workDate] === data.cyclesSheet.workDateLabel) {
      currentRange++;
      events[currentRange] = [];
    } else if(isApplicableEvent(values[i])){
      events[currentRange].push({
        title: values[i][data.cyclesSheet.rangeColumns.noun] + ': ' + values[i][data.cyclesSheet.rangeColumns.verb],
        name: values[i][data.cyclesSheet.rangeColumns.name],
        date: values[i][data.cyclesSheet.rangeColumns.workDate]
      });
    }
  }

  return events;
}

function isApplicableEvent(value) {
  return value[data.cyclesSheet.rangeColumns.workDate] instanceof Date &&
         !data.otherPeopleNames.includes(value[data.cyclesSheet.rangeColumns.name])
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