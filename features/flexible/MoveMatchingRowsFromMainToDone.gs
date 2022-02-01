class MoveMatchingRowsFromMainToDone extends Feature {
  constructor(sheet) {
    super(sheet, 'Move Matching Rows From Main To Done');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onSpreadsheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    this.matchText = toArray(this.config.matchText);
    this.matchColumn = this.config.matchColumn.cardinalIndex;
    this.doneSectionIndex = this.sheet.getFirstDoneRow();
    this.foundRows = [];
    this.findTextMatchingRowsInMainSection();
    this.moveRowsToDone();
    this.sheet.clearCache();
  }

  findTextMatchingRowsInMainSection() {
    for(const matcher of this.matchText) {
      const matchingRows = this.sheet.getMatchingRowsFromMainContent(matcher, this.matchColumn);
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