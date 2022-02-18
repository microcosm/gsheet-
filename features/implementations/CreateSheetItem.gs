class CreateSheetItem extends Feature {
  constructor(sheet) {
    super(sheet, 'Create Sheet Item');
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    this.setInsertionSectionIndex();
    this.insertNewRow();
    this.updateNewRow();
    this.sheet.clearCache();
  }

  setInsertionSectionIndex() {
    if(isNumber(this.config.insertionSectionIndex)) {
      this.insertionSectionIndex = this.config.insertionSectionIndex;
    } else if(isProperty(this.config.getInsertionSectionIndex)) {
      this.insertionSectionIndex = this.config.getInsertionSectionIndex(this.eventData.value);
    } else {
      this.insertionSectionIndex = 1;
    }
  }

  insertNewRow() {
    this.firstContentRow = this.sheet.getNthFirstRow(SectionMarker.main, this.insertionSectionIndex);
    this.sheet.sheetRef.insertRowBefore(this.firstContentRow);
  }

  updateNewRow() {
    if(isArray(this.config.values)) this.updateNewRowWith(this.config.values);
    else if(isProperty(this.config.getValues)) this.updateNewRowWith(this.config.getValues(this.eventData.value));
  }

  updateNewRowWith(values) {
    const newRowContentRange = this.getNewRowContentRange();
    const oldValues = newRowContentRange.getValues();
    if(values.length != oldValues[0].length) logString('Not setting values on new row because ' + this.config.values.length + ' values provided in config, whereas ' + oldValues[0].length + ' values required by range');
    else newRowContentRange.setValues([values]);
  }

  getNewRowContentRange() {
    const row = this.firstContentRow;
    const column = this.sheet.getFirstContentColumn();
    const numRows = 1;
    const numCols = this.sheet.getNumContentColumns();
    return this.sheet.sheetRef.getRange(row, column, numRows, numCols);
  }
}