class SetHiddenSections extends Feature {
  constructor(sheet) {
    super(sheet, 'Set Hidden Sections');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onHourTimer);
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    this.initialize();
    this.hideAndShow();
  }

  initialize() {
    this.hasVisible = !!(this.config.visible);
    this.startRowOffset = this.config.startRowOffset || 0;
  }

  hideAndShow() {
    const sections = this.sheet.getContentSectionsSubRanges(this.config.section);

    for(const section of sections) {
      const range = section[0];
      const row = range.getRow() + this.startRowOffset;
      const numRows = range.getNumRows() - this.startRowOffset;

      if(this.getIsVisible(range)) {
        this.sheet.sheetRef.showRows(row, numRows);
      } else {
        this.sheet.sheetRef.hideRows(row, numRows);
      }
    }
  }

  getIsVisible(range) {
    if(!this.hasVisible) return false;
    const cell = range.getValues()[this.config.visible.x][this.config.visible.y];
    return cell.includes(this.config.visible.text);
  }
}