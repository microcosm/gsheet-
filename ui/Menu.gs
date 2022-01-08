class Menu {
  constructor(uiRef) {
    this.menuName = '⚙️ [' + config.gsheet.name + ']';
    this.uiRef = uiRef;
  }

  onSpreadsheetOpen() {
    this.uiRef
      .createMenu(this.menuName)
      .addItem('Show Sidebar', 'onShowSidebar')
      .addToUi();
  }

  onSheetChange(activeSheetName) {
    this.activeSheetName = activeSheetName;
    //Keeping this method here for testing, but so far it's not always reliably called
    //This bug is *also* getting per-sheet dynamic menus: https://issuetracker.google.com/issues/202989059
  }
}