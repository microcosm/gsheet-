class AlertSheetOnEdit extends Feature {
  constructor(sheet) {
    super(sheet, 'Alert Sheet On Edit');
    this.addResponseCapability(Event.onSheetEdit);
  }

  execute() {
    super.execute();
    const ui = SpreadsheetApp.getUi();
    if(this.isValidTriggerColumn() && this.isValidTriggerValue()) {
      const message = this.config.getMessage(this.getDecisionColumns());
      if(message) ui.alert(message.title, message.text, ui.ButtonSet.OK);
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