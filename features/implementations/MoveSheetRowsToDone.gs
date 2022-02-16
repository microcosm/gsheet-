class MoveSheetRowsToDone extends Feature {
  constructor(sheet) {
    super(sheet, 'Move Sheet Rows To Done');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onSheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onHourTimer);
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    this.matchTexts = toArray(this.config.match.value);
    this.matchColumn = this.config.match.column.cardinalIndex;
    this.doneSectionIndex = this.sheet.getFirstDoneRow();
    this.foundRows = [];
    this.findTextMatchingRows();
    this.moveRowsToDone();
    this.sheet.clearCache();
  }

  findTextMatchingRows() {
    for(const matcher of this.matchTexts) {
      const matchingRows = this.sheet.getMatchingRowsFromContentSections(matcher, this.matchColumn, this.config.from);
      this.foundRows = this.foundRows.concat(matchingRows);
    }
  }

  moveRowsToDone() {
    const sortedRows = this.getFoundRowsSortedByNumberDescending();
    for(const row of sortedRows) {
      const range = this.sheet.getRowRange(row);
      this.sheet.sheetRef.moveRows(range, this.doneSectionIndex);
    }
  }

  getFoundRowsSortedByNumberDescending() {
    return this.foundRows.sort((a, b) => { return (+b) - (+a) })
  }
}