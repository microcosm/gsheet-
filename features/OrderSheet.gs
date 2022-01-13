/* EXAMPLE CONFIG
orderSheet: {
  by {
    timing: [{ column: 'D', direction: 'ascending' }, { column: 'B', direction 'ascending' }],
    workStream: [{ column: 'B', direction: 'ascending' }, { column: 'D', direction 'ascending' }]
  }
}*/

class OrderSheet extends Feature {
  constructor(sheet) {
    super(sheet);
    this.name = 'Order Sheet';
    this.addResponseCapability(Event.onSidebarSubmit);
    this.sidebarFeature = true;
    this.ascendingMarker = 'ascending';
  }

  execute() {
    super.execute();
    this.updateRange(this.getGoogleConfigArray());
  }

  getGoogleConfigArray() {
    const sortConfigArray = this.config.by[toCamelCase(this.eventData.value)];
    let googleConfigArray = [];
    for(const sortConfigItem of sortConfigArray) {
      googleConfigArray.push({
        column: sortConfigItem.column.cardinalIndex,
        ascending: sortConfigItem.direction === this.ascendingMarker
      });
    }
    return googleConfigArray;
  }

  updateRange(googleConfigArray) {
    const startRow = this.sheet.sheetRef.getFrozenRows() + 1;
    const startColumn = 1;
    const numRows = this.sheet.sheetRef.getMaxRows() - startRow;
    const numColumns = this.sheet.sheetRef.getMaxColumns();
    this.sheet.sheetRef.getRange(startRow, startColumn, numRows, numColumns).sort(googleConfigArray);
  }
}