class GoogleSheet {
  constructor(spreadsheet, name, id, scriptRange) {
    this.spreadsheet = spreadsheet;
    this.scriptRange = scriptRange;
    this.name = name;
    this.id = id;
    this.sheetRef = this.spreadsheet.getSheetByName(this.name);
    this.validate();
  }

  validate() {
    if(this.sheetRef == null) {
      throw 'Cannot establish access to sheet "' + this.name + '" - check config values.';
    }
  }
}

class ValuesSheet extends GoogleSheet {
  constructor(spreadsheet, name, scriptRange) {
    super(spreadsheet, name, false, scriptRange);
    this.numValuesPerPerson = 3;
  }
}

class ScriptSheet extends GoogleSheet {
  constructor(spreadsheet, name, id, scriptRange, widgets, triggerCols) {
    super(spreadsheet, name, id, scriptRange);
    this.widgets = widgets;
    this.triggerCols = triggerCols;
    this.hasSeasonCell = false;
    this.seasonCol = null;
    this.seasonRow = null;
    this.generateScriptRangeColumns();
    this.generateScriptRangeValues();
  }

  generateScriptRangeColumns() {
    for(var widgetName in this.widgets) {
      var widget = this.widgets[widgetName];
      for(var columnName in widget.columns) {
        widget.scriptRangeColumns[columnName] = widget.columns[columnName] - this.scriptRange.offsets.col;
      }
    }
  }

  generateScriptRangeValues() {
    this.scriptRangeValues = this.sheetRef.getRange (
        this.scriptRange.offsets.row, this.scriptRange.offsets.col,
        this.scriptRange.maxRows, this.scriptRange.maxCols
      ).getValues();
  }

  getScriptRangeValues() {
    return this.scriptRangeValues;
  }

  getSeasonStr() {
    return this.scriptRangeValues[this.seasonRow - this.scriptRange.offsets.row][this.seasonCol - this.scriptRange.offsets.col];
  }

  setSeasonCell(col, row) {
    this.hasSeasonCell = true;
    this.seasonCol = col;
    this.seasonRow = row;
  }
}

class EventSheet extends ScriptSheet {
  extractCalendarEvents(sheet, widget, extractionState) {
    const scriptRangeValues = sheet.getScriptRangeValues();

    for(var i = 0; i < scriptRangeValues.length; i++) {
      const row = scriptRangeValues[i];

      if(this.isWorkDateLabel(row[widget.scriptRangeColumns.workDate])) {
        extractionState.currentWidget = scriptRangeValues[i - 1][widget.scriptRangeColumns.label];
      } else if(this.isValidCalendarEvent(row, widget, extractionState)) {
        var eventFromSpreadsheet = this.buildEventFromSheet(sheet, widget, extractionState, row);
        extractionState.calendarEvents.push(eventFromSpreadsheet);
      }
    }
  }

  isValidCalendarEvent(row, widget, extractionState) {
    return state.scriptResponsiveWidgets.includes(extractionState.currentWidget) &&
           !this.getIsDoneOrWaiting(widget, row) &&
           (typeof row[widget.scriptRangeColumns.noun] == 'string' && row[widget.scriptRangeColumns.noun].length > 0) &&
           (typeof row[widget.scriptRangeColumns.verb] == 'string' && row[widget.scriptRangeColumns.verb].length > 0) &&
           (widget.allowFillInTheBlanksDates || row[widget.scriptRangeColumns.workDate] instanceof Date) &&
           !extractionState.exclusionListNames.includes(row[widget.scriptRangeColumns.name]) &&
           isSpecificValidCalendarEvent(row, widget)
  }

  buildEventFromSheet(sheet, widget, extractionState, row) {
    var startDateTime, endDateTime, isAllDay;

    if(this.isFillInTheBlanks(row, widget)) {
      isAllDay = true;
      startDateTime = new Date(extractionState.fillInTheBlanksDate);
      endDateTime = null;
    } else {
      const startTime = row[widget.scriptRangeColumns.startTime];
      const startTimeHours = this.getStartTimeHours(startTime);
      const startTimeMinutes = this.getStartTimeMinutes(startTime);
      const durationHours = row[widget.scriptRangeColumns.durationHours];
      isAllDay = this.getIsAllDay(startTimeHours, startTimeMinutes, durationHours);
      startDateTime = new Date(row[widget.scriptRangeColumns.workDate]);
      startDateTime = this.getPulledForward(startDateTime);

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
        description: this.generateDescription(sheet, widget, extractionState, row),
        location: extractionState.currentWidget,
        guests: extractionState.person.inviteEmail
      },
      isAlreadyInCalendar: false
    };
  }

  getIsAllDay(startTimeHours, startTimeMinutes, durationHours) {
    return !(
      isValidNumber(startTimeHours) && startTimeHours >= 0 && startTimeHours <= 23 &&
      isValidNumber(startTimeMinutes) && startTimeMinutes >= 0 && startTimeMinutes <= 59 &&
      isValidNumber(durationHours) && durationHours > 0);
  }

  getStartTimeHours(startTime) {
    return isValidTimeString(startTime) ? startTime.split(':')[0] : false;
  }

  getStartTimeMinutes(startTime) {
    return isValidTimeString(startTime) ? startTime.split(':')[1] : false;
  }

  isFillInTheBlanks(row, widget) {
    return widget.allowFillInTheBlanksDates && (!(row[widget.scriptRangeColumns.workDate] instanceof Date));
  }

  getPulledForward(dateTime) {
    if(dateTime < state.today) {
      var pulledForwardDate = new Date(dateTime);
      pulledForwardDate.setFullYear(state.today.getFullYear());
      pulledForwardDate.setMonth(state.today.getMonth());
      pulledForwardDate.setDate(state.today.getDate());
      return pulledForwardDate;
    }
    return dateTime;
  }

  getIsDoneOrWaiting(widget, row) {
    if(widget.hasDoneCol) {
      return row[widget.scriptRangeColumns.done] === 'Yes' || row[widget.scriptRangeColumns.done] === 'Waiting';
    }
    return false;
  }

  isWorkDateLabel(str) {
    return typeof str == 'string' && str.substring(0, state.workDateLabelText.length) === state.workDateLabelText;
  }

  generateDescription(sheet, widget, extractionState, row) {
    const name = getNameSubstitution(row[widget.scriptRangeColumns.name]);

    return 'This event is from the "' + extractionState.currentWidget +
      '" widget' + (name ? ' for ' + name : '') +
      '.\n\nCreated by <a href="https://docs.google.com/spreadsheets/d/' + config.gsheet.id +
      '/edit?usp=sharing' +
      (sheet.hasOwnProperty('id') ? '#gid=' + sheet.id : '') +
      '">' + config.gsheet.name + '</a>&nbsp;&larr; Click here for more';
  }
}