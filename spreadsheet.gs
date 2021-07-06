function getSpreadsheetEvents(person) {
  var extractionState = {
    currentEventCategoryIndex: 0,
    currentEventCategory: '',
    eventsByCategory: {},
    person: person,
    exclusionListNames: getOtherPeopleNames(person),
    fillInTheBlanksDate: getStarterDate()
  }

  extractEvents(state.cycles, state.regularSection, extractionState);
  extractEvents(state.cycles, state.checklistSection, extractionState);
  extractEvents(state.todo, state.todoSection, extractionState);

  return collapseEventsToArray(extractionState.eventsByCategory);
}

function extractEvents(sheet, section, extractionState) {
  const rangeValues = state.rangeValues[sheet.sheetName];

  for(var i = 0; i < rangeValues.length; i++) {
    const row = rangeValues[i];

    if(isWorkDateLabel(row[section.rangeColumns.workDate])) {
      extractionState.currentEventCategoryIndex++;
      extractionState.currentEventCategory = state.cycles.eventCategories[extractionState.currentEventCategoryIndex];
      extractionState.eventsByCategory[extractionState.currentEventCategory] = [];

    } else if(isValidEventData(row, section, extractionState)) {
      var eventFromSpreadsheet = buildEventFromSpreadsheet(row, section, extractionState);
      extractionState.eventsByCategory[extractionState.currentEventCategory].push(eventFromSpreadsheet);
    }
  }
}

function collapseEventsToArray(eventsByCategory) {
  var eventArray = eventsByCategory['Evergreen'];
  eventArray = eventArray.concat(eventsByCategory[state.season]);
  if(state.transition) {
    eventArray = eventArray.concat(eventsByCategory[state.transition]);
  }
  eventArray = eventArray.concat(eventsByCategory['Todo']);
  return eventArray;
}

function isValidEventData(row, section, extractionState) {
  return state.validEventCategories.includes(extractionState.currentEventCategory) &&
         !getIsDone(section, row) &&
         (typeof row[section.rangeColumns.noun] == 'string' && row[section.rangeColumns.noun].length > 0) &&
         (typeof row[section.rangeColumns.verb] == 'string' && row[section.rangeColumns.verb].length > 0) &&
         (section.allowFillInTheBlanksDates || row[section.rangeColumns.workDate] instanceof Date) &&
         !extractionState.exclusionListNames.includes(row[section.rangeColumns.name])
}

function buildEventFromSpreadsheet(row, section, extractionState) {
  var startDateTime, endDateTime, isAllDay;

  if(isFillInTheBlanks(row, section)) {
    isAllDay = true;
    startDateTime = new Date(extractionState.fillInTheBlanksDate);
    endDateTime = null;
  } else {
    const startTime = row[section.rangeColumns.startTime];
    const durationHours = row[section.rangeColumns.durationHours];
    isAllDay = getIsAllDay(startTime, durationHours);
    startDateTime = new Date(row[section.rangeColumns.workDate]);
    startDateTime = getPulledForward(startDateTime);

    if(isAllDay) {
      endDateTime = null;
    } else {
      startDateTime.setHours(startTime);
      endDateTime = new Date(startDateTime);
      endDateTime.setHours(startTime + durationHours);
      endDateTime.setMinutes((durationHours - Math.floor(durationHours)) * 60);
      endDateTime.setSeconds(0);
      endDateTime.setMilliseconds(0);
    }
  }

  return {
    title: row[section.rangeColumns.noun] + ': ' + row[section.rangeColumns.verb],
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    isAllDay: isAllDay,
    isDone: getIsDone(section, row),
    options: {
      description: generateDescription(row, section, extractionState.currentEventCategory),
      location: extractionState.currentEventCategory,
      guests: extractionState.person.inviteEmail
    },
    isAlreadyInCalendar: false
  };
}

function isFillInTheBlanks(row, section) {
  return section.allowFillInTheBlanksDates && (!(row[section.rangeColumns.workDate] instanceof Date));
}

function getPulledForward(dateTime) {
  if(dateTime < state.today) {
    var pulledForwardDate = new Date(dateTime);
    pulledForwardDate.setFullYear(state.today.getFullYear());
    pulledForwardDate.setMonth(state.today.getMonth());
    pulledForwardDate.setDate(state.today.getDate());
    return pulledForwardDate;
  }
  return dateTime;
}

function getIsDone(section, row) {
  if(section.hasDoneCol) {
    return row[section.rangeColumns.done] === 'Yes';
  }
  return false;
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

function generateDescription(row, section, eventCategory) {
  var name = row[section.rangeColumns.name];
  name = name.replace('Either', 'either Julie or Andy');
  name = name.replace('Both', 'both Julie and Andy together');
  return 'This event is from the "' + eventCategory + '" section, for ' +  name + '.\n\n' + state.eventDescription;
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

function setSeason() {
  const statusStr = state.rangeValues[state.cycles.sheetName][0][state.cyclesGlobal.rangeColumns.season];
  state.season = statusStr.substring(statusStr.length - state.cycles.seasonStringLength);
  var fromSeason = statusStr.substring(0, state.cycles.seasonStringLength);
  state.transition = fromSeason === state.season ? false : statusStr;
  state.validEventCategories = [state.season, state.transition, 'Evergreen', 'Todo'];
}