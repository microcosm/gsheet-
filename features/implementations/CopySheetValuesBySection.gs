class CopySheetValuesBySection extends Feature {
  constructor(sheet) {
    super(sheet, 'Copy Sheet Values By Section');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onHourTimer);
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    this.initialize();
    this.copy();
  }

  initialize() {
    this.hasCopyIfMatch = !!(this.config.from.copyIfMatch);
    this.startRowOffset = this.config.startRowOffset || 0;
    this.values = this.sheet.getValues();
  }

  copy() {
    const sectionLookups = this.sheet.getSectionRangeLookups(this.config.from.section);
    for(const sectionLookup of sectionLookups) {
      const row = sectionLookup.row + this.startRowOffset;
      if(this.getIsCopyable(row)) {
        const rangeConfig = [{ beginColumnOffset: this.config.beginColumnOffset }];
        const destinationRange = this.sheet.getContentSectionsSubRanges(this.config.to.section, rangeConfig)[0][0];
        const destinationRangeRowValues = destinationRange.getValues()[0];
        const firstColumn = this.sheet.getFirstContentColumn() + this.config.beginColumnOffset - 1;
        const lastColumn = firstColumn + destinationRangeRowValues.length;
        const newValues = [this.values[row - 1].slice(firstColumn, lastColumn)];
        destinationRange.setValues(newValues);
      }
    }
  }

  getIsCopyable(cardinalIndexRow) {
    if(!this.hasCopyIfMatch) return false;
    const copyMatcher = this.getCopyMatcher();
    const cellValue = this.values[cardinalIndexRow - 1][copyMatcher.column.zeroBasedIndex].toString();
    return cellValue.includes(copyMatcher.text);
  }

  getCopyMatcher() {
    return {
      column: this.config.from.copyIfMatch.column,
      text: this.config.from.copyIfMatch.text === PropertyCommand.EVENT_DATA ? this.eventData.value : this.config.from.copyIfMatch.text
    };
  }
}