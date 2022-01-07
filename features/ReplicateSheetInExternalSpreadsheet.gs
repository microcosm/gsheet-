class ReplicateSheetInExternalSpreadsheet extends Feature {
  constructor(sheet) {
    super(sheet);
    this.featureName = 'Replicate Sheet In External Spreadsheet';
    this.addResponseCapability(Event.onSpreadsheetEdit);
  }

  execute() {
    logFeatureExecution(this.featureName);
    const sourceSheet = this.sheet.sheetRef;
    const destinationSpreadsheet = SpreadsheetApp.openById(this.sheet.config.destinationSpreadsheetID);
    const destinationSheet = destinationSpreadsheet.getSheetByName(this.sheet.config.destinationSheetName);
    this.cloneAllWithRichTextValues(sourceSheet, destinationSheet);
    this.overwriteSingleColumnWithNonRichTextValues(sourceSheet, destinationSheet, this.sheet.config.nonRichTextColumnOverwrite);
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