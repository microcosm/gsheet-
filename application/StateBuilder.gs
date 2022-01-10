var state = { log: '' };

class StateBuilder {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet;
    this.buildInitialState();
  }

  buildInitialState() {
    this.appendState({
      spreadsheet: this.spreadsheet,
      users: [],
      sheets: [],
      valuesSheet: null,
      features: {
        classes: {
          replicateSheetInExternalSpreadsheet: ReplicateSheetInExternalSpreadsheet,
          updateCalendarFromSpreadsheet: UpdateCalendarFromSpreadsheet,
          updateSheetHiddenValue: UpdateSheetHiddenValue,
          updateSpreadsheetFromCalendar: UpdateSpreadsheetFromCalendar,
        },
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
    return this;
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
    const activeSheetName = state.spreadsheet.getActiveSheet().getName();
    return state.sheets.find(sheet => sheet.name === activeSheetName) || new Sheet({ name: activeSheetName });
  }

  appendState(moreState) {
    state = Object.assign(state, moreState);
  }

  appendFeatures(features) {
    state.features.registered = state.features.registered.concat(features);
  }
}