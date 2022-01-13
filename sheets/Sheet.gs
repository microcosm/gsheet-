class Sheet {
  constructor(config) {
    this.config = config;
    const configProcessor = new SheetConfigProcessor(this.config);
    configProcessor.process();
    this.name = this.config.name;
    this.sheetRef = state.spreadsheet.getSheetByName(this.name);
    this.validate();
    this.range = this.config.range || 'A:Z';
    this.values = false;
    this.dataSectionBeginMarker = 'DATA_BEGIN';
    this.dataSectionEndMarker =   'DATA_END';
    this.doneSectionBeginMarker = 'DONE_BEGIN';
    this.doneSectionEndMarker =   'DONE_END';
  }

  getSectionRange(beginRow, endRow) {
    const numRows = endRow - beginRow;
    const numColumns = this.getDataRange().getNumColumns();
    return this.sheetRef.getRange(beginRow, 1, numRows, numColumns);
  }

  getMainSectionRange() {
    return this.getSectionRange(this.getMainSectionBeginRow(), this.getMainSectionEndRow());
  }

  getDoneSectionRange() {
    return this.getSectionRange(this.getDoneSectionBeginRow(), this.getDoneSectionEndRow());
  }

  getMainSectionBeginRow() {
    logString('getMainSectionBeginRow() = ' + this.lookupRowIndex(this.dataSectionBeginMarker, 2));
    return this.lookupRowIndex(this.dataSectionBeginMarker, 2);
  }

  getMainSectionEndRow() {
    logString('getMainSectionEndRow() = ' + this.lookupRowIndex(this.dataSectionEndMarker, -1));
    return this.lookupRowIndex(this.dataSectionEndMarker, -1);
  }

  getDoneSectionBeginRow() {
    return this.lookupRowIndex(this.doneSectionBeginMarker, 2);
  }

  getDoneSectionEndRow() {
    return this.lookupRowIndex(this.doneSectionEndMarker, -1);
  }

  lookupRowIndex(marker, offset=0) {
    return this.getDataRange().createTextFinder(marker).findNext().getRow() + offset;
  }

  retrieveValuesFromSheet() {
    this.values = this.getDataRange().getValues();
    return this.values;
  }

  getValues() {
    return this.values || this.retrieveValuesFromSheet();
  }

  retrieveDataRangeFromSheet() {
    this.dataRange = this.sheetRef.getDataRange();
    return this.dataRange;
  }

  getDataRange() {
    return this.dataRange || this.retrieveDataRangeFromSheet();
  }

  validate() {
    if(this.sheetRef == null) {
      throw 'Cannot establish access to sheet "' + this.name + '" - check config values.';
    }
  }
}

class ValuesSheet extends Sheet {
  constructor(config) {
    super(config);
  }

  retrieveValuesFromSheet() {
    this.values = this.sheetRef.getRange(this.range).getValues();
    return this.values;
  }

  getValuesOf(columnID) {
    return this.getValues().map((value) => { return value[columnID]; });
  }

  getValueOf(rowId, columnID) {
    return this.getValues()[rowId][columnID];
  }
}

class FeatureSheet extends Sheet {
  constructor(config) {
    super(config);
    this.ensureAccessExpectations();
  }

  isNamed(name) {
    return this.name === name;
  }

  isTriggeredByColumn(columnCardinalIndex) {
    return !this.hasTriggerColumns || this.triggerColumns.cardinalIndices.includes(columnCardinalIndex);
  }

  ensureAccessExpectations() {
    this.assignPropertiesFromConfig(['id', 'triggerColumns']);
  }

  assignPropertiesFromConfig(propertyNames) {
    propertyNames.forEach((propertyName) => {
      this.assignPropertyFromConfig(propertyName);
    });
  }

  assignPropertyFromConfig(propertyName) {
    const propertyNameHasVersion = 'has' + capitalizeFirstLetter(propertyName);
    this[propertyNameHasVersion] = false;
    if(this.config.hasOwnProperty(propertyName)) {
      this[propertyName] = this.config[propertyName];
      this[propertyNameHasVersion] = true;
    }
  }
}