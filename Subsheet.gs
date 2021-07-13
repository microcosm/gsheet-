class Subsheet {
  constructor(spreadsheet, name, id, range) {
    this.spreadsheet = spreadsheet;
    this.range = range;
    this.name = name;
    this.id = id;
    this.tab = this.spreadsheet.getSheetByName(this.name);
  }
}

class PersonValuesSubsheet extends Subsheet {
  constructor(spreadsheet, name, range) {
    super(spreadsheet, name, false, range);
    this.numValuesPerPerson = 3;
  }
}

class EventSubsheet extends Subsheet {
  constructor(spreadsheet, name, id, range, sections, triggerCols) {
    super(spreadsheet, name, id, range);
    this.sections = sections;
    this.triggerCols = triggerCols;
    this.hasSeasonCell = false;
    this.seasonCol = null;
    this.seasonRow = null;
    this.generateRangeColumns();
  }

  generateRangeColumns() {
    for(var sectionName in this.sections) {
      var section = this.sections[sectionName];
      for(var columnName in section.columns) {
        section.rangeColumns[columnName] = section.columns[columnName] - this.range.offsets.col;
      }
    }
  }

  getRangeValues() {
    return this.tab.getRange (
        this.range.offsets.row, this.range.offsets.col,
        this.range.maxRows, this.range.maxCols
      ).getValues();
  }

  getSeasonRangeCol() {
    return this.seasonCol - this.range.offsets.col;
  }

  getSeasonRangeRow() {
    return this.seasonRow - this.range.offsets.row;
  }

  setSeasonCell(col, row) {
    this.hasSeasonCell = true;
    this.seasonCol = col;
    this.seasonRow = row;
  }
}