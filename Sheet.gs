class Sheet {
  constructor(spreadsheet, name, id, range) {
    this.spreadsheet = spreadsheet;
    this.range = range;
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
  constructor(spreadsheet, name, range) {
    super(spreadsheet, name, false, range);
    this.numValuesPerPerson = 3;
  }
}

class ScriptSheet extends Sheet {
  constructor(spreadsheet, name, id, range, widgets, triggerCols) {
    super(spreadsheet, name, id, range);
    this.widgets = widgets;
    this.triggerCols = triggerCols;
    this.hasSeasonCell = false;
    this.seasonCol = null;
    this.seasonRow = null;
    this.generateRangeColumns();
    this.generateRangeValues();
  }

  generateRangeColumns() {
    for(var widgetName in this.widgets) {
      var widget = this.widgets[widgetName];
      for(var columnName in widget.columns) {
        widget.rangeColumns[columnName] = widget.columns[columnName] - this.range.offsets.col;
      }
    }
  }

  generateRangeValues() {
    this.rangeValues = this.sheetRef.getRange (
        this.range.offsets.row, this.range.offsets.col,
        this.range.maxRows, this.range.maxCols
      ).getValues();
  }

  getRangeValues() {
    return this.rangeValues;
  }

  getSeasonStr() {
    return this.rangeValues[this.seasonRow - this.range.offsets.row][this.seasonCol - this.range.offsets.col];
  }

  setSeasonCell(col, row) {
    this.hasSeasonCell = true;
    this.seasonCol = col;
    this.seasonRow = row;
  }
}