function updateSpreadsheetChangedEvents(person, spreadsheetEvents) {
  spreadsheetEvents.forEach(function(spreadsheetEvent){
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

function getRangeValuesBySheetName() {
  return {
    'Todo': state.todo.sheet.getRange(
      state.todo.range.offsets.row,
      state.todo.range.offsets.col,
      state.todo.range.maxRows,
      state.todo.range.maxCols).getValues(),
    'Cycles': state.cycles.sheet.getRange(
      state.cycles.range.offsets.row,
      state.cycles.range.offsets.col,
      state.cycles.range.maxRows,
      state.cycles.range.maxCols).getValues()
    };
}

function getSpreadsheetEvents(person, rangeValues) {
  var extractionState = {
    rangeValues: rangeValues,
    eventsBySeason: [],
    seasonIndex: 0,
    exclusionListNames: getOtherPeopleNames(person),
    fillInTheBlanksDate: getStarterDate()
  }
  extractionState.eventsBySeason[extractionState.seasonIndex] = [];
  populateSpreadsheetSectionEvents(extractionState, state.regularSection);
  populateSpreadsheetSectionEvents(extractionState, state.checklistSection);
  return collapseEventsToArray(extractionState.eventsBySeason);
}

function populateSpreadsheetSectionEvents(extractionState, section) {
  for(var i = 0; i < extractionState.rangeValues.length; i++) {
    const row = extractionState.rangeValues[i];
    if(isWorkDateLabel(row[section.rangeColumns.workDate])) {
      extractionState.seasonIndex++;
      extractionState.eventsBySeason[extractionState.seasonIndex] = [];
    } else if(isValidEventData(row, extractionState, section)) {
      var eventFromSpreadsheet = buildEventFromSpreadsheet(row, extractionState, section);
      extractionState.eventsBySeason[extractionState.seasonIndex].push(eventFromSpreadsheet);
    }
  }
}

function isWorkDateLabel(str) {
  return typeof str == 'string' && str.substring(0, state.workDateLabelText.length) === state.workDateLabelText;
}

function collapseEventsToArray(eventsBySeason) {
  var eventArray = eventsBySeason[state.cycles.seasons.evergreen];

  eventArray = eventArray.concat(
    state.season === 'Summer' ?
      eventsBySeason[state.cycles.seasons.summer] :
      eventsBySeason[state.cycles.seasons.winter]);

  if(state.transition) {
    var checklistEvents = state.transition === 'Winter->Summer' ?
      eventsBySeason[state.cycles.seasons.winterToSummer] :
      eventsBySeason[state.cycles.seasons.summerToWinter];
    eventArray = eventArray.concat(checklistEvents);
  }

  return eventArray;
}

function isValidEventData(row, extractionState, section) {
  var currentExtractionSeason = state.cycles.seasonNames[extractionState.seasonIndex];
  return (currentExtractionSeason === state.season || currentExtractionSeason === state.transition || currentExtractionSeason === 'Evergreen') &&
         !getIsDone(section, row) &&
         (typeof row[section.rangeColumns.noun] == 'string' &&  row[section.rangeColumns.noun].length > 0) &&
         (typeof row[section.rangeColumns.verb] == 'string' &&  row[section.rangeColumns.verb].length > 0) &&
         (section.allowFillInTheBlanksDates || row[section.rangeColumns.workDate] instanceof Date) &&
         !extractionState.exclusionListNames.includes(row[section.rangeColumns.name])
}

function buildEventFromSpreadsheet(row, extractionState, section) {
  const fillInTheBlanks = section.allowFillInTheBlanksDates && (!(row[section.rangeColumns.workDate] instanceof Date));
  var startDateTime, endDateTime, isAllDay;

  if(fillInTheBlanks) {
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
  const seasonName = state.cycles.seasonNames[extractionState.seasonIndex];

  return {
    title: row[section.rangeColumns.noun] + ': ' + row[section.rangeColumns.verb],
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    isAllDay: isAllDay,
    isDone: isDone,
    options: {
      description: generateDescription(row, section, seasonName),
      location: seasonName
    },
    isAlreadyInCalendar: false
  };
}

function getIsDone(section, row) {
  if(section.hasDoneCol) {
    return row[section.rangeColumns.done] === 'Yes';
  }
  return false;
}

function setSeason(rangeValues) {
  const statusStr = rangeValues[0][state.cyclesGlobal.rangeColumns.season];
  state.season = statusStr.substring(statusStr.length - state.cycles.seasonStringLength);
  var fromSeason = statusStr.substring(0, state.cycles.seasonStringLength);
  state.transition = fromSeason === state.season ? false : statusStr;
}