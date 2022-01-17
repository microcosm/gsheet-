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
    this.setStyle(this.sheet.getMainSectionRange(), this.config.mainSection);
    this.setStyle(this.sheet.getDoneSectionRange(), this.config.doneSection);

    const headerSectionRanges = this.sheet.getHeaderSectionRanges();
    for(const headerSectionRange of headerSectionRanges) {
      this.setStyle(headerSectionRange, this.config.headers);
    }
  }

  setStyle(range, config) {
    range.setFontFamily(config.fontFamily);
    range.setFontSize(config.fontSize);
    range.setBorder(config.border.top, config.border.left, config.border.bottom, config.border.right, config.border.vertical, config.border.horizontal, config.border.color, borderStyles[config.border.style]);
  }
}