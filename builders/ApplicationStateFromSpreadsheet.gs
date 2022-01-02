class Builder_ApplicationStateFromSpreadsheet {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet;
  }

  build() {
    state = {
      spreadsheet: this.spreadsheet,
      people: [],
      scriptSheets: [],
      builders: {
        peopleFromSpreadsheetValues: new Builder_PeopleFromSpreadsheetValues(),
        eventsFromPersonCalendar: new Builder_EventsFromPersonCalendar(),
        eventsFromSpreadsheet: new Builder_EventsFromSpreadsheet()
      },
      buildList: [],
      features: {
        updateCalendarFromSpreadsheet: new Feature_UpdateCalendarFromSpreadsheet()
      },
      executionList: [],
      texts: {
        errorLabel: 'Custom script failed: ',
        workDateLabel: 'Work date'
      },
      valuesSheet: null,
      today: getTodaysDate(),
      execution: { lock: null, timeout: 60000 },
      log: '',
    };
  }
}