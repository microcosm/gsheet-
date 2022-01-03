class Builder_ApplicationStateFromSpreadsheet {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet;
  }

  build() {
    state = {
      spreadsheet: this.spreadsheet,
      users: [],
      featureSheets: [],
      valuesSheet: null,
      builders: {
        usersFromSpreadsheetValues: new Builder_UsersFromSpreadsheetValues(),
        eventsFromUserCalendar: new Builder_EventsFromUserCalendar(),
        eventsFromSpreadsheet: new Builder_EventsFromSpreadsheet()
      },
      buildList: [],
      features: {
        updateCalendarFromSpreadsheet: new Feature_UpdateCalendarFromSpreadsheet(),
        replicateSheetInExternalSpreadsheet: new Feature_ReplicateSheetInExternalSpreadsheet()
      },
      executionList: [],
      texts: {
        errorLabel: 'Custom script failed: ',
        workDateLabel: 'Work date'
      },
      today: getTodaysDate(),
      execution: { lock: null, timeout: 60000 },
      log: '',
    };
  }
}