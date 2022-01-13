class Feature {
  constructor(sheet) {
    this.sheet = sheet;
    this.responseCapabilities = [];
    this.camelCaseName = false;
    this.sidebarFeature = false;
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

  setEventData(eventData) {
    this.eventData = eventData;
  }

  getCamelCaseName() {
    if(!this.camelCaseName) this.camelCaseName = toCamelCase(this.name);
    return this.camelCaseName;
  }

  getConfig() {
    if(this.sidebarFeature) {
      return this.sheet.config.sidebar[this.eventData.configAccessor].features[this.getCamelCaseName()];
    }
    return this.sheet.config.features[this.getCamelCaseName()];
  }

  isValidEventData(eventData) {
    if(!eventData) return true;
    return this.isValidSheetActivatedEventData(eventData) || this.isValidSidebarSubmissionEventData(eventData);
  }

  isSheetActivatedEventData(eventData) {
    return eventData.hasOwnProperty('source') && eventData.hasOwnProperty('range');
  }

  isValidSheetActivatedEventData(eventData) {
    if(!this.isSheetActivatedEventData(eventData)) return false;
    const sheetName = eventData.source.getActiveSheet().getName();
    const column = eventData.range.columnStart;
    return this.sheet.isNamed(sheetName) && this.sheet.isTriggeredByColumn(column);
  }

  isSidebarSubmissionEventData(eventData) {
    return eventData.hasOwnProperty('sidebar') && eventData.hasOwnProperty('features');
  }

  isValidSidebarSubmissionEventData(eventData) {
    if(!this.isSidebarSubmissionEventData(eventData) || !this.sheet.isNamed(eventData.sheetName)) return false;
    let found = false;
    for(const feature of eventData.features.split(',')) {
      if(feature === this.getCamelCaseName()) {
        return true;
      }
    }
    return false;
  }

  execute() {
    logFeatureExecution(this.name);
    this.config = this.getConfig();
  }
}