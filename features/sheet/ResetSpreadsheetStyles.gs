class ResetSpreadsheetStyles extends Feature {
  constructor(sheet) {
    super(sheet);
    this.name = 'Reset Spreadsheet Styles';
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onSpreadsheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
  }

  execute() {
    super.execute();
    const range = this.sheet.getDataRange();
    range.setFontFamily(this.config.fontFamily);
  }
}