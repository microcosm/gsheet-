class Subsheet {
  constructor(spreadsheet, range, name, id=false) {
    this.spreadsheet = spreadsheet;
    this.range = range;
    this.name = name;
    this.id = id;
    this.tab = this.spreadsheet.getSheetByName(this.name);
  }
}

class PersonValuesSubsheet extends Subsheet {
  constructor(spreadsheet, range, name, id=false) {
    super(spreadsheet, range, name, id);
    this.numValuesPerPerson = 3;
  }
}