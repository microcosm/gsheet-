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
}