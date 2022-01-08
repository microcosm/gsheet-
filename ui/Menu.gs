class Menu {
  constructor(uiRef) {
    this.menuName = '⚙️' + config.gsheet.name;
    this.uiRef = uiRef;
  }

  onSpreadsheetOpen() {
    this.uiRef
      .createMenu(this.menuName)
      .addItem('Show Guidance', 'onShowGuidanceDialog')
      .addToUi();
  }

  onSheetChange(activeSheetName) {
    this.activeSheetName = activeSheetName;
    //Keeping this method here for testing, but so far it's not always reliably called
    //This bug is *also* getting per-sheet dynamic menus: https://issuetracker.google.com/issues/202989059
  }

  onShowGuidanceDialog() {
    const config = state.activeSheet.config.menu;
    this.uiRef.alert(config.guidance.title, config.guidance.message, this.uiRef.ButtonSet.OK);
  }
}