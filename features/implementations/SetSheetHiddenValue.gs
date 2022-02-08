class SetSheetHiddenValue extends Feature {
  constructor(sheet) {
    super(sheet, 'Set Sheet Hidden Value');
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    const column = this.config.cellToUpdate.column.cardinalIndex;
    const row = this.sheet.config.hiddenValueRow.cardinalIndex;
    const range = this.sheet.sheetRef.getRange(row, column, 1, 1);
    range.setValue(this.eventData.value);
  }
}