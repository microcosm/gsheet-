class MoveMatchingRowsFromMainToArchive extends Feature {
  constructor(sheet) {
    super(sheet, 'Move Matching Rows From Main To Archive', featureInitiators.sidebar);
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    this.matchText = this.config.matchText;
    this.matchColumn = this.config.matchColumn.cardinalIndex;
    this.archiveIndex = this.sheet.getDoneSectionBeginRow();
    this.foundRows = [];
    this.findTextMatchingRowsInMainSection();
    this.sortFoundRows();
    this.moveRowsToArchive()
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

  moveRowsToArchive() {
    for(const row of this.foundRows) {
      const range = this.sheet.getRangeOfRow(row);
      this.sheet.sheetRef.moveRows(range, this.archiveIndex);
    }
  }
}