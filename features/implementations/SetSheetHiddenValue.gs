class SetSheetHiddenValue extends Feature {
  constructor(sheet) {
    super(sheet, 'Set Sheet Hidden Value');
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    const column = this.config.update.column.cardinalIndex;
    const row = this.sheet.getHiddenValuesRow();
    const range = this.sheet.sheetRef.getRange(row, column, 1, 1);
    const value = this.getValue();
    if(value) {
      range.setValue(value);
    }
  }

  getValue() {
    if(this.config.update.value === PropertyCommand.EVENT_DATA) return this.eventData.value;
    if(this.config.update.value === PropertyCommand.CURRENT_DATE) return state.today;
    logString('Cell not updated because no cell value config found');
    return false;
  }
}