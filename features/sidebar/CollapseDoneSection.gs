class CollapseDoneSection extends Feature {
  constructor(sheet) {
    super(sheet, 'Collapse Done Section');
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
    this.sheet.getDataRange().shiftRowGroupDepth(-this.numRowGroupDepthsToDestroy);
  }

  createNewRowGroup() {
    this.sheet.sheetRef.setRowGroupControlPosition(SpreadsheetApp.GroupControlTogglePosition.BEFORE);
    const range = this.sheet.getDoneSectionRowsRange(this.config.numRowsToDisplay);
    range.shiftRowGroupDepth(1).collapseGroups();
  }
}