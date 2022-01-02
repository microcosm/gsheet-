class Feature_ReplicateSheetInExternalSpreadsheet extends Feature {
  constructor() {
    super();
    this.featureName = 'Replicate Sheet In External Spreadsheet';
  }

  execute() {
    logFeatureExecution(this.featureName);
    this.sheets.forEach((sheet) => {
      var sourceSheet = sheet.sheetRef;
      var destinationSpreadsheet = SpreadsheetApp.openById(sheet.config.destinationSpreadsheetID);
      var destinationSheet = destinationSpreadsheet.getSheetByName(sheet.config.destinationSheetName);

      this.cloneAllWithRichTextValues(sourceSheet, destinationSheet);
      this.overwriteSingleColumnWithNonRichTextValues(sourceSheet, destinationSheet, sheet.config.nonRichTextColumnOverwrite.startRow, sheet.config.nonRichTextColumnOverwrite.column);
    });
  }

  cloneAllWithRichTextValues(sourceSheet, destinationSheet) {
    var sourceRange = sourceSheet.getRange(1, 1, sourceSheet.getMaxRows(), sourceSheet.getMaxColumns());
    var destinationRange = destinationSheet.getRange(1, 1, sourceRange.getNumRows(), sourceRange.getNumColumns());
    destinationRange.clearContent();
    destinationRange.setRichTextValues(sourceRange.getRichTextValues());
  }

  overwriteSingleColumnWithNonRichTextValues(sourceSheet, destinationSheet, nonRichTextStartRow, nonRichTextCol) {
    var numRows = sourceSheet.getMaxRows() - nonRichTextStartRow;
    var sourceRange = sourceSheet.getRange(nonRichTextStartRow, nonRichTextCol, numRows, 1);
    var destinationRange = destinationSheet.getRange(nonRichTextStartRow, nonRichTextCol, numRows, 1);
    destinationRange.setValues(sourceRange.getValues());
  }
}