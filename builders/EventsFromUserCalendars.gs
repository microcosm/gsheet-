class Builder_EventsFromUserCalendars {
  build() {
    state.users.forEach((user) => {
      user.calendarEvents = this.getCalendarEventsForUser(user);
    });
  }

  getCalendarEventsForUser(user, fromDate=new Date('January 1, 2000'), toDate=new Date('January 1, 3000')) {
    const googleCalendarEvents = user.calendar.getEvents(fromDate, toDate);
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