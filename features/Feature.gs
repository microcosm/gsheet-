class Feature {
  constructor(sheet, name, initiatior) {
    this.sheet = sheet;
    this.name = name;
    this.initiatior = initiatior;
    this.responseCapabilities = [];
    this.camelCaseName = false;
  }

  execute() {
    logFeatureExecution(this.name);
    this.config = this.getConfig();
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

  getConfig() {
    if(this.initiatior === featureInitiators.sidebar) {
      return this.sheet.config.sidebar[this.eventData.configAccessor].features[this.getCamelCaseName()];
    }
    return this.sheet.config.features[this.getCamelCaseName()];
  }

  setEventData(eventData) {
    this.eventData = eventData;
  }

  isValidEventData(eventData) {
    logStringVerbose('isValidEventData for feature \'' + this.name + '\' of sheet ' + this.sheet.name + '?');
    startLogBlockVerbose();
    if(!eventData) {
      logStringVerbose('isValidEventData is true because eventData is null');
      endLogBlock();
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