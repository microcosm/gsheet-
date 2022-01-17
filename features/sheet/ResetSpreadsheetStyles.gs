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
    this.setStyle(this.sheet.getMainSectionRange(), this.config.contentSections);
    this.setStyle(this.sheet.getDoneSectionRange(), this.config.contentSections);

    const headerSectionRanges = this.sheet.getHeaderSectionRanges();
    for(const headerSectionRange of headerSectionRanges) {
      this.setStyle(headerSectionRange, this.config.headers);
    }

    const underContentSectionRanges = this.sheet.getUnderContentSectionRanges();
    for(const underContentSectionRange of underContentSectionRanges) {
      this.setStyle(underContentSectionRange, this.config.underContentSections);
    }
  }

  setStyle(range, config) {
    if(config.hasOwnProperty('fontFamily')) range.setFontFamily(config.fontFamily);
    if(config.hasOwnProperty('fontSize')) range.setFontSize(config.fontSize);
    if(config.hasOwnProperty('border')) range.setBorder(config.border.top, config.border.left, config.border.bottom, config.border.right, config.border.vertical, config.border.horizontal, config.border.color, borderStyles[config.border.style]);
  }
}