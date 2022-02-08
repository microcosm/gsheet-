class CopySheetToExternalSpreadsheet extends Feature {
  constructor(sheet) {
    super(sheet, 'Copy Sheet To External Spreadsheet');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onSpreadsheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onHourTimer);
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    const sourceSheet = this.sheet.sheetRef;
    const destinationSpreadsheet = SpreadsheetApp.openById(this.config.destinationSpreadsheetID);
    const destinationSheet = destinationSpreadsheet.getSheetByName(this.config.destinationSheetName);
    this.cloneAllWithRichTextValues(sourceSheet, destinationSheet);
    this.overwriteSingleColumnWithNonRichTextValues(sourceSheet, destinationSheet, this.config.nonRichTextColumnOverwrite);
  }

  cloneAllWithRichTextValues(sourceSheet, destinationSheet) {
    const sourceRange = sourceSheet.getRange(1, 1, sourceSheet.getMaxRows(), sourceSheet.getMaxColumns());
    const destinationRange = destinationSheet.getRange(1, 1, sourceRange.getNumRows(), sourceRange.getNumColumns());
    destinationRange.clearContent();
    destinationRange.setRichTextValues(sourceRange.getRichTextValues());
  }

  overwriteSingleColumnWithNonRichTextValues(sourceSheet, destinationSheet, config) {
    const startRow = config.startRow.cardinalIndex;
    const startCol = config.column.cardinalIndex;
    const numRows = sourceSheet.getMaxRows() - startRow;
    const sourceRange = sourceSheet.getRange(startRow, startCol, numRows, 1);
    const destinationRange = destinationSheet.getRange(startRow, startCol, numRows, 1);
    destinationRange.setValues(sourceRange.getValues());
  }
}