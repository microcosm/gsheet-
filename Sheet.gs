class Sheet {
  constructor(spreadsheet, name, id, scriptRange) {
    this.spreadsheet = spreadsheet;
    this.scriptRange = scriptRange;
    this.name = name;
    this.id = id;
    this.sheetRef = this.spreadsheet.getSheetByName(this.name);
    this.validate();
  }

  validate() {
    if(this.sheetRef == null) {
      throw 'Cannot establish access to sheet "' + this.name + '" - check config values.';
    }
  }
}

class ValuesSheet extends Sheet {
  constructor(spreadsheet, name, scriptRange) {
    super(spreadsheet, name, false, scriptRange);
    this.numValuesPerPerson = 3;
  }
}

class ScriptSheet extends Sheet {
  constructor(spreadsheet, name, id, scriptRange, widgets, triggerCols) {
    super(spreadsheet, name, id, scriptRange);
    this.widgets = widgets;
    this.triggerCols = triggerCols;
    this.hasSeasonCell = false;
    this.seasonCol = null;
    this.seasonRow = null;
    this.generateScriptRangeColumns();
    this.generateScriptRangeValues();
  }

  generateScriptRangeColumns() {
    for(var widgetName in this.widgets) {
      var widget = this.widgets[widgetName];
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

  getSeasonStr() {
    return this.scriptRangeValues[this.seasonRow - this.scriptRange.offsets.row][this.seasonCol - this.scriptRange.offsets.col];
  }

  setSeasonCell(col, row) {
    this.hasSeasonCell = true;
    this.seasonCol = col;
    this.seasonRow = row;
  }
}