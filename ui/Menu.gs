class Menu {
  constructor() {
  	this.userPropertyKey = 'MenuUpdater_activeSheet';
    this.menu = SpreadsheetApp.getUi().createMenu(config.gsheet.name);
  }

  saveActiveSheet(sheetName=false) {
    const currentActiveSheet = sheetName ? sheetName : state.spreadsheet.getActiveSheet().getName();
    state.userProperties.setProperty(this.userPropertyKey, currentActiveSheet);
  }

  checkForSheetChange() {
    var currentActiveSheetName = state.spreadsheet.getActiveSheet().getName();
    var lastKnownActiveSheetName = state.userProperties.getProperty(this.userPropertyKey);

    if (currentActiveSheetName !== lastKnownActiveSheetName) {
      this.saveActiveSheet(currentActiveSheetName);
      this.onSheetChange();
    }
  }

  onSpreadsheetOpen() {
    saveActiveSheet();
  }

  onSheetChange() {
    console.log('SHEET CHANGED TO ' + state.userProperties.getProperty(this.userPropertyKey));
  }
}