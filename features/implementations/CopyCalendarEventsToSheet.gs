class CopyCalendarEventsToSheet extends Feature {
  constructor(sheet) {
    super(sheet, 'Copy Calendar Events To Sheet');
    this.addResponseCapability(Event.onCalendarEdit);
    this.addResponseCapability(Event.onSheetEdit);
  }

  execute() {
    super.execute();
    this.customValidator = this.config.isValidEvent || ((e) => { return true; });
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
    events.forEach(event => {
      if(this.customValidator(event)) {
        this.calendarEvents.push(this.getCalendarEvent(event));
      }
    });
    logStringVerbose('Got ' + this.calendarEvents.length + ' events from calendar between [' + fromDate + '] and [' + toDate + ']');
  }

  getCalendarEvent(event) {
    let calendarEvent = this.createNewCalendarEvent(event.getTitle());
    calendarEvent.startDateTime = event.getStartTime();
    calendarEvent.endDateTime = event.getEndTime();
    calendarEvent.isAllDay = event.isAllDayEvent();
    calendarEvent.isRecurringEvent = event.isRecurringEvent();
    return calendarEvent;
  }

  createNewCalendarEvent(title) {
    return {
      title: title,
      startDateTime: null,
      endDateTime: null,
      isAllDay: true,
      isRecurringEvent: false
    };
  }

  updateSheet(sheet) {
    this.setupSheetState(sheet);
    if(isFunction(this.config.customSetupSheetState)) this.config.customSetupSheetState(sheet, this);

    for(var i = 0; i < this.dateValuesForReference.length; i++) {
      var weekCommenceDate = this.dateValuesForReference[i][0];
      if(isDate(weekCommenceDate)) {
        this.calendarEventsThisWeek = this.findCalendarEventsThisWeek(setToMidnight(weekCommenceDate));
        this.calendarEventsThisWeekFiltered = this.filterCalendarEvents(this.calendarEventsThisWeek);
        this.eventValuesForUpdate[i][0] = this.formatCalendarEventsForCell(this.calendarEventsThisWeekFiltered);
        if(isFunction(this.config.customProcessWeek)) this.config.customProcessWeek(i, this);
      }
    }

    this.eventRangeForUpdate.setValues(this.eventValuesForUpdate);
    if(isFunction(this.config.customUpdateSheet)) this.config.customUpdateSheet();
  }

  setupSheetState(sheet) {
    this.beginRow = this.config.beginRow.cardinalIndex;
    this.numRows = sheet.sheetRef.getMaxRows() - this.beginRow;
    const filterRow = this.config.filterRow.cardinalIndex;
    const dateColumn = this.config.dateColumn.cardinalIndex;
    const eventColumn = this.config.eventColumn.cardinalIndex;
    this.eventRangeForUpdate = sheet.sheetRef.getRange(this.beginRow, eventColumn, this.numRows, 1);
    this.eventValuesForUpdate = this.eventRangeForUpdate.getValues();
    this.dateValuesForReference = sheet.sheetRef.getRange(this.beginRow, dateColumn, this.numRows, 1).getValues();
    this.eventFiltersForReference = sheet.sheetRef.getRange(filterRow, eventColumn, 1, 1).getValue().split('\n').map(str => { return str.toLowerCase(); });
  }

  findCalendarEventsThisWeek(weekCommenceDate) {
    var result = [];
    this.calendarEvents.forEach(calendarEvent => {
      if(this.isValidCalendarEventForWeek(calendarEvent, weekCommenceDate)) {
        result.push(calendarEvent);
      }
    });
    return result;
  }

  filterCalendarEvents(calendarEvents) {
    return calendarEvents.filter(
      calendarEvent => this.eventFiltersForReference.find(
        filter => calendarEvent.title.toLowerCase().includes(filter)
      ) === undefined
    );
  }

  isValidCalendarEventForWeek(calendarEvent, weekCommenceDate) {
    const weekConcludeDate = weekCommenceDate.addDays(7);
    const title = calendarEvent.title.toLowerCase();
    return calendarEvent.startDateTime >= weekCommenceDate &&
           calendarEvent.startDateTime < weekConcludeDate;
  }

  formatCalendarEventsForCell(calendarEventsThisWeek) {
    const calendarEventsForCell = this.flattenRecurringEvents(calendarEventsThisWeek);
    if(calendarEventsForCell.length === 0) {
      return '';
    }
    var resultStr = '';
    calendarEventsForCell.forEach(calendarEvent => {
      resultStr += this.buildCalendarEventCellLine(calendarEvent);
    });
    return resultStr.trim('\n');
  }

  flattenRecurringEvents(calendarEventsThisWeek) {
    let recurringEventsThisWeek = this.findRecurringEventsThisWeek(calendarEventsThisWeek);
    calendarEventsThisWeek = calendarEventsThisWeek.filter(calendarEvent => !calendarEvent.isRecurringEvent);
    for(const eventTitle in recurringEventsThisWeek) {
      calendarEventsThisWeek.push(recurringEventsThisWeek[eventTitle]);
    }
    calendarEventsThisWeek.sort((a, b) => { return a.startDateTime - b.startDateTime });
    return calendarEventsThisWeek;
  }

  findRecurringEventsThisWeek(calendarEventsThisWeek) {
    let recurringEventsThisWeek = {};
    calendarEventsThisWeek.forEach(calendarEvent => {
      if(calendarEvent.isRecurringEvent) {
        let recurringEvent = createPropertyIfDoesntExist(recurringEventsThisWeek, calendarEvent.title, this.createNewCalendarEvent);

        if(recurringEvent.startDateTime === null || recurringEvent.startDateTime > calendarEvent.startDateTime) {
          recurringEvent.startDateTime = calendarEvent.startDateTime;
        }
        if(recurringEvent.endDateTime === null || recurringEvent.endDateTime < calendarEvent.endDateTime) {
          recurringEvent.endDateTime = calendarEvent.endDateTime;
        }
      }
    });
    return recurringEventsThisWeek;
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