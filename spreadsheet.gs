function getSpreadsheetEvents(person) {
  var extractionState = {
    currentEventCategory: '',
    events: [],
    person: person,
    exclusionListNames: getOtherPeopleNames(person),
    fillInTheBlanksDate: state.today
  }

  state.eventSheets.forEach(function(sheet) {
    for(var sectionName in sheet.sections) {
      var section = sheet.sections[sectionName];
      if(section.hasEvents) {
        extractEvents(sheet, section, extractionState);
      }
    }
  });

  return extractionState.events;
}

function extractEvents(sheet, section, extractionState) {
  const rangeValues = state.rangeValues[sheet.name];

  for(var i = 0; i < rangeValues.length; i++) {
    const row = rangeValues[i];

    if(isWorkDateLabel(row[section.rangeColumns.workDate])) {
      extractionState.currentEventCategory = rangeValues[i - 1][section.rangeColumns.label];
    } else if(isValidEventData(row, section, extractionState)) {
      var eventFromSpreadsheet = buildEventFromSheet(sheet, section, extractionState, row);
      extractionState.events.push(eventFromSpreadsheet);
    }
  }
}

function isValidEventData(row, section, extractionState) {
  return state.validEventCategories.includes(extractionState.currentEventCategory) &&
         !getIsDoneOrWaiting(section, row) &&
         (typeof row[section.rangeColumns.noun] == 'string' && row[section.rangeColumns.noun].length > 0) &&
         (typeof row[section.rangeColumns.verb] == 'string' && row[section.rangeColumns.verb].length > 0) &&
         (section.allowFillInTheBlanksDates || row[section.rangeColumns.workDate] instanceof Date) &&
         !extractionState.exclusionListNames.includes(row[section.rangeColumns.name]) &&
         isSpecificValidEventData(row, section)
}

function buildEventFromSheet(sheet, section, extractionState, row) {
  var startDateTime, endDateTime, isAllDay;

  if(isFillInTheBlanks(row, section)) {
    isAllDay = true;
    startDateTime = new Date(extractionState.fillInTheBlanksDate);
    endDateTime = null;
  } else {
    const startTime = row[section.rangeColumns.startTime];
    const startTimeHours = getStartTimeHours(startTime);
    const startTimeMinutes = getStartTimeMinutes(startTime);
    const durationHours = row[section.rangeColumns.durationHours];
    isAllDay = getIsAllDay(startTimeHours, startTimeMinutes, durationHours);
    startDateTime = new Date(row[section.rangeColumns.workDate]);
    startDateTime = getPulledForward(startDateTime);

    if(isAllDay) {
      endDateTime = null;
    } else {
      startDateTime.setHours(startTimeHours);
      startDateTime.setMinutes(startTimeMinutes);
      startDateTime.setSeconds(0);
      startDateTime.setMilliseconds(0);
      endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + durationHours);
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
    options: {
      description: generateDescription(sheet, section, extractionState, row),
      location: extractionState.currentEventCategory,
      guests: extractionState.person.inviteEmail
    },
    isAlreadyInCalendar: false
  };
}

function getIsAllDay(startTimeHours, startTimeMinutes, durationHours) {
  return !(
    isValidNumber(startTimeHours) && startTimeHours >= 0 && startTimeHours <= 23 &&
    isValidNumber(startTimeMinutes) && startTimeMinutes >= 0 && startTimeMinutes <= 59 &&
    isValidNumber(durationHours) && durationHours > 0);
}

function getStartTimeHours(startTime) {
  return isValidTimeString(startTime) ? startTime.split(':')[0] : false;
}

function getStartTimeMinutes(startTime) {
  return isValidTimeString(startTime) ? startTime.split(':')[1] : false;
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

function getIsDoneOrWaiting(section, row) {
  if(section.hasDoneCol) {
    return row[section.rangeColumns.done] === 'Yes' || row[section.rangeColumns.done] === 'Waiting';
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

function generateDescription(sheet, section, extractionState, row) {
  const name = getNameSubstitution(row[section.rangeColumns.name]);

  return 'This event is from the "' + extractionState.currentEventCategory +
    '" section' + (name ? ' for ' + name : '') +
    '.\n\nCreated by <a href="https://docs.google.com/spreadsheets/d/' + config.gsheet.id +
    '/edit?usp=sharing' +
    (sheet.hasOwnProperty('id') ? '#gid=' + sheet.id : '') +
    '">' + config.gsheet.name + '</a>&nbsp;&larr; Click here for more';
}