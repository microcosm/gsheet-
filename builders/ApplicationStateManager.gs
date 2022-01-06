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
      ui: new UserInterface(),
      defaultAlertMessage: 'This menu option can\'t be used on this sheet'
    });
    return this;
  }

  appendState(moreState) {
    state = Object.assign(state, moreState);
  }
}