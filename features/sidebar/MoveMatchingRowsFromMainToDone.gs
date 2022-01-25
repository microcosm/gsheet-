class MoveMatchingRowsFromMainToDone extends Feature {
  constructor(sheet) {
    super(sheet, 'Move Matching Rows From Main To Done');
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    this.matchText = this.config.matchText;
    this.matchColumn = this.config.matchColumn.cardinalIndex;
    this.doneSectionIndex = this.sheet.getDoneSectionBeginRow();
    this.foundRows = [];
    this.findTextMatchingRowsInMainSection();
    this.sortFoundRows();
    this.moveRowsToDone();
    this.sheet.clearCache();
  }

  findTextMatchingRowsInMainSection() {
    const matchRanges = this.sheet.getMainSectionRowsRange().createTextFinder(this.matchText).findAll();
    for(const range of matchRanges) {
      if(range.getColumn() === this.matchColumn) {
        this.foundRows.push(range.getRow());
      }
    }
  }

  sortFoundRows() {
    this.foundRows.sort().reverse();
  }

  moveRowsToDone() {
    for(const row of this.foundRows) {
      const range = this.sheet.getRangeOfRow(row);
      this.sheet.sheetRef.moveRows(range, this.doneSectionIndex);
    }
  }
}