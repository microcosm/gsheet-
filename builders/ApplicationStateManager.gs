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
        usersFromSpreadsheet: new Builder_UsersFromSpreadsheet()
      },
      buildList: [],
      features: {
        registered: [],
        executions: []
      },
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
    state.buildList.forEach((builder) => { builder.build() });
    return this;
  }

  buildUserInterfaceState() {
    this.appendState({
      ui: new UserInterface(),
      defaultAlertMessage: 'This menu option can\'t be used on this sheet'
    });
    return this;
  }

  appendState(moreState) {
    state = Object.assign(state, moreState);
  }
}