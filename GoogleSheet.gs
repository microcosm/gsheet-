class GoogleSheet {
  constructor(sheetConfig) {
    this.config = sheetConfig;
    this.name = sheetConfig.name;
    this.range = sheetConfig.range || 'A:Z';
    this.sheetRef = state.spreadsheet.getSheetByName(this.name);
    this.validate();
    this.values = this.sheetRef.getRange(this.range).getValues();
  }

  validate() {
    if(this.sheetRef == null) {
      throw 'Cannot establish access to sheet "' + this.name + '" - check config values.';
    }
  }
}

class ValuesSheet extends GoogleSheet {
  constructor(sheetConfig) {
    super(sheetConfig);
  }

  getValuesOf(columnID) {
    return this.values.map((value, index) => { return value[columnID]; });
  }
}

class ScriptSheet extends GoogleSheet {
  constructor(sheetConfig) {
    super(sheetConfig);
    if(sheetConfig.hasOwnProperty('id')) this.id = sheetConfig.id;
    this.scriptResponsiveWidgetNames = sheetConfig.scriptResponsiveWidgetNames;
    this.assignWidgets();
    this.assignTriggerCols();
    this.getValues();
  }

  assignWidgets() {
    if(this.config.hasOwnProperty('widgets')) {

      this.widgets = this.config.widgets;

      Object.keys(this.widgets).forEach((key) => {
        const widget = this.widgets[key];
        if(widget.hasOwnProperty('name') && widget.name.hasOwnProperty('column')) {
          this.getArrayIndex(widget.name.column);
        }
        if(widget.hasOwnProperty('columns')) {
          Object.keys(widget.columns).forEach((key) => {
            this.getArrayIndex(widget.columns[key]);
          });
        }
      });
    }
  }//need hasWidgets... and standardized access approach...

  assignTriggerCols() {
    this.hasTriggerCols = false;
    if(this.config.hasOwnProperty('triggerCols')) {
      this.triggerCols = this.config.triggerCols;
      this.hasTriggerCols = true;
    }
  }

  getValues() {
    this.values = this.sheetRef.getDataRange().getValues();
  }

  getArrayIndex(columnIdentifier){
    if(typeof columnIdentifier === 'string') {
      return (columnIdentifier.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0)) - 1;
    } else if(typeof columnIdentifier === 'number') {
      return columnIdentifier;
    }
    logString('Unrecognized column identifier from config: ' + columnIdentifier);
    return -1;
  }
}