class Sheet {
  constructor(config) {
    this.config = config;
    const configProcessor = new SheetConfigProcessor(this.config);
    configProcessor.process();
    this.name = this.config.name;
    this.sheetRef = state.spreadsheet.getSheetByName(this.name);
    this.validate();
    this.range = this.config.range || 'A:Z';
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
    this.buildValues();
  }

  buildValues() {
    this.values = this.sheetRef.getRange(this.range).getValues();
  }

  getValuesOf(columnID) {
    return this.values.map((value) => { return value[columnID]; });
  }

  getValueOf(rowId, columnID) {
    return this.values[rowId][columnID];
  }
}

class FeatureSheet extends Sheet {
  constructor(config) {
    super(config);
    state.features.registered = state.features.registered.concat(
      config.features.map((featureClass) => { return new featureClass(this) })
    );

    this.ensureAccessExpectations();
    this.buildValues();
  }

  ensureAccessExpectations() {
    this.assignPropertiesFromConfig(['id', 'triggerColumns', 'widgets', 'scriptResponsiveWidgetNames']);
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

  buildValues() {
    this.values = this.sheetRef.getDataRange().getValues();
  }
}