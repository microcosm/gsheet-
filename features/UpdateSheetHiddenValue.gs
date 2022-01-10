class UpdateSheetHiddenValue extends Feature {
  constructor(sheet) {
    super(sheet);
    this.name = 'Update Sheet Hidden Value';
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    logString('TEST');
  }
}