class Builder_ApplicationStateFromSpreadsheet {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet;
  }

  build() {
    state = {
      spreadsheet: this.spreadsheet,
      users: [],
      sheets: [],
      valuesSheet: null,
      builders: {
        eventsFromSpreadsheet: new Builder_EventsFromSpreadsheet(),
        eventsFromUserCalendars: new Builder_EventsFromUserCalendars(),
        usersFromSpreadsheet: new Builder_UsersFromSpreadsheet()
      },
      buildList: [],
      features: {
        replicateSheetInExternalSpreadsheet: new Feature_ReplicateSheetInExternalSpreadsheet(),
        updateCalendarFromSpreadsheet: new Feature_UpdateCalendarFromSpreadsheet(),
        updateSpreadsheetFromCalendar: new Feature_UpdateSpreadsheetFromCalendar()
      },
      executionList: [],
      texts: {
        errorLabel: 'Custom script failed: ',
        workDateLabel: 'Work date'
      },
      today: getTodaysDate(),
      execution: { lock: null, timeout: 60000 },
      userProperties: PropertiesService.getUserProperties(),
      log: '',
    };
  }

  buildForUI() {
    state.menu = new Menu();
  }
}