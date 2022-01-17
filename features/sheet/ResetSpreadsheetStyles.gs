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

    const mainSectionRange = this.sheet.getMainSectionRange();
    mainSectionRange.setFontFamily(this.config.mainSection.fontFamily);
    mainSectionRange.setFontSize(this.config.mainSection.fontSize);

    const doneSectionRange = this.sheet.getDoneSectionRange();
    doneSectionRange.setFontFamily(this.config.doneSection.fontFamily);
    doneSectionRange.setFontSize(this.config.doneSection.fontSize);

    const headerSectionRanges = this.sheet.getHeaderSectionRanges();
    for(const headerSectionRange of headerSectionRanges) {
      headerSectionRange.setFontFamily(this.config.headers.fontFamily);
      headerSectionRange.setFontSize(this.config.headers.fontSize);
    }
  }
}