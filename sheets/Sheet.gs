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
  }

  retrieveValuesFromSheet() {
    this.values = this.sheetRef.getDataRange().getValues();
    return this.values;
  }

  getValues() {
    return this.values || this.retrieveValuesFromSheet();
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