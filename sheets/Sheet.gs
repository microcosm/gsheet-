class Sheet {
  constructor(sheetConfig) {
    this.config = sheetConfig;
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
  constructor(sheetConfig) {
    super(sheetConfig);
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
  constructor(sheetConfig) {
    super(sheetConfig);
    this.ensureAccessExpectations();
    this.buildValues();
  }

  ensureAccessExpectations() {
    this.assignPropertiesFromConfig(['id', 'triggerColumns', 'widgets', 'scriptResponsiveWidgetNames']);

    if(this.hasWidgets) {
      this.ensureBooleanAccessors(['hasEvents', 'hasDoneCol', 'allowFillInTheBlanksDates']);
    }
  }

  ensureBooleanAccessors(expectedBooleanAccessors) {
    expectedBooleanAccessors.forEach((expectedBooleanAccessor) => {
      this.ensureBooleanAccessor(expectedBooleanAccessor);
    });
  }

  ensureBooleanAccessor(expectedBooleanAccessor) {
    if(!this.hasOwnProperty(expectedBooleanAccessor)) {
      this[expectedBooleanAccessor] = false;
    }
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