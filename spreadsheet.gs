function getSpreadsheetEvents(person) {
  var extractionState = {
    currentEventCategory: '',
    events: [],
    person: person,
    exclusionListNames: getOtherPeopleNames(person),
    fillInTheBlanksDate: state.today
  }

  state.scriptSheets.forEach(function(sheet) {
    for(var widgetName in sheet.widgets) {
      var widget = sheet.widgets[widgetName];
      if(widget.hasEvents) {
        extractEvents(sheet, widget, extractionState);
      }
    }
  });

  return extractionState.events;
}

function extractEvents(sheet, widget, extractionState) {
  const scriptRangeValues = sheet.getScriptRangeValues();

  for(var i = 0; i < scriptRangeValues.length; i++) {
    const row = scriptRangeValues[i];

    if(isWorkDateLabel(row[widget.scriptRangeColumns.workDate])) {
      extractionState.currentEventCategory = scriptRangeValues[i - 1][widget.scriptRangeColumns.label];
    } else if(isValidEventData(row, widget, extractionState)) {
      var eventFromSpreadsheet = buildEventFromSheet(sheet, widget, extractionState, row);
      extractionState.events.push(eventFromSpreadsheet);
    }
  }
}

function isValidEventData(row, widget, extractionState) {
  return state.validEventCategories.includes(extractionState.currentEventCategory) &&
         !getIsDoneOrWaiting(widget, row) &&
         (typeof row[widget.scriptRangeColumns.noun] == 'string' && row[widget.scriptRangeColumns.noun].length > 0) &&
         (typeof row[widget.scriptRangeColumns.verb] == 'string' && row[widget.scriptRangeColumns.verb].length > 0) &&
         (widget.allowFillInTheBlanksDates || row[widget.scriptRangeColumns.workDate] instanceof Date) &&
         !extractionState.exclusionListNames.includes(row[widget.scriptRangeColumns.name]) &&
         isSpecificValidEventData(row, widget)
}

function buildEventFromSheet(sheet, widget, extractionState, row) {
  var startDateTime, endDateTime, isAllDay;

  if(isFillInTheBlanks(row, widget)) {
    isAllDay = true;
    startDateTime = new Date(extractionState.fillInTheBlanksDate);
    endDateTime = null;
  } else {
    const startTime = row[widget.scriptRangeColumns.startTime];
    const startTimeHours = getStartTimeHours(startTime);
    const startTimeMinutes = getStartTimeMinutes(startTime);
    const durationHours = row[widget.scriptRangeColumns.durationHours];
    isAllDay = getIsAllDay(startTimeHours, startTimeMinutes, durationHours);
    startDateTime = new Date(row[widget.scriptRangeColumns.workDate]);
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
    title: row[widget.scriptRangeColumns.noun] + ': ' + row[widget.scriptRangeColumns.verb],
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    isAllDay: isAllDay,
    options: {
      description: generateDescription(sheet, widget, extractionState, row),
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

function isFillInTheBlanks(row, widget) {
  return widget.allowFillInTheBlanksDates && (!(row[widget.scriptRangeColumns.workDate] instanceof Date));
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

function getIsDoneOrWaiting(widget, row) {
  if(widget.hasDoneCol) {
    return row[widget.scriptRangeColumns.done] === 'Yes' || row[widget.scriptRangeColumns.done] === 'Waiting';
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

function generateDescription(sheet, widget, extractionState, row) {
  const name = getNameSubstitution(row[widget.scriptRangeColumns.name]);

  return 'This event is from the "' + extractionState.currentEventCategory +
    '" widget' + (name ? ' for ' + name : '') +
    '.\n\nCreated by <a href="https://docs.google.com/spreadsheets/d/' + config.gsheet.id +
    '/edit?usp=sharing' +
    (sheet.hasOwnProperty('id') ? '#gid=' + sheet.id : '') +
    '">' + config.gsheet.name + '</a>&nbsp;&larr; Click here for more';
}