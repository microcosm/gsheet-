const Event = {
  onSpreadsheetOpen: 'onSpreadsheetOpen',
  onSpreadsheetEdit: 'onSpreadsheetEdit',
  onCalendarEdit:    'onCalendarEdit',
  onOvernightTimer:  'onOvernightTimer',
  onSelectionChange: 'onSelectionChange',
  onShowSidebar:     'onShowSidebar'
};

class Feature {
  constructor(sheet) {
    this.sheet = sheet;
    this.responseCapabilities = [];
    this.camelCaseName = false;
  }

  addResponseCapability(event) {
    if(!this.responseCapabilities.includes(event)) {
      this.responseCapabilities.push(event);
    }
  }

  respondsTo(event, eventData) {
    const respondsToEvent = this.responseCapabilities.includes(event);
    const isValidEventData = this.isValidEventData(eventData);
    logFeatureEvaluation(this.name, this.sheet.name, respondsToEvent, isValidEventData);
    return respondsToEvent && isValidEventData;
  }

  getCamelCaseName() {
    if(!this.camelCaseName) this.camelCaseName = toCamelCase(this.name);
    return this.camelCaseName;
  }

  isValidEventData(eventData) {
    if(!eventData) return true;
    return this.isValidSheetActivatedEventData(eventData);
  }

  isValidSheetActivatedEventData(eventData) {
    if(eventData.hasOwnProperty('source') && eventData.hasOwnProperty('range')) {
      const sheetName = eventData.source.getActiveSheet().getName();
      const column = eventData.range.columnStart;
      return this.sheet.isNamed(sheetName) && this.sheet.isTriggeredByColumn(column);
    }
    return true;
  }

  execute() {
    logFeatureExecution(this.name);
  }
}