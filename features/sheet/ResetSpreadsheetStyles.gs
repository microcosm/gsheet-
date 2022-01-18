class ResetSpreadsheetStyles extends Feature {
  constructor(sheet) {
    super(sheet, 'Reset Spreadsheet Styles', featureInitiators.sheet);
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onSpreadsheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
  }

  execute() {
    super.execute();
    this.setRanges();
    this.setStyles();
    this.setHeights();
  }

  setRanges() {
    this.titleSectionRanges           = this.sheet.getTitleSectionRanges();
    this.titleAboveBelowSectionRanges = this.sheet.getTitleAboveBelowSectionRanges();
    this.hiddenValuesRowRange         = this.sheet.getHiddenValuesRowRange();
    this.headerSectionRanges          = this.sheet.getHeaderSectionRanges();
    this.mainSectionRange             = this.sheet.getMainSectionRange();
    this.doneSectionRange             = this.sheet.getDoneSectionRange();
    this.underContentSectionRanges    = this.sheet.getUnderContentSectionRanges();
  }

  setStyles() {
    this.setMultipleRangeStyles(this.titleSectionRanges,           this.config.titles);
    this.setMultipleRangeStyles(this.titleAboveBelowSectionRanges, this.config.titlesAboveBelow);
    this.setSingleRangeStyle   (this.hiddenValuesRowRange,         this.config.hiddenValues);
    this.setMultipleRangeStyles(this.headerSectionRanges,          this.config.headers);
    this.setSingleRangeStyle   (this.mainSectionRange,             this.config.contentSections);
    this.setSingleRangeStyle   (this.doneSectionRange,             this.config.contentSections);
    this.setMultipleRangeStyles(this.underContentSectionRanges,    this.config.underContentSections);
  }

  setMultipleRangeStyles(ranges, config) {
    for(const range of ranges) {
      this.setSingleRangeStyle(range, config);
    }
  }

  setSingleRangeStyle(range, config) {
    if(config.hasOwnProperty('fontFamily')) range.setFontFamily(config.fontFamily);
    if(config.hasOwnProperty('fontSize'))   range.setFontSize  (config.fontSize);
    if(config.hasOwnProperty('fontColor'))  range.setFontColor (config.fontColor);
    if(config.hasOwnProperty('border'))     range.setBorder    (config.border.top, config.border.left, config.border.bottom, config.border.right, config.border.vertical, config.border.horizontal, config.border.color, borderStyles[config.border.style]);
  }

  setHeights() {
    this.setMultipleRangeHeights(this.titleSectionRanges,           this.config.titles);
    this.setMultipleRangeHeights(this.titleAboveBelowSectionRanges, this.config.titlesAboveBelow);
    this.setSingleRangeHeights  (this.hiddenValuesRowRange,         this.config.hiddenValues);
    this.setMultipleRangeHeights(this.headerSectionRanges,          this.config.headers);
    this.setSingleRangeHeights  (this.mainSectionRange,             this.config.contentSections);
    this.setSingleRangeHeights  (this.doneSectionRange,             this.config.contentSections);
    this.setMultipleRangeHeights(this.underContentSectionRanges,    this.config.underContentSections);
  }

  setMultipleRangeHeights(ranges, config) {
    for(const range of ranges) {
      this.setSingleRangeHeights(range, config)
    }
  }

  setSingleRangeHeights(range, config) {
    if(config.hasOwnProperty('rowHeight')) this.sheet.sheetRef.setRowHeightsForced(range.getRow(), range.getNumRows(), config.rowHeight);
  }
}