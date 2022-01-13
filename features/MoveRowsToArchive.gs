class MoveRowsToArchive extends Feature {
  constructor(sheet) {
    super(sheet);
    this.name = 'Move Rows To Archive';
    this.addResponseCapability(Event.onSidebarSubmit);
    this.sidebarFeature = true;
  }

  execute() {
    super.execute();
    this.matchText = this.config.matchText;
    this.matchColumn = this.config.matchColumn.cardinalIndex;
    this.archiveIndex = this.sheet.getDoneSectionBeginRow();
    this.foundRows = [];
    this.findTextMatchingRows();
    this.sortFoundRows();
    this.moveRowsToArchive()
  }

  findTextMatchingRows() {
    const matchRanges = this.sheet.getMainSectionRange().createTextFinder(this.matchText).findAll();
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