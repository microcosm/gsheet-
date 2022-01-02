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
    if(sheetConfig.hasOwnProperty('id')) this.id = sheetConfig.id;
    this.widgets = sheetConfig.widgets;
    this.triggerCols = sheetConfig.triggerCols;
    this.scriptResponsiveWidgetNames = sheetConfig.scriptResponsiveWidgetNames;
    this.assignValues();
  }

  assignValues() {
    this.values = this.sheetRef.getDataRange().getValues();
  }
}