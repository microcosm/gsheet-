class MoveFromMainToDone extends Feature {
  constructor(sheet) {
    super(sheet, 'Move From Main To Done');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onSpreadsheetEdit);
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
    this.findTextMatchingRowsInMainSection();
    this.moveRowsToDone();
    this.sheet.clearCache();
  }

  findTextMatchingRowsInMainSection() {
    for(const matcher of this.matchTexts) {
      const matchingRows = this.sheet.getMatchingRowsFromContentSection(matcher, this.matchColumn, SectionMarker.main);
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