class AlertSheetOnEdit extends Feature {
  constructor(sheet) {
    super(sheet, 'Alert Sheet On Edit');
    this.addResponseCapability(Event.onSheetEdit);
  }

  execute() {
    super.execute();
    state.builder.buildScriptPropertiesState();
    if(this.isValidTriggerValue()) {
      this.setRowValues();
      this.message = this.config.getMessage(this.rowValues);
      if(this.message) {
        this.showDialog();
      }
    }
  }

  showDialog() {
    this.isPrompt = isProperty(this.config.buttonSet);
    const ui = SpreadsheetApp.getUi();
    const buttonSet = SpreadsheetApp.getUi().ButtonSet[this.config.buttonSet] || ui.ButtonSet.OK;
    const response = ui.alert(this.message.title, this.message.text, buttonSet);
    if(this.isPrompt && response == ui.Button.YES) this.config.respondToPrompt(ui.Button, this.rowValues);
  }

  setRowValues() {
    this.row = this.eventData.range.getRow();
    if(!this.setRowValuesFromCache()) this.setRowValuesFromSheet();
  }

  setRowValuesFromCache() {
    const fromCache = state.scriptProperties.getProperty(this.config.cacheKey);
    if(!isString(fromCache)) return false;
    logString('Reading sheet values from cache');
    this.rowValues = JSON.parse(fromCache);
  }

  setRowValuesFromSheet() {
    const rowValuesArray = this.sheet.getRow(this.row);
    this.rowValues = {};
    for(let i = 0; i < rowValuesArray.length; i++) {
      this.rowValues[zeroBasedIndexToColumn(i)] = rowValuesArray[i];
    }
  }

  isValidTriggerValue() {
    return this.eventData.value === this.config.triggerValue;
  }
}