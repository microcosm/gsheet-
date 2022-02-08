class CalendarEventsToSheet extends Feature {
  constructor(sheet) {
    super(sheet, 'Calendar Events To Sheet');
    this.addResponseCapability(Event.onCalendarEdit);
    this.addResponseCapability(Event.onSpreadsheetEdit);
  }

  execute() {
    super.execute();
    this.buildCalendarEvents(this.config.fromDate, this.config.eventsToNumYearsFromNow);
    this.updateSheet(this.sheet);
  }

  getCalendar() {
    const calendarId = state.valuesSheet.getValueOf(state.valuesSheet.config.eventsCalendarIdRowIndex, state.valuesSheet.config.eventsCalendarIdColumnIndex);
    logStringVerbose('Opening google calendar ' + calendarId);
    return CalendarApp.getCalendarById(calendarId);
  }

  buildCalendarEvents(fromDateStr, numYearsAhead) {
    const fromDate = new Date(fromDateStr);
    const toDate = getNYearsFromTodaysDate(numYearsAhead);
    const events = this.getCalendar().getEvents(fromDate, toDate);
    this.calendarEvents = [];
    events.forEach((event) => {
      this.calendarEvents.push({
        title: event.getTitle(),
        startDateTime: event.getStartTime(),
        endDateTime: event.getEndTime(),
        isAllDay: event.isAllDayEvent()
      });
    });
    logStringVerbose('Got ' + this.calendarEvents.length + ' events from calendar between [' + fromDate + '] and [' + toDate + ']');
  }

  updateSheet(sheet) {
    this.setupSheetState(sheet);
    for(var i = 0; i < this.dateValuesForReference.length; i++) {
      var weekCommenceDate = this.dateValuesForReference[i][0];
      if(isDate(weekCommenceDate)) {
        weekCommenceDate = setToMidnight(weekCommenceDate);
        const calendarEventsThisWeek = this.findCalendarEventsThisWeek(weekCommenceDate);
        this.eventValuesForUpdate[i][0] = this.formatCalendarEventsForCell(calendarEventsThisWeek);
      }
    }
    this.eventRangeForUpdate.setValues(this.eventValuesForUpdate);
  }

  setupSheetState(sheet) {
    const beginRow = this.config.beginRow.cardinalIndex;
    const filterRow = this.config.filterRow.cardinalIndex;
    const dateColumn = this.config.dateColumn.cardinalIndex;
    const eventColumn = this.config.eventColumn.cardinalIndex;
    const numRows = sheet.sheetRef.getMaxRows() - beginRow;
    this.eventRangeForUpdate = sheet.sheetRef.getRange(beginRow, eventColumn, numRows, 1);
    this.eventValuesForUpdate = this.eventRangeForUpdate.getValues();
    this.dateValuesForReference = sheet.sheetRef.getRange(beginRow, dateColumn, numRows, 1).getValues();
    this.eventFiltersForReference = sheet.sheetRef.getRange(filterRow, eventColumn, 1, 1).getValue().split('\n');
  }

  findCalendarEventsThisWeek(weekCommenceDate) {
    var result = [];
    this.calendarEvents.forEach((calendarEvent) => {
      if(this.isValidCalendarEventForWeek(calendarEvent, weekCommenceDate)) {
        result.push(calendarEvent);
      }
    });
    return result;
  }

  isValidCalendarEventForWeek(calendarEvent, weekCommenceDate) {
    const weekConcludeDate = weekCommenceDate.addDays(7);
    return calendarEvent.startDateTime >= weekCommenceDate &&
           calendarEvent.startDateTime < weekConcludeDate &&
           !this.eventFiltersForReference.includes(calendarEvent.title);
  }

  formatCalendarEventsForCell(calendarEventsForCell) {
    if(calendarEventsForCell.length === 0) {
      return '';
    }
    var resultStr = '';
    calendarEventsForCell.forEach((calendarEvent) => {
      resultStr += this.buildCalendarEventCellLine(calendarEvent)
    });
    return resultStr.trim('\n');
  }

  buildCalendarEventCellLine(calendarEvent) {
    const dayNumberStart = calendarEvent.startDateTime.getDate();
    const dayNumberEnd = this.getDateMinusFewSeconds(calendarEvent.endDateTime).getDate();
    const unsureDate = calendarEvent.title.endsWith('?');
    const prefix = unsureDate ? '[?] ' : '';

    return prefix +
           calendarEvent.startDateTime.getDayStr() + ' ' +
           dayNumberStart +
           (dayNumberStart === dayNumberEnd ? '' : '-' + dayNumberEnd) + ': ' +
           (dayNumberStart <= 9 && dayNumberStart === dayNumberEnd && !unsureDate ? ' ' : '') +
           calendarEvent.title + '\n';
  }

  getDateMinusFewSeconds(givenDate) {
    return new Date(givenDate - 5000);
  }
}