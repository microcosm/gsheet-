class Feature {
  constructor() {
    this.sheets = [];
  }

  registerSheet(sheet) {
    this.sheets.push(sheet);
  }

  isRegisteredFor(sheetName, column) {
    var found = false;
    this.sheets.forEach((sheet) => {
      if(sheet.name === sheetName && (!sheet.hasTriggerColumns || sheet.triggerColumns.includes(column))) {
        found = true;
      }
    });
    return found;
  }
}