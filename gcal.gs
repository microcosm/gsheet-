var data;

function loadData() {
  data = {
    spreadsheet: SpreadsheetApp.getActiveSpreadsheet(),
    season: null,
    people: null,
    eventDescription: 'Created by <a href="https://docs.google.com/spreadsheets/d/1uNxspHrfm9w-DPH1wfhTNdySxupd7h1RFrWlHCYPVcs/edit?usp=sharing#gid=966806031">mega—</a>',
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
      seasonStringLength: 6,
      seasons: {
        evergreen: 1,
        summer: 2,
        winter: 3
      },
      seasonNames: {
        1: 'Evergreen',
        2: 'Summer',
        3: 'Winter'
      },
      columns: {
        noun: 2,
        verb: 3,
        lastDone: 4,
        name: 6,
        cycleDays: 7,
        nudgeDays: 11,
        startTime: 12,
        durationHours: 13,
        workDate: 14,
        season: 15
      },
      triggerColumns: null,
      rangeColumns: {}
    }
  };

  data.cycles.sheet = data.spreadsheet.getSheetByName(data.cycles.sheetName);
  data.values.sheet = data.spreadsheet.getSheetByName(data.values.sheetName);

  data.people = getPeople();

  data.cycles.triggerColumns = [
    data.cycles.columns.noun,
    data.cycles.columns.verb,
    data.cycles.columns.lastDone,
    data.cycles.columns.name,
    data.cycles.columns.cycleDays,
    data.cycles.columns.nudgeDays,
    data.cycles.columns.startTime,
    data.cycles.columns.durationHours,
    data.cycles.columns.season
  ];

  for(var key in data.cycles.columns) {
    data.cycles.rangeColumns[key] = data.cycles.columns[key] - data.cycles.range.offsets.col;
  }
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
  data.people.forEach(function(person) {
    const cyclesRange = data.cycles.sheet.getRange(data.cycles.range.offsets.row, data.cycles.range.offsets.col, data.cycles.range.maxRows, data.cycles.range.maxCols).getValues();
    data.season = getSeason(cyclesRange);
    var events = getEvents(person, cyclesRange);
    clearCalendar(person);
    populateCalendar(person, events);
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

function populateCalendar(person, events) {
  //alertEvents(events);
  events.forEach(function(event){
    event.isAllDay ?
      person.calendar.createAllDayEvent(event.title, event.startDateTime, event.options) :
      person.calendar.createEvent(event.title, event.startDateTime, event.endDateTime, event.options);
  });
}

function getEvents(person, cyclesRange) {
  var events = [];
  var currentRange = 0;
  events[currentRange] = [];
  const exclusionListNames = getOtherPeopleNames(person);

  for(var i = 0; i < cyclesRange.length; i++) {
    const cyclesRow = cyclesRange[i];
    if(cyclesRow[data.cycles.rangeColumns.workDate] === data.cycles.workDateLabel) {
      currentRange++;
      events[currentRange] = [];
    } else if(isApplicableEvent(cyclesRow, exclusionListNames)){
      events[currentRange].push(buildNewEvent(cyclesRow, currentRange));
    }
  }

  return events[data.cycles.seasons.evergreen].concat(data.season === 'Summer' ? events[data.cycles.seasons.summer] : events[data.cycles.seasons.winter]);
}

function buildNewEvent(cyclesRow, seasonIndex) {
  const startTime = cyclesRow[data.cycles.rangeColumns.startTime];
  const durationHours = cyclesRow[data.cycles.rangeColumns.durationHours];
  var startDateTime = new Date(cyclesRow[data.cycles.rangeColumns.workDate]);
  startDateTime.setHours(startTime);
  var endDateTime = new Date(cyclesRow[data.cycles.rangeColumns.workDate]);
  endDateTime.setHours(startTime + durationHours);
  endDateTime.setMinutes((durationHours - Math.floor(durationHours)) * 60);

  return {
    title: cyclesRow[data.cycles.rangeColumns.noun] + ': ' + cyclesRow[data.cycles.rangeColumns.verb] + ' (' + cyclesRow[data.cycles.rangeColumns.name] + ')',
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    isAllDay: isAllDay(startTime, durationHours),
    seasonIndex: seasonIndex,
    options: {
      description: data.eventDescription
    }
  };
}

function isAllDay(startTime, durationHours) {
  return !(
    startTime >= 0 &&
    startTime <= 24 &&
    durationHours > 0);
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

function isApplicableEvent(cyclesRow, exclusionListNames) {
  return cyclesRow[data.cycles.rangeColumns.workDate] instanceof Date &&
         !exclusionListNames.includes(cyclesRow[data.cycles.rangeColumns.name])
}

function getSeason(cyclesRange) {
  const statusStr = cyclesRange[0][data.cycles.rangeColumns.season];
  return statusStr.substring(statusStr.length - data.cycles.seasonStringLength);
}

function alertEvents(events) {
  var str = '';
  events.forEach(function(event) {
    str +=
      '[' + data.cycles.seasonNames[event.seasonIndex] + '] ' +
      event.title + ' ' +
      (event.isAllDay ?
        event.startDateTime + ' ALL DAY' :
        event.startDateTime + ' until ' + event.endDateTime.getHours() + ':' + event.endDateTime.getMinutes()
      ) + '\n';
  });
  SpreadsheetApp.getUi().alert(str);
}