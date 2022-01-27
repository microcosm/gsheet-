class MoveMatchingRowsFromMainToDone extends Feature {
  constructor(sheet) {
    super(sheet, 'Move Matching Rows From Main To Done');
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    this.matchText = toArray(this.config.matchText);
    this.matchColumn = this.config.matchColumn.cardinalIndex;
    this.doneSectionIndex = this.sheet.getDoneSectionBeginRow();
    this.foundRows = [];
    this.findTextMatchingRowsInMainSection();
    this.moveRowsToDone();
    this.sheet.clearCache();
  }

  findTextMatchingRowsInMainSection() {
    for(const matcher of this.matchText) {
      const matchingRows = this.sheet.getMatchingRowsFromMainContent(matcher, this.matchColumn);
      this.foundRows = this.foundRows.concat(matchingRows, this.foundRows);
    }
  }

  moveRowsToDone() {
    const sortedRows = this.getFoundRowsSortedByNumberDescending();
    for(const row of sortedRows) {
      const range = this.sheet.getRangeOfRow(row);
      this.sheet.sheetRef.moveRows(range, this.doneSectionIndex);
    }
  }

  getFoundRowsSortedByNumberDescending() {
    return this.foundRows.sort((a, b) => { return (+b) - (+a) })
  }
}