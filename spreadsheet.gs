function updateSpreadsheetChangedEvents(person) {
  person.spreadsheetEvents.forEach(function(spreadsheetEvent){
    if(!spreadsheetEvent.existsInCalendar) {
      logEventCreated(spreadsheetEvent);
      if(state.execution.performDataUpdates) {
        spreadsheetEvent.isAllDay ?
          person.calendar.createAllDayEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.options) :
          person.calendar.createEvent(spreadsheetEvent.title, spreadsheetEvent.startDateTime, spreadsheetEvent.endDateTime, spreadsheetEvent.options);
      }
    }
  });
}

function setRangeValues() {
  const todoRangeValues = state.todo.sheet.getRange (
        state.todo.range.offsets.row, state.todo.range.offsets.col,
        state.todo.range.maxRows, state.todo.range.maxCols
      ).getValues();

  const cyclesRangeValues = state.cycles.sheet.getRange (
        state.cycles.range.offsets.row, state.cycles.range.offsets.col,
        state.cycles.range.maxRows, state.cycles.range.maxCols
      ).getValues();

  state.rangeValues[state.todo.sheetName] = todoRangeValues;
  state.rangeValues[state.cycles.sheetName] = cyclesRangeValues;
}

function getSpreadsheetEvents(person) {
  var extractionState = {
    eventsByIndex: [],
    eventIndex: 0,
    exclusionListNames: getOtherPeopleNames(person),
    fillInTheBlanksDate: getStarterDate()
  }
  extractionState.eventsByIndex[extractionState.eventIndex] = [];

  extractEvents(state.cycles, state.regularSection, extractionState);
  extractEvents(state.cycles, state.checklistSection, extractionState);
  extractEvents(state.todo, state.todoSection, extractionState);

  return collapseEventsToArray(extractionState.eventsByIndex);
}

function extractEvents(sheet, section, extractionState) {
  const rangeValues = state.rangeValues[sheet.sheetName];
  rangeValues.forEach(function(row) {
    if(isWorkDateLabel(row[section.rangeColumns.workDate])) {
      extractionState.eventIndex++;
      extractionState.eventsByIndex[extractionState.eventIndex] = [];
    } else if(isValidEventData(row, section, extractionState)) {
      var eventFromSpreadsheet = buildEventFromSpreadsheet(row, section, extractionState);
      extractionState.eventsByIndex[extractionState.eventIndex].push(eventFromSpreadsheet);
    }
  });
}

function getOtherPeopleNames(person) {
  var otherPeopleNames = [];
  state.people.forEach(function(possibleOther) {
    if(possibleOther.name != person.name) {
      otherPeopleNames.push(possibleOther.name);
    }
  });
  return otherPeopleNames;
}

function isWorkDateLabel(str) {
  return typeof str == 'string' && str.substring(0, state.workDateLabelText.length) === state.workDateLabelText;
}

function collapseEventsToArray(eventsByIndex) {
  var eventArray = eventsByIndex[state.cycles.eventIndices.evergreen];

  eventArray = eventArray.concat(
    state.season === 'Summer' ?
      eventsByIndex[state.cycles.eventIndices.summer] :
      eventsByIndex[state.cycles.eventIndices.winter]);

  if(state.transition) {
    var checklistEvents = state.transition === 'Winter->Summer' ?
      eventsByIndex[state.cycles.eventIndices.winterToSummer] :
      eventsByIndex[state.cycles.eventIndices.summerToWinter];
    eventArray = eventArray.concat(checklistEvents);
  }

  eventArray = eventArray.concat(eventsByIndex[state.cycles.eventIndices.todo]);

  return eventArray;
}

function isValidEventData(row, section, extractionState) {
  var currentExtractionIndex = state.cycles.eventIndexNames[extractionState.eventIndex];
  return (currentExtractionIndex === state.season || currentExtractionIndex === state.transition || currentExtractionIndex === 'Evergreen' || currentExtractionIndex === 'Todo') &&
         !getIsDone(section, row) &&
         (typeof row[section.rangeColumns.noun] == 'string' &&  row[section.rangeColumns.noun].length > 0) &&
         (typeof row[section.rangeColumns.verb] == 'string' &&  row[section.rangeColumns.verb].length > 0) &&
         (section.allowFillInTheBlanksDates || row[section.rangeColumns.workDate] instanceof Date) &&
         !extractionState.exclusionListNames.includes(row[section.rangeColumns.name])
}

function buildEventFromSpreadsheet(row, section, extractionState) {
  var startDateTime, endDateTime, isAllDay;

  if(isFillInTheBlanks(row, section)) {
    isAllDay = true;
    extractionState.fillInTheBlanksDate = extractionState.fillInTheBlanksDate.addDays(1);
    startDateTime = new Date(extractionState.fillInTheBlanksDate);
    endDateTime = null;
  } else {
    const startTime = row[section.rangeColumns.startTime];
    const durationHours = row[section.rangeColumns.durationHours];
    isAllDay = getIsAllDay(startTime, durationHours);
    startDateTime = new Date(row[section.rangeColumns.workDate]);

    if(isAllDay) {
      endDateTime = null;
    } else {
      startDateTime.setHours(startTime);
      endDateTime = new Date(row[section.rangeColumns.workDate]);
      endDateTime.setHours(startTime + durationHours);
      endDateTime.setMinutes((durationHours - Math.floor(durationHours)) * 60);
      endDateTime.setSeconds(0);
      endDateTime.setMilliseconds(0);
    }
  }

  const isDone = getIsDone(section, row);
  const eventIndexName = state.cycles.eventIndexNames[extractionState.eventIndex];

  return {
    title: row[section.rangeColumns.noun] + ': ' + row[section.rangeColumns.verb],
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    isAllDay: isAllDay,
    isDone: isDone,
    options: {
      description: generateDescription(row, section, eventIndexName),
      location: eventIndexName
    },
    isAlreadyInCalendar: false
  };
}

function isFillInTheBlanks(row, section) {
  return section.allowFillInTheBlanksDates && (!(row[section.rangeColumns.workDate] instanceof Date));
}

function getIsDone(section, row) {
  if(section.hasDoneCol) {
    return row[section.rangeColumns.done] === 'Yes';
  }
  return false;
}

function setSeason() {
  const statusStr = state.rangeValues[state.cycles.sheetName][0][state.cyclesGlobal.rangeColumns.season];
  state.season = statusStr.substring(statusStr.length - state.cycles.seasonStringLength);
  var fromSeason = statusStr.substring(0, state.cycles.seasonStringLength);
  state.transition = fromSeason === state.season ? false : statusStr;
}