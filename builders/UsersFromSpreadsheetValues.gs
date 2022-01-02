class Builder_UsersFromSpreadsheetValues {
  build() {
    const usersColumnIndex = state.valuesSheet.config.columns.users;
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
  }
}