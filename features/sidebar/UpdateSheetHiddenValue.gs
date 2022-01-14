class UpdateSheetHiddenValue extends Feature {
  constructor(sheet) {
    super(sheet);
    this.name = 'Update Sheet Hidden Value';
    this.addResponseCapability(Event.onSidebarSubmit);
    this.sidebarFeature = true;
  }

  execute() {
    super.execute();
    const column = this.config.cellToUpdate.column.cardinalIndex;
    const row = this.sheet.config.hiddenValueRow.cardinalIndex;
    const range = this.sheet.sheetRef.getRange(row, column, 1, 1);
    range.setValue(this.eventData.value);
  }
}