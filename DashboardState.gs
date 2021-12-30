var state;

class DashboardState {
  constructor(spreadsheet) {
    state = {
      spreadsheet: spreadsheet,
      people: [],
      scriptSheets: [],
      features: {
        updateCalendarFromSpreadsheet: new Feature_UpdateCalendarFromSpreadsheet()
      },
      texts: {
        errorLabel: 'Custom script failed: ',
        workDateLabel: 'Work date'
      },
      valuesSheet: null,
      googleCalendar: new GoogleCalendar(),
      today: this.getTodaysDate(),
      execution: { lock: null, timeout: 60000 },
      log: '',
    };
  }

  assemble() {
    preProcessSheets();
    this.assemblePeopleStates();
    this.assemblePeopleCalendarStates();
    this.assemblePeopleSpreadsheetStates();
  }

  assemblePeopleStates() {
    const values = state.valuesSheet.sheetRef.getRange(state.valuesSheet.scriptRange.start + ':' + state.valuesSheet.scriptRange.end).getValues();
    for(var i = 0; i < values.length; i += state.valuesSheet.numValuesPerPerson) {
      if(values[i][0] && values[i + 1][0]){
        state.people.push({
          name: values[i][0],
          calendar: CalendarApp.getCalendarById(values[i + 1][0]),
          inviteEmail: values.length >= i + state.valuesSheet.numValuesPerPerson ? values[i + 2][0] : '',
          calendarEvents: null,
          spreadsheetEvents: null
        });
      }
    }
  }

  assemblePeopleCalendarStates() {
    state.people.forEach((person) => {
      person.calendarEvents = state.googleCalendar.getEvents(person.calendar);
    });
  }

  assemblePeopleSpreadsheetStates() {
    state.people.forEach((person) => {
      var extractionState = {
        currentWidget: '',
        events: [],
        person: person,
        exclusionListNames: this.getOtherPeopleNames(person),
        fillInTheBlanksDate: state.today
      }

      state.scriptSheets.forEach((sheet) => {
        for(var widgetName in sheet.widgets) {
          var widget = sheet.widgets[widgetName];
          if(widget.hasEvents) {
            sheet.extractEvents(sheet, widget, extractionState);
          }
        }
      });

      person.spreadsheetEvents = extractionState.events;
    });
  }

  getOtherPeopleNames(person) {
    var otherPeopleNames = [];
    state.people.forEach((possibleOther) => {
      if(possibleOther.name != person.name) {
        otherPeopleNames.push(possibleOther.name);
      }
    });
    return otherPeopleNames;
  }

  getTodaysDate() {
    var date = new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }
}