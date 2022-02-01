class CollapseSection extends Feature {
  constructor(sheet) {
    super(sheet, 'Collapse Section');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onSidebarSubmit);
    this.numRowGroupDepthsToDestroy = 3;
  }

  execute() {
    super.execute();
    this.destroyAllExistingRowGroups();
    this.createNewRowGroup();
  }

  destroyAllExistingRowGroups() {
    this.sheet.getSheetRange().shiftRowGroupDepth(-this.numRowGroupDepthsToDestroy);
  }

  createNewRowGroup() {
    this.sheet.sheetRef.setRowGroupControlPosition(SpreadsheetApp.GroupControlTogglePosition.BEFORE);
    const sections = this.sheet.getContentSectionsSubRanges(this.config.section, [{
      beginRowOffset: this.config.numRowsToDisplay || 0
    }]);
    for(const section of sections) {
      const range = section[0];
      range.shiftRowGroupDepth(1).collapseGroups();
    }
  }
}