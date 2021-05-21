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
  if(!isValidTrigger(e)) return;
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
    var events = getSpreadsheetEvents(person, cyclesRange);
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

function populateCalendar(person, spreadsheetEvents) {
  var calendarEvents = getCalendarEvents(person);
  //alertEvents(spreadsheetEvents, calendarEvents);

  //loop through spreadsheetEvents
  //for each, look for a corresponding match in calendarEvents (based on title, start time, end time and whether its all day)
  //if a match is found
  //  delete the event from spreadsheetEvents
  //  note the calendarEventId in a doNotDelete list
  
  //delete all from calendarEvents except those in the doNotDelete list

  /*events.forEach(function(event){
    event.isAllDay ?
      person.calendar.createAllDayEvent(event.title, event.startDateTime, event.options) :
      person.calendar.createEvent(event.title, event.startDateTime, event.endDateTime, event.options);
  });*/
}

function getCalendarEvents(person) {
  const fromDate = new Date('January 1, 2000');
  const toDate = new Date('January 1, 3000');
  const googleCalendarEvents = person.calendar.getEvents(fromDate, toDate);
  var calendarEvents = [];
  googleCalendarEvents.forEach(function(googleCalendarEvent) {
    calendarEvents.push(buildEventFromCalendar(googleCalendarEvent));
  });
  return calendarEvents;
}

function getSpreadsheetEvents(person, cyclesRange) {
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
      events[currentRange].push(buildEventFromSpreadsheet(cyclesRow, data.cycles.seasonNames[currentRange]));
    }
  }

  return events[data.cycles.seasons.evergreen].concat(data.season === 'Summer' ? events[data.cycles.seasons.summer] : events[data.cycles.seasons.winter]);
}

function buildEventFromCalendar(googleCalendarEvent) {
  return {
    title: googleCalendarEvent.getTitle(),
    startDateTime: googleCalendarEvent.getStartTime(),
    endDateTime: googleCalendarEvent.getEndTime(),
    isAllDay: googleCalendarEvent.isAllDayEvent(),
    options: {
      description: googleCalendarEvent.getDescription(),
      location: googleCalendarEvent.getLocation()
    }
  };
}

function buildEventFromSpreadsheet(cyclesRow, seasonName) {
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
    options: {
      description: data.eventDescription,
      location: seasonName
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

function existsInCalendarEvents(spreadsheetEvent, calendarEvents) {
  var numFound = 0;
  calendarEvents.forEach(function(calendarEvent) {
    var isEqual =
      calendarEvent.title === spreadsheetEvent.title &&
      calendarEvent.startDateTime.getTime() === spreadsheetEvent.startDateTime.getTime() &&
      (calendarEvent.isAllDay ? true : calendarEvent.endDateTime.getTime() === spreadsheetEvent.endDateTime.getTime()) &&
      calendarEvent.isAllDay === spreadsheetEvent.isAllDay &&
      calendarEvent.options.location === spreadsheetEvent.options.location;
    if(isEqual) {
      numFound++;
    }
  });
  return numFound > 0;
}

function alertEvents(spreadsheetEvents, calendarEvents) {
  var str = '';
  spreadsheetEvents.forEach(function(spreadsheetEvent) {
    var modificationStr = existsInCalendarEvents(spreadsheetEvent, calendarEvents) ? '' : '* ';
    str += modificationStr +
      ' [' + spreadsheetEvent.options.location + '] ' +
      spreadsheetEvent.title + ' ' +
      (spreadsheetEvent.isAllDay ?
        spreadsheetEvent.startDateTime + ' ALL DAY' :
        spreadsheetEvent.startDateTime + ' until ' + spreadsheetEvent.endDateTime.getHours() + ':' + spreadsheetEvent.endDateTime.getMinutes()
      ) + '\n';
  });
  SpreadsheetApp.getUi().alert(str);
}