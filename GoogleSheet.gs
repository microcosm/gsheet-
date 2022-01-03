class GoogleSheet {
  constructor(sheetConfig) {
    this.config = sheetConfig;
    this.name = sheetConfig.name;
    this.range = sheetConfig.range || 'A:Z';
    this.sheetRef = state.spreadsheet.getSheetByName(this.name);
    this.validate();
    this.values = this.sheetRef.getRange(this.range).getValues();
  }

  validate() {
    if(this.sheetRef == null) {
      throw 'Cannot establish access to sheet "' + this.name + '" - check config values.';
    }
  }
}

class ValuesSheet extends GoogleSheet {
  constructor(sheetConfig) {
    super(sheetConfig);
  }

  getValuesOf(columnID) {
    return this.values.map((value, index) => { return value[columnID]; });
  }
}

class ScriptSheet extends GoogleSheet {
  constructor(sheetConfig) {
    super(sheetConfig);
    this.ensureAccessExpectations();
    this.convertColumnStringIdentifiersToArrayIndices();
    this.getValues();
  }

  ensureAccessExpectations() {
    this.assignPropertiesFromConfig(['id', 'triggerCols', 'widgets', 'scriptResponsiveWidgetNames']);

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

  convertColumnStringIdentifiersToArrayIndices() {
    if(this.hasTriggerCols) {
      this.triggerCols = Array.from(this.triggerCols, triggerCol => this.getArrayIndex(triggerCol));
    }

    if(this.hasWidgets) {
      for(var key in this.widgets) {
        this.convertWidgetColumnStringIdentifiersToArrayIndices(this.widgets[key]);
      }
    }
  }

  convertWidgetColumnStringIdentifiersToArrayIndices(widget) {
    if(widget.hasOwnProperty('name') && widget.name.hasOwnProperty('column')) {
      widget.name.column = this.getArrayIndex(widget.name.column);
    }
    if(widget.hasOwnProperty('columns')) {
      for(var key in widget.columns) {
        widget.columns[key] = this.getArrayIndex(widget.columns[key]);
      }
    }
  }

  getValues() {
    this.values = this.sheetRef.getDataRange().getValues();
  }

  getArrayIndex(columnIdentifier){
    if(typeof columnIdentifier === 'string') {
      return (columnIdentifier.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0)) - 1;
    } else if(typeof columnIdentifier === 'number') {
      return columnIdentifier;
    }
    logString('Unrecognized column identifier from config: ' + columnIdentifier);
    return -1;
  }
}