class CollapseDoneSection extends Feature {
  constructor(sheet) {
    super(sheet, 'Collapse Done Section');
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
    const rangeConfig = [{
      beginRowOffset: this.config.numRowsToDisplay
    }];
    const range = this.sheet.getDoneSectionsSubRanges(rangeConfig)[0][0]
    range.shiftRowGroupDepth(1).collapseGroups();
  }
}