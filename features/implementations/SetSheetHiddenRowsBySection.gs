class SetSheetHiddenRowsBySection extends Feature {
  constructor(sheet) {
    super(sheet, 'Set Sheet Hidden Rows By Section');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onHourTimer);
    this.addResponseCapability(Event.onSidebarSubmit);
    this.isActiveSelectionSet = false;
  }

  execute() {
    super.execute();
    this.initialize();
    this.hideAndShow();
  }

  initialize() {
    this.hasVisibilityMatcher = !!(this.config.visibilityMatcher);
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
        this.setActiveSelection(row);
      } else {
        this.sheet.sheetRef.hideRows(row, numRows);
      }
    }
  }

  getIsVisible(cardinalIndexRow) {
    if(this.hasVisibilityMatcher) {
      this.prepareVisibilityMatcher();
      const cellValue = this.values[cardinalIndexRow - 1][this.config.visibilityMatcher.column.zeroBasedIndex].toString();
      return isProperty(this.config.visibilityMatcher.method) ? this.config.visibilityMatcher.method(cellValue, this.eventData.value) : isMatch(cellValue, this.config.visibilityMatcher.text);
    }
    return false;
  }

  prepareVisibilityMatcher() {
    if(this.config.visibilityMatcher.text === PropertyCommand.EVENT_DATA) this.config.visibilityMatcher.text = this.eventData.value;
    return this.config.visibilityMatcher;
  }

  setActiveSelection(row) {
    if(!this.isActiveSelectionSet) {
      this.sheet.sheetRef.setActiveSelection(this.config.visibilityMatcher.column.asConfig + row);
      this.isActiveSelectionSet = true;
    }
  }
}