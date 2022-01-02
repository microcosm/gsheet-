class GoogleSheet {
  constructor(sheetConfig) {
    this.config = sheetConfig;
    this.name = sheetConfig.name;
    this.scriptRange = sheetConfig.scriptRange;//to go
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
    this.generateScriptRangeColumns();
    this.generateScriptRangeValues();
  }

  generateScriptRangeColumns() {
    for(var widgetName in this.widgets) {
      var widget = this.widgets[widgetName];
      widget.scriptRangeColumns = {};
      for(var columnName in widget.columns) {
        widget.scriptRangeColumns[columnName] = widget.columns[columnName] - this.scriptRange.offsets.col;
      }
    }
  }

  generateScriptRangeValues() {
    this.scriptRangeValues = this.sheetRef.getRange (
        this.scriptRange.offsets.row, this.scriptRange.offsets.col,
        this.scriptRange.maxRows, this.scriptRange.maxCols
      ).getValues();
  }

  getScriptRangeValues() {
    return this.scriptRangeValues;
  }
}