class AlertSheetOnEdit extends Feature {
  constructor(sheet) {
    super(sheet, 'Alert Sheet On Edit');
    this.addResponseCapability(Event.onSheetEdit);
  }

  execute() {
    super.execute();
    if(this.isValidTriggerColumn() && this.isValidTriggerValue()) {
      this.message = this.config.getMessage(this.getDecisionColumns());
      if(this.message) {
        this.showDialog();
      }
    }
  }

  showDialog() {
    const ui = SpreadsheetApp.getUi();
    const buttonSet = SpreadsheetApp.getUi().ButtonSet[this.config.buttonSet] || ui.ButtonSet.OK;
    const response = ui.alert(this.message.title, this.message.text, buttonSet);
    if (response == ui.Button.YES) {
      Logger.log('The user clicked "Yes."');
    } else {
      Logger.log('The user clicked "No" or the dialog\'s close button.');
    }
  }

  getDecisionColumns() {
    const row = this.eventData.range.getRow();
    const decisionColumns = {};
    const numCols = this.config.decisionColumns.cardinalIndices;
    for(let i = 0; i < numCols; i++) {
      const columnCardinalIndex = this.config.decisionColumns.cardinalIndices[i];
      const columnAsConfig = this.config.decisionColumns.asConfig[i];
      decisionColumns[columnAsConfig] = this.sheet.getValue(row, columnCardinalIndex);
    }
    return decisionColumns;
  }

  isValidTriggerColumn() {
    return this.eventData.range.getColumn() === this.config.triggerColumn.cardinalIndex;
  }

  isValidTriggerValue() {
    return this.eventData.value === this.config.triggerValue;
  }
}