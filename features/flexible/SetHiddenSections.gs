class SetHiddenSections extends Feature {
  constructor(sheet) {
    super(sheet, 'Set Hidden Sections');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onHourTimer);
    this.addResponseCapability(Event.onSidebarSubmit);
    this.configVisible = false;
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
    const visible = this.getConfigVisible();
    const cell = range.getValues()[visible.x][visible.y];
    return cell.includes(visible.text);
  }

  getConfigVisible() {
    if(!this.configVisible) {
      this.configVisible = {
        x: this.config.visible.x,
        y: this.config.visible.y,
        text: this.config.visible.text === PropertyCommand.EVENT_DATA ? this.eventData.value : this.config.visible.text
      };
    }
    return this.configVisible;
  }
}