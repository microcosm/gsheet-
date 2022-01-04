const Event = {
  onSpreadsheetOpen: 'onSpreadsheetOpen',
  onSpreadsheetEdit: 'onSpreadsheetEdit',
  onCalendarEdit:    'onCalendarEdit',
  onOvernightTimer:  'onOvernightTimer'
};

class Feature {
  constructor() {
    this.sheets = [];
    this.responseCapabilities = [];
  }

  registerSheet(sheet) {
    this.sheets.push(sheet);
  }

  isRegisteredFor(sheetName, column) {
    var found = false;
    this.sheets.forEach((sheet) => {
      if(sheet.name === sheetName && (!sheet.hasTriggerColumns || sheet.triggerColumns.includes(column))) {
        found = true;
      }
    });
    return found;
  }

  addResponseCapability(event) {
    if(!this.respondsTo(event)) {
      this.responseCapabilities.push(event);
    }
  }

  respondsTo(event) {
    return this.responseCapabilities.includes(event);
  }
}