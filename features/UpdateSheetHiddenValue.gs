class UpdateSheetHiddenValue extends Feature {
  constructor(sheet) {
    super(sheet);
    this.name = 'Update Sheet Hidden Value';
    this.addResponseCapability(Event.onSidebarSubmit);
    this.sidebarFeature = true;
  }

  execute() {
    super.execute();
    logString(JSON.stringify(this.getConfig()));
  }
}