class Builder_EventsFromSpreadsheet {
  build() {
    state.users.forEach((user) => {
      user.spreadsheetEvents = this.getSpreadsheetEventsForUser(user);
    });
  }

  getSpreadsheetEventsForUser(user) {
    var extractionState = {
      currentWidget: '',
      events: [],
      user: user,
      exclusionListNames: this.getOtherUsersNames(user),
      fillInTheBlanksDate: state.today
    }

    state.featureSheets.forEach((sheet) => {
      for(var widgetName in sheet.widgets) {
        var widget = sheet.widgets[widgetName];
        if(widget.hasEvents) {
          this.buildEventsFromWidget(sheet, widget, extractionState);
        }
      }
    });

    return extractionState.events;
  }

  getOtherUsersNames(user) {
    var otherNames = [];
    state.users.forEach((possibleOther) => {
      if(possibleOther.name != user.name) {
        otherNames.push(possibleOther.name);
      }
    });
    return otherNames;
  }

  buildEventsFromWidget(sheet, widget, extractionState) {
    for(var i = 0; i < sheet.values.length; i++) {
      const row = sheet.values[i];

      if(this.isWorkDateLabel(row[widget.columns.workDate])) {
        extractionState.currentWidget = sheet.values[i + widget.name.rowOffset][widget.name.column];
      } else if(this.isValidEvent(sheet, row, widget, extractionState)) {
        var eventFromSpreadsheet = this.buildEventFromSheet(sheet, widget, extractionState, row);
        extractionState.events.push(eventFromSpreadsheet);
      }
    }
  }

  isWorkDateLabel(str) {
    return typeof str == 'string' && str.substring(0, state.texts.workDateLabel.length) === state.texts.workDateLabel;
  }

  isValidEvent(sheet, row, widget, extractionState) {
    var validity = {
      isScriptResponsiveWidget: sheet.scriptResponsiveWidgetNames.includes(extractionState.currentWidget),
      isNotDoneOrWaiting:       !this.getIsDoneOrWaiting(widget, row),
      isNounColValidString:     typeof row[widget.columns.noun] == 'string' && row[widget.columns.noun].length > 0,
      isVerbColValidString:     typeof row[widget.columns.verb] == 'string' && row[widget.columns.verb].length > 0,
      isValidDate:              widget.allowFillInTheBlanksDates || row[widget.columns.workDate] instanceof Date,
      isValidUser:              !extractionState.exclusionListNames.includes(row[widget.columns.name]),
      isCustomValidated:        typeof customEventWidgetValidation === "undefined" || customEventWidgetValidation(row, widget)
    };
    return Object.values(validity).every(check => check === true);
  }

  buildEventFromSheet(sheet, widget, extractionState, row) {
    var startDateTime, endDateTime, isAllDay;

    if(this.isFillInTheBlanks(row, widget)) {
      isAllDay = true;
      startDateTime = new Date(extractionState.fillInTheBlanksDate);
      endDateTime = null;
    } else {
      const startTime = row[widget.columns.startTime];
      const startTimeHours = this.getStartTimeHours(startTime);
      const startTimeMinutes = this.getStartTimeMinutes(startTime);
      const durationHours = row[widget.columns.durationHours];
      isAllDay = this.getIsAllDay(startTimeHours, startTimeMinutes, durationHours);
      startDateTime = new Date(row[widget.columns.workDate]);
      startDateTime = this.getPulledForward(startDateTime);

      if(isAllDay) {
        endDateTime = null;
      } else {
        startDateTime.setHours(startTimeHours);
        startDateTime.setMinutes(startTimeMinutes);
        startDateTime.setSeconds(0);
        startDateTime.setMilliseconds(0);
        endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + durationHours);
        endDateTime.setMinutes((durationHours - Math.floor(durationHours)) * 60);
        endDateTime.setSeconds(0);
        endDateTime.setMilliseconds(0);
      }
    }

    return {
      title: row[widget.columns.noun] + ': ' + row[widget.columns.verb],
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      isAllDay: isAllDay,
      options: {
        description: this.generateDescription(sheet, widget, extractionState, row),
        location: extractionState.currentWidget,
        guests: extractionState.user.inviteEmail
      },
      isAlreadyInCalendar: false
    };
  }

  getIsAllDay(startTimeHours, startTimeMinutes, durationHours) {
    return !(
      isValidNumber(startTimeHours) && startTimeHours >= 0 && startTimeHours <= 23 &&
      isValidNumber(startTimeMinutes) && startTimeMinutes >= 0 && startTimeMinutes <= 59 &&
      isValidNumber(durationHours) && durationHours > 0);
  }

  getStartTimeHours(startTime) {
    return isValidTimeString(startTime) ? startTime.split(':')[0] : false;
  }

  getStartTimeMinutes(startTime) {
    return isValidTimeString(startTime) ? startTime.split(':')[1] : false;
  }

  isFillInTheBlanks(row, widget) {
    return widget.allowFillInTheBlanksDates && (!(row[widget.columns.workDate] instanceof Date));
  }

  getPulledForward(dateTime) {
    if(dateTime < state.today) {
      var pulledForwardDate = new Date(dateTime);
      pulledForwardDate.setFullYear(state.today.getFullYear());
      pulledForwardDate.setMonth(state.today.getMonth());
      pulledForwardDate.setDate(state.today.getDate());
      return pulledForwardDate;
    }
    return dateTime;
  }

  getIsDoneOrWaiting(widget, row) {
    if(widget.hasDoneCol) {
      return row[widget.columns.done] === 'Yes' || row[widget.columns.done] === 'Waiting';
    }
    return false;
  }

  generateDescription(sheet, widget, extractionState, row) {
    const name = getNameSubstitution(row[widget.columns.name]);

    return 'This event is from the "' + extractionState.currentWidget +
      '" widget' + (name ? ' for ' + name : '') +
      '.\n\nCreated by <a href="https://docs.google.com/spreadsheets/d/' + config.gsheet.id +
      '/edit?usp=sharing' +
      (sheet.hasId ? '#gid=' + sheet.id : '') +
      '">' + config.gsheet.name + '</a>&nbsp;&larr; Click here for more';
  }
}