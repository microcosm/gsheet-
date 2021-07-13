function getSpreadsheetEvents(person) {
  var extractionState = {
    currentEventCategoryIndex: 0,
    currentEventCategory: '',
    eventsByCategory: {},
    person: person,
    exclusionListNames: getOtherPeopleNames(person),
    fillInTheBlanksDate: state.today
  }

  extractEvents(state.cycles, state.cycles.sections.regular, extractionState);
  extractEvents(state.cycles, state.cycles.sections.checklist, extractionState);
  extractEvents(state.todo, state.todo, extractionState);

  return collapseEventsToArray(extractionState.eventsByCategory);
}

function extractEvents(subsheet, section, extractionState) {
  const rangeValues = state.rangeValues[subsheet.tab.name];

  for(var i = 0; i < rangeValues.length; i++) {
    const row = rangeValues[i];

    if(isWorkDateLabel(row[section.rangeColumns.workDate])) {
      extractionState.currentEventCategoryIndex++;
      extractionState.currentEventCategory = state.cycles.eventCategories[extractionState.currentEventCategoryIndex];
      extractionState.eventsByCategory[extractionState.currentEventCategory] = [];

    } else if(isValidEventData(row, section, extractionState)) {
      var eventFromSpreadsheet = buildEventFromSpreadsheet(subsheet, section, extractionState, row);
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

function buildEventFromSpreadsheet(subsheet, section, extractionState, row) {
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
      description: generateDescription(subsheet, section, extractionState, row),
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

function generateDescription(subsheet, section, extractionState, row) {
  const name = getNameSubstitution(row[section.rangeColumns.name]);

  return 'This event is from the "' + extractionState.currentEventCategory +
    '" section, for ' + name +
    '.\n\nCreated by <a href="https://docs.google.com/spreadsheets/d/' + config.gsheet.id +
    '/edit?usp=sharing' +
    (subsheet.tab.hasOwnProperty('id') ? '#gid=' + subsheet.tab.id : '') +
    '">' + config.gsheet.name + '</a>&nbsp;&larr; Click here for more';
}

function setRangeValues() {
  const todoRangeValues = state.todo.tab.tab.getRange (
        state.todo.range.offsets.row, state.todo.range.offsets.col,
        state.todo.range.maxRows, state.todo.range.maxCols
      ).getValues();

  const cyclesRangeValues = state.cycles.tab.tab.getRange (
        state.cycles.range.offsets.row, state.cycles.range.offsets.col,
        state.cycles.range.maxRows, state.cycles.range.maxCols
      ).getValues();

  state.rangeValues[state.todo.tab.name] = todoRangeValues;
  state.rangeValues[state.cycles.tab.name] = cyclesRangeValues;
}

function setSeason() {
  const statusStr = state.rangeValues[state.cycles.tab.name][0][state.cycles.sections.global.rangeColumns.season];
  state.season = statusStr.substring(statusStr.length - state.cycles.seasonStringLength);
  var fromSeason = statusStr.substring(0, state.cycles.seasonStringLength);
  state.transition = fromSeason === state.season ? false : statusStr;
  state.validEventCategories = [state.season, state.transition, 'Evergreen', 'Todo'];
}