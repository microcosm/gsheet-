class CopySheet extends Feature {
  constructor(sheet) {
    super(sheet, 'Copy Sheet');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onSheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onHourTimer);
    this.addResponseCapability(Event.onSidebarSubmit);
    this.temporaryOldSheetName = "Updating...";
    this.temporaryNewSheetName = "New Data...";
  }

  execute() {
    super.execute();
    this.sourceSheet = isProperty(this.config.sourceSheetName) ? state.spreadsheet.ref.getSheetByName(this.config.sourceSheetName) : this.sheet.sheetRef;
    this.destinationSpreadsheet = SpreadsheetApp.openById(this.config.destinationSpreadsheetID);
    this.oldDestinationSheet = this.destinationSpreadsheet.getSheetByName(this.config.destinationSheetName);
    this.newDestinationSheet = this.sourceSheet.copyTo(this.destinationSpreadsheet);
    this.newDestinationSheet.setName(this.temporaryNewSheetName);
    this.performTransformations();
    this.replaceOldSheet();
  }

  performTransformations() {
    if(isProperty(this.config.overwriteWithNonRichTextValues)) {
      this.config.overwriteWithNonRichTextValues.forEach(config => {
        this.overwriteWithNonRichTextValues(config);
      });
    }
    if(isProperty(this.config.clearDataValidations)) {
      this.config.clearDataValidations.forEach(config => {
        this.clearDataValidations(config);
      });
    }
    if(isProperty(this.config.setCellValue)) {
      this.config.setCellValue.forEach(config => {
        this.setCellValue(config);
      });
    }
  }

  replaceOldSheet() {
    this.oldDestinationSheet.setName(this.temporaryOldSheetName);
    this.newDestinationSheet.setName(this.config.destinationSheetName);
    this.destinationSpreadsheet.deleteSheet(this.oldDestinationSheet);
  }

  overwriteWithNonRichTextValues(config) {
    const ranges = this.getRanges(config);
    ranges.destination.setValues(ranges.source.getValues());
  }

  clearDataValidations(config) {
    const ranges = this.getRanges(config, false);
    ranges.destination.clearDataValidations();
  }

  setCellValue(config) {
    const range = this.newDestinationSheet.getRange(config.row.cardinalIndex, config.column.cardinalIndex, 1, 1);
    range.setValue(config.value);
  }

  getRanges(config, includeSource=true){
    const startRow = config.startRow.cardinalIndex;
    const startCol = config.column.cardinalIndex;
    const numRows = this.newDestinationSheet.getMaxRows() - startRow;
    return {
      source: includeSource ? this.sourceSheet.getRange(startRow, startCol, numRows, 1) : null,
      destination: this.newDestinationSheet.getRange(startRow, startCol, numRows, 1)
    };
  }
}