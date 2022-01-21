//Pre-instantiation state properties which must be available as early as possible during execution 
var state = {
  log: '',
  toggles: {
    performDataUpdates: true,
    verboseLogging: false,
    showLogAlert: false
  }
};

class StateBuilder {
  constructor(spreadsheetSource) {
    this.buildInitialState();
    this.buildSpreadsheetState(spreadsheetSource);
  }

  buildInitialState() {
    this.appendState({
      users: [],
      sheets: [],
      valuesSheet: null,
      features: {
        classes: featureClasses,
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
      builder: this,
    });
  }

  buildSpreadsheetState(spreadsheetSource) {
    const config = getSpreadsheetConfig();
    this.appendState({
      spreadsheet: {
        id: config.id,
        name: config.name,
        ref: SpreadsheetSource.getActive ? SpreadsheetApp.getActiveSpreadsheet() : SpreadsheetApp.openById(config.id)
      }
    });
  }

  buildSheetState() {
    buildSheets();
    this.appendState({
      activeSheet: this.getActiveSheet()
    });
    return this;
  }

  buildUsersState() {
    const usersColumnIndex = state.valuesSheet.config.usersColumnIndex;
    const values = state.valuesSheet.getValuesOf(usersColumnIndex);

    const numValuesPerUser = 3;

    for(var i = 0; i < values.length; i += numValuesPerUser) {
      if(values[i] && values[i + 1]){
        state.users.push({
          name: values[i],
          calendar: CalendarApp.getCalendarById(values[i + 1]),
          inviteEmail: values.length >= i + numValuesPerUser ? values[i + 2] : '',
          calendarEvents: null,
          spreadsheetEvents: null
        });
      }
    }
    return this;
  }

  buildUserInterfaceState() {
    this.appendState({
      ui: new UserInterface()
    });
    return this;
  }

  getActiveSheet() {
    const activeSheetName = state.spreadsheet.ref.getActiveSheet().getName();
    return state.sheets.find(sheet => sheet.name === activeSheetName) || new Sheet({ name: activeSheetName });
  }

  appendState(moreState) {
    state = Object.assign(state, moreState);
  }

  appendFeatures(features) {
    state.features.registered = state.features.registered.concat(features);
  }

  prepareForExecution() {
    state.features.executions.sort((a, b) => {
      return a.getPriority() > b.getPriority() ? 1 : -1;
    });
  }
}