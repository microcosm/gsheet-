class UserInterface {
  constructor() {
    this.userPropertyKey_ActiveSheetName = 'UserInterface.activeSheetName';
    this.uiRef = SpreadsheetApp.getUi();
    this.menu = new Menu(this.uiRef);
    this.sidebar = new Sidebar(this.uiRef);
  }

  onSpreadsheetOpen() {
    this.saveActiveSheetName();
    logString('Spreadsheet opened with sheet ' + this.activeSheetName);
    this.menu.onSpreadsheetOpen();
  }

  onSelectionChange() {
    this.detectSheetChange();
  }

  onSheetChange() {
    logString('Sheet changed to ' + this.activeSheetName);
    this.menu.onSheetChange(this.activeSheetName);
  }

  saveActiveSheetName(sheetName=false) {
    this.activeSheetName = sheetName || state.spreadsheet.getActiveSheet().getName();
    state.userProperties.setProperty(this.userPropertyKey_ActiveSheetName, this.activeSheetName);
  }

  detectSheetChange() {
    var currentActiveSheetName = state.spreadsheet.getActiveSheet().getName();
    var lastKnownActiveSheetName = state.userProperties.getProperty(this.userPropertyKey_ActiveSheetName);

    if(currentActiveSheetName !== lastKnownActiveSheetName) {
      this.saveActiveSheetName(currentActiveSheetName);
      this.onSheetChange();
    }
  }
}