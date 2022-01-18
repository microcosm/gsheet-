class Feature {
  constructor(sheet, name, initiatior) {
    this.sheet = sheet;
    this.name = name;
    this.initiatior = initiatior;
    this.responseCapabilities = [];
    this.camelCaseName = false;
    this.config = false;
    this.priority = false;
  }

  execute() {
    logFeatureExecution(this);
    this.setConfig();
  }

  addResponseCapability(event) {
    if(!this.responseCapabilities.includes(event)) {
      this.responseCapabilities.push(event);
    }
  }

  respondsTo(event, eventData) {
    const respondsToEvent = this.responseCapabilities.includes(event);
    const isValidEventData = this.isValidEventData(eventData);
    logFeatureEvaluation(this, respondsToEvent, isValidEventData);
    return respondsToEvent && isValidEventData;
  }

  getCamelCaseName() {
    if(!this.camelCaseName) this.camelCaseName = toCamelCase(this.name);
    return this.camelCaseName;
  }

  getPriority() {
    this.setConfig();
    if(!this.priority) this.priority = this.config.hasOwnProperty('priority') ? priorities[this.config.priority] : priorities.LOW_PRIORITY;
    return this.priority;
  }

  setConfig() {
    if(!this.config) {
      this.config = this.initiatior === featureInitiators.sidebar && this.eventData ?
        this.sheet.config.sidebar[this.eventData.configAccessor].features[this.getCamelCaseName()] :
        this.sheet.config.features[this.getCamelCaseName()];
    }
  }

  setEventData(eventData) {
    this.eventData = eventData;
  }

  isValidEventData(eventData) {
    logStringVerbose('isValidEventData for feature \'' + this.name + '\' of sheet ' + this.sheet.name + '?');
    startLogBlockVerbose();
    if(!eventData) {
      logStringVerbose('isValidEventData is true because eventData is null');
      endLogBlockVerbose();
      return true;
    }
    const isValidEventData = this.isValidSheetActivatedEventData(eventData) || this.isValidSidebarSubmissionEventData(eventData);
    logStringVerbose('isValidEventData is ' + isValidEventData);
    endLogBlockVerbose();
    return isValidEventData;
  }

  isSheetActivatedEventData(eventData) {
    const isSheetActivatedEventData = eventData.hasOwnProperty('source') && eventData.hasOwnProperty('range');
    logStringVerbose('isSheetActivatedEventData is ' + isSheetActivatedEventData);
    return isSheetActivatedEventData;
  }

  isValidSheetActivatedEventData(eventData) {
    if(!this.isSheetActivatedEventData(eventData)) return false;
    const sheetName = eventData.source.getActiveSheet().getName();
    const column = eventData.range.columnStart;
    const isMatchingSheet = this.sheet.isNamed(sheetName);
    const isTriggerColumn = this.sheet.isTriggeredByColumn(column);
    const isValidSheetActivatedEventData = isMatchingSheet && isTriggerColumn;
    logStringVerbose('isValidSheetActivatedEventData is ' + isValidSheetActivatedEventData + ' because isMatchingSheet is ' + isMatchingSheet + ' and isTriggerColumn is ' + isTriggerColumn);
    return isValidSheetActivatedEventData;
  }

  isSidebarSubmissionEventData(eventData) {
    const isSidebarSubmissionEventData = eventData.hasOwnProperty('sidebar') && eventData.hasOwnProperty('features');
    logStringVerbose('isSidebarSubmissionEventData is ' + isSidebarSubmissionEventData);
    return isSidebarSubmissionEventData;
  }

  isValidSidebarSubmissionEventData(eventData) {
    if(!this.isSidebarSubmissionEventData(eventData)) return false;
    const isMatchingSheet = this.sheet.isNamed(eventData.sheetName);
    if(!isMatchingSheet) {
      logStringVerbose('isValidSidebarSubmissionEventData is false because isMatchingSheet is false');
      return false;
    }

    let found = false;
    for(const feature of eventData.features.split(',')) {
      if(feature === this.getCamelCaseName()) {
        logStringVerbose('isValidSidebarSubmissionEventData is true because isMatchingSheet is true and feature ' + feature + ' was found');
        return true;
      }
    }
    logStringVerbose('isValidSidebarSubmissionEventData is false because isMatchingSheet is true and no features from ' + eventData.features + ' were found');
    return false;
  }
}