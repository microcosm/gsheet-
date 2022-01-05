var state;

class ApplicationStateManager {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet;
    state = {};
    this.buildInitialState();
  }

  buildInitialState() {
    this.appendState({
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
      log: ''
    });
    return this;
  }

  buildSheetState() {
    buildSheets();
    return this;
  }

  buildFeatureState() {
    state.buildList.push(state.builders.usersFromSpreadsheet);
    state.buildList.push(state.builders.eventsFromUserCalendars);
    state.buildList.push(state.builders.eventsFromSpreadsheet);
    state.buildList.forEach((builder) => { builder.build() });
    return this;
  }

  buildUserInterfaceState() {
    this.appendState({
      menu: new Menu()
    });
    return this;
  }

  appendState(moreState) {
    state = Object.assign(state, moreState);
  }
}