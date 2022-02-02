class CollapseSections extends Feature {
  constructor(sheet) {
    super(sheet, 'Collapse Sections');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onHourTimer);
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
    this.hasUncollapse = !!(this.config.uncollapse);
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
      if(this.getIsUncollapsed(range)) {
        range.expandGroups();
      } else {
        range.collapseGroups();
      }
    }
  }

  getIsUncollapsed(range) {
    if(!this.hasUncollapse) return false;
    const uncollapseValueCheckCell = range.getValues()[this.config.uncollapse.x][this.config.uncollapse.y];
    return uncollapseValueCheckCell.includes(this.config.uncollapse.text);
  }
}