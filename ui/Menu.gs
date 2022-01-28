class Menu {
  constructor(uiRef) {
    this.menuName = '⚙️ [' + state.spreadsheet.name + ']';
    this.uiRef = uiRef;
  }

  onSpreadsheetOpen() {
    this.uiRef
      .createMenu(this.menuName)
      .addItem('Show Sidebar', 'onShowSidebar')
      .addToUi();
  }
}