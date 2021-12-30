class GoogleSheet {
  constructor(name, sheetConfig) {
    this.scriptRange = sheetConfig.scriptRange;
    this.name = name;
    this.sheetRef = state.spreadsheet.getSheetByName(this.name);
    this.validate();
  }

  validate() {
    if(this.sheetRef == null) {
      throw 'Cannot establish access to sheet "' + this.name + '" - check config values.';
    }
  }
}

class ValuesSheet extends GoogleSheet {
  constructor(name, sheetConfig) {
    super(name, sheetConfig);
    this.numValuesPerPerson = 3;
  }
}

class ScriptSheet extends GoogleSheet {
  constructor(name, id, sheetConfig) {
    super(name, sheetConfig);
    this.id = id;
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