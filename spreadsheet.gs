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
  const rangeValues = sheet.getRangeValues();

  for(var i = 0; i < rangeValues.length; i++) {
    const row = rangeValues[i];

    if(isWorkDateLabel(row[widget.rangeColumns.workDate])) {
      extractionState.currentEventCategory = rangeValues[i - 1][widget.rangeColumns.label];
    } else if(isValidEventData(row, widget, extractionState)) {
      var eventFromSpreadsheet = buildEventFromSheet(sheet, widget, extractionState, row);
      extractionState.events.push(eventFromSpreadsheet);
    }
  }
}

function isValidEventData(row, widget, extractionState) {
  return state.validEventCategories.includes(extractionState.currentEventCategory) &&
         !getIsDoneOrWaiting(widget, row) &&
         (typeof row[widget.rangeColumns.noun] == 'string' && row[widget.rangeColumns.noun].length > 0) &&
         (typeof row[widget.rangeColumns.verb] == 'string' && row[widget.rangeColumns.verb].length > 0) &&
         (widget.allowFillInTheBlanksDates || row[widget.rangeColumns.workDate] instanceof Date) &&
         !extractionState.exclusionListNames.includes(row[widget.rangeColumns.name]) &&
         isSpecificValidEventData(row, widget)
}

function buildEventFromSheet(sheet, widget, extractionState, row) {
  var startDateTime, endDateTime, isAllDay;

  if(isFillInTheBlanks(row, widget)) {
    isAllDay = true;
    startDateTime = new Date(extractionState.fillInTheBlanksDate);
    endDateTime = null;
  } else {
    const startTime = row[widget.rangeColumns.startTime];
    const startTimeHours = getStartTimeHours(startTime);
    const startTimeMinutes = getStartTimeMinutes(startTime);
    const durationHours = row[widget.rangeColumns.durationHours];
    isAllDay = getIsAllDay(startTimeHours, startTimeMinutes, durationHours);
    startDateTime = new Date(row[widget.rangeColumns.workDate]);
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
    title: row[widget.rangeColumns.noun] + ': ' + row[widget.rangeColumns.verb],
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
  return widget.allowFillInTheBlanksDates && (!(row[widget.rangeColumns.workDate] instanceof Date));
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
    return row[widget.rangeColumns.done] === 'Yes' || row[widget.rangeColumns.done] === 'Waiting';
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
  const name = getNameSubstitution(row[widget.rangeColumns.name]);

  return 'This event is from the "' + extractionState.currentEventCategory +
    '" widget' + (name ? ' for ' + name : '') +
    '.\n\nCreated by <a href="https://docs.google.com/spreadsheets/d/' + config.gsheet.id +
    '/edit?usp=sharing' +
    (sheet.hasOwnProperty('id') ? '#gid=' + sheet.id : '') +
    '">' + config.gsheet.name + '</a>&nbsp;&larr; Click here for more';
}