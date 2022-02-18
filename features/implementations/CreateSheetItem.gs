class CreateSheetItem extends Feature {
  constructor(sheet) {
    super(sheet, 'Create Sheet Item');
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    this.insertNewRow();
    this.updateNewRow();
    this.sheet.clearCache();
  }

  insertNewRow() {
    let insertionSectionIndex = 1;
    if(isProperty(this.config.getInsertionSectionIndex)) {
      insertionSectionIndex = this.config.getInsertionSectionIndex(this.eventData.value);
    }

    this.firstContentRow = this.sheet.getNthFirstRow(SectionMarker.main, insertionSectionIndex);
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