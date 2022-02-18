class AlertSheetOnEdit extends Feature {
  constructor(sheet) {
    super(sheet, 'Alert Sheet On Edit');
    this.addResponseCapability(Event.onSheetEdit);
  }

  execute() {
    super.execute();
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
    const row = this.eventData.range.getRow();
    const rowValuesArray = this.sheet.getRow(row);
    this.rowValues = {};
    for(let i = 0; i < rowValuesArray.length; i++) {
      this.rowValues[zeroBasedIndexToColumn(i)] = rowValuesArray[i];
    }
  }

  isValidTriggerValue() {
    return this.eventData.value === this.config.triggerValue;
  }
}