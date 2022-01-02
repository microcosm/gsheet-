class Builder_PeopleFromSpreadsheetValues {
  build() {
    const peopleColumnIndex = state.valuesSheet.config.columns.people;
    const values = state.valuesSheet.getValuesOf(peopleColumnIndex);

    const numValuesPerPerson = 3;

    for(var i = 0; i < values.length; i += numValuesPerPerson) {
      if(values[i] && values[i + 1]){
        state.people.push({
          name: values[i],
          calendar: CalendarApp.getCalendarById(values[i + 1]),
          inviteEmail: values.length >= i + numValuesPerPerson ? values[i + 2] : '',
          calendarEvents: null,
          spreadsheetEvents: null
        });
      }
    }
  }
}