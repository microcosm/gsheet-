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
    const googleConfigArray = this.getGoogleConfigArray();
    this.sheet.getMainSectionRange().sort(googleConfigArray);
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
}