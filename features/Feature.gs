class Feature {
  constructor(sheet, name) {
    this.sheet = sheet;
    this.name = name;
    this.camelCaseName = false;
    this.priority = false;
    this.responseCapabilities = [];
    this.methods = {
      onSpreadsheetEdit: { configValidator: 'isValidStandardSheetConfig', eventDataValidator: 'isValidStandardEventData'},
      onCalendarEdit:    { configValidator: 'isValidStandardSheetConfig', eventDataValidator: 'isValidStandardEventData'},
      onOvernightTimer:  { configValidator: 'isValidStandardSheetConfig', eventDataValidator: 'isValidStandardEventData'},
      onSidebarSubmit:   { configValidator: 'isValidSidebarSheetConfig',  eventDataValidator: 'isValidSidebarEventData' }
    };
  }

  execute() {
    logFeatureExecution(this);
  }

  addResponseCapability(event) {
    if(!this.responseCapabilities.includes(event)) {
      this.responseCapabilities.push(event);
    }
  }

  respondsTo(event, eventData=false) {
    this.event = event;
    this.eventData = eventData;
    logStringVerbose(`Investigating sheet '` + this.sheet.name + `' for feature ` + this.getCamelCaseName());
    startLogBlockVerbose();
    const respondsTo = this.getResponseValidity();
    logStringVerbose((respondsTo ? '**' : '') + 'Feature does ' + (respondsTo ? '' : 'not ') + 'respond to event.' + (respondsTo ? '**' : ''));
    endLogBlockVerbose();
    return respondsTo;
  }

  getCamelCaseName() {
    if(!this.camelCaseName) this.camelCaseName = toCamelCase(this.name);
    return this.camelCaseName;
  }

  getPriority() {
    if(!this.priority) this.priority = this.sheet.config.hasOwnProperty('priority') ? priorities[this.sheet.config.priority] : Priority.LOW_PRIORITY;
    return this.priority;
  }

  getResponseValidity() {
    const configValidator = this.methods[this.event].configValidator;
    const eventDataValidator = this.methods[this.event].eventDataValidator;
    this.hasValidSheetConfig = this[configValidator]();  if(!this.hasValidSheetConfig) return false;
    this.hasCapability = this.hasResponseCapability();   if(!this.hasCapability)       return false;
    this.hasRequest = this.hasResponseRequest();         if(!this.hasRequest)          return false;
    this.hasValidEventData = this[eventDataValidator](); if(!this.hasValidEventData)   return false;
    return true;
  }

  isValidStandardSheetConfig() {
    const isValid = isObject(this.sheet.config) && isObject(this.sheet.config.features) && isObject(this.sheet.config.features[this.getCamelCaseName()]);
    if(isValid) this.config = this.sheet.config.features[this.getCamelCaseName()];
    logStringVerbose(`isValidStandardSheetConfig is ` + isValid + `.`);
    return isValid;
  }

  isValidSidebarSheetConfig() {
    const isValid = isObject(this.sheet.config) && isObject(this.sheet.config.sidebar) && isObject(this.sheet.config.sidebar[this.eventData.configAccessor]) && isObject(this.sheet.config.sidebar[this.eventData.configAccessor].features) && isObject(this.sheet.config.sidebar[this.eventData.configAccessor].features[this.getCamelCaseName()]);
    if(isValid) this.config = this.sheet.config.sidebar[this.eventData.configAccessor].features[this.getCamelCaseName()];
    logStringVerbose(`isValidSidebarSheetConfig is ` + isValid + `.`);
    return isValid;
  }

  hasResponseCapability() {
    const hasCapability = this.responseCapabilities.includes(this.event);
    logStringVerbose(`hasResponseCapability for ` + this.event + ` is ` + hasCapability + `.`);
    return hasCapability;
  }

  hasResponseRequest() {
    const hasRequest = toArray(this.config.events).includes(this.event);
    logStringVerbose(`hasResponseRequest for ` + this.event + ` is ` + hasRequest + `.`);
    return hasRequest;
  }

  isValidStandardEventData() {
    if(this.event === Event.onSpreadsheetEdit) {
      const sheetName = this.eventData.source.getActiveSheet().getName();
      const isValid = this.sheet.isNamed(sheetName);
      logStringVerbose(`isValidStandardEventData is ` + isValid + ` because feature is bound to sheet '` + sheetName + `'.`);
      return isValid;
    }
    logStringVerbose(`isValidStandardEventData is true because Event '` + this.event + `' requires no event data.`);
    return true;
  }

  isValidSidebarEventData() {
    const sheetName = this.eventData.sheetName;
    if(!this.sheet.isNamed(sheetName)) {
      logStringVerbose(`isValidSidebarEventData is false because feature is bound to sheet '` + sheetName + `'.`);
      return false;
    }
    for(const feature of this.eventData.features.split(',')) {
      if(feature === this.getCamelCaseName()) {
        logStringVerbose(`isValidSidebarEventData is true because feature '` + feature + `' is requested by sidebar event data.`);
        return true;
      }
    }
    logStringVerbose(`isValidSidebarEventData is false because feature is not in '` + this.eventData.features + `'.`);
    return false;
  }
}