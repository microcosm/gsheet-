class SetSheetHiddenRowsBySection extends Feature {
  constructor(sheet) {
    super(sheet, 'Set Sheet Hidden Rows By Section');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onHourTimer);
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    this.initialize();
    this.hideAndShow();
  }

  initialize() {
    this.hasVisibilityConfig = !!(this.config.visibleIfMatch);
    this.startRowOffset = this.config.startRowOffset || 0;
    this.values = this.sheet.getValues();
  }

  hideAndShow() {
    const sectionLookups = this.sheet.getSectionRangeLookups(this.config.section);
    for(const sectionLookup of sectionLookups) {
      const row = sectionLookup.row + this.startRowOffset;
      const numRows = sectionLookup.numRows - this.startRowOffset;

      if(this.getIsVisible(row)) {
        this.sheet.sheetRef.showRows(row, numRows);
      } else {
        this.sheet.sheetRef.hideRows(row, numRows);
      }
    }
  }

  getIsVisible(cardinalIndexRow) {
    if(!this.hasVisibilityConfig) return false;
    const visibilityMatcher = this.getVisibilityMatcher();
    const cellValue = this.values[cardinalIndexRow - 1][visibilityMatcher.column.zeroBasedIndex].toString();
    return cellValue.includes(visibilityMatcher.text);
  }

  getVisibilityMatcher() {
    return {
      column: this.config.visibleIfMatch.column,
      text: this.config.visibleIfMatch.text === PropertyCommand.EVENT_DATA ? this.eventData.value : this.config.visibleIfMatch.text
    };
  }
}