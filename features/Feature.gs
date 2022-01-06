const Event = {
  onSpreadsheetOpen: 'onSpreadsheetOpen',
  onSpreadsheetEdit: 'onSpreadsheetEdit',
  onCalendarEdit:    'onCalendarEdit',
  onOvernightTimer:  'onOvernightTimer'
};

class Feature {
  constructor(sheet) {
    this.sheet = sheet;
    this.responseCapabilities = [];
  }

  isRegisteredFor(sheetName, column) {
    return this.sheet.name === sheetName && (!this.sheet.hasTriggerColumns || this.sheet.triggerColumns.includes(column));
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