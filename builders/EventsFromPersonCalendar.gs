class Builder_EventsFromPersonCalendar {
  build() {
    state.people.forEach((person) => {
      person.calendarEvents = this.getCalendarEventsForPerson(person);
    });
  }

  getCalendarEventsForPerson(person, fromDate=new Date('January 1, 2000'), toDate=new Date('January 1, 3000')) {
    const googleCalendarEvents = person.calendar.getEvents(fromDate, toDate);
    var calendarEvents = [];
    googleCalendarEvents.forEach((googleCalendarEvent) => {
      calendarEvents.push({
        title: googleCalendarEvent.getTitle(),
        startDateTime: googleCalendarEvent.getStartTime(),
        endDateTime: googleCalendarEvent.getEndTime(),
        isAllDay: googleCalendarEvent.isAllDayEvent(),
        existsInSpreadsheet: false,
        options: {
          description: googleCalendarEvent.getDescription(),
          location: googleCalendarEvent.getLocation()
        },
        gcal: googleCalendarEvent,
        gcalId: googleCalendarEvent.getId()
      });
    });
    return calendarEvents;
  }
}