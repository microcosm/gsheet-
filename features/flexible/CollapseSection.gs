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
    this.initialize();
    this.destroyAllExistingRowGroups();
    this.createNewRowGroup();
  }

  initialize() {
    this.sheet.sheetRef.setRowGroupControlPosition(SpreadsheetApp.GroupControlTogglePosition.BEFORE);
    this.hasExclusion = !!(this.config.exclusion);
  }

  destroyAllExistingRowGroups() {
    this.sheet.getSheetRange().shiftRowGroupDepth(-this.numRowGroupDepthsToDestroy);
  }

  createNewRowGroup() {
    const sections = this.sheet.getContentSectionsSubRanges(this.config.section, [{
      beginRowOffset: this.config.numRowsToDisplay || 0
    }]);

    for(const section of sections) {
      const range = section[0];
      range.shiftRowGroupDepth(1);
      if(!this.getIsExcluded(range)) range.collapseGroups();
    }
  }

  getIsExcluded(range) {
    if(!this.hasExclusion) return false;
    return range.getValues()[this.config.exclusion.x][this.config.exclusion.y].includes(this.config.exclusion.text);
  }
}