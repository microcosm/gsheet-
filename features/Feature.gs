class Feature {
  constructor(sheet, name) {
    this.sheet = sheet;
    this.name = name;
    this.responseCapabilities = [];
    this.camelCaseName = false;
    this.config = false;
    this.priority = false;
    this.methods = {
      onSpreadsheetEdit: { configSetter: 'setConfigStandard', eventDataValidator: 'isValidStandardEventData'},
      onCalendarEdit:    { configSetter: 'setConfigStandard', eventDataValidator: 'isValidStandardEventData'},
      onOvernightTimer:  { configSetter: 'setConfigStandard', eventDataValidator: 'isValidStandardEventData'},
      onSidebarSubmit:   { configSetter: 'setConfigSidebar',  eventDataValidator: 'isValidSidebarEventData' }
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

  hasResponseCapability() {
    return this.responseCapabilities.includes(this.event);
  }

  hasResponseRequest() {
    return this.config ? toArray(this.config.events).includes(this.event) : false;
  }

  respondsTo(event, eventData=false) {
    this.event = event;
    this.eventData = eventData;
    this.setConfig();
    this.assessResponseValidity();
    const respondsTo = this.hasCapability && this.hasRequest && this.isValidEventData;
    logStringVerbose('respondsTo is ' + respondsTo + ' because hasCapability is ' +  this.hasCapability + ', hasRequest is ' +  this.hasRequest + ', and isValidEventData is ' + this.isValidEventData + '.');
    endLogBlockVerbose();
    return respondsTo;
  }

  getCamelCaseName() {
    if(!this.camelCaseName) this.camelCaseName = toCamelCase(this.name);
    return this.camelCaseName;
  }

  getPriority() {
    if(!this.priority) this.priority = this.config.hasOwnProperty('priority') ? priorities[this.config.priority] : priorities.LOW_PRIORITY;
    return this.priority;
  }

  setConfig() {
    const configSetter = this.methods[this.event].configSetter;
    this[configSetter]();
  }

  setConfigStandard() {
    this.config = this.sheet.config.features[this.getCamelCaseName()];
  }

  setConfigSidebar() {
    this.config = this.sheet.config.sidebar[this.eventData.configAccessor].features[this.getCamelCaseName()];
  }

  assessResponseValidity() {
    const eventDataValidator = this.methods[this.event].eventDataValidator;
    this.hasCapability = this.hasResponseCapability();
    this.hasRequest = this.hasResponseRequest();
    this.isValidEventData = this[eventDataValidator]();
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