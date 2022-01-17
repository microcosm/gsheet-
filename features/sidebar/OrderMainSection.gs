class OrderMainSection extends Feature {
  constructor(sheet) {
    super(sheet, 'Order Main Section', featureInitiators.sidebar);
    this.addResponseCapability(Event.onSidebarSubmit);
    this.ascendingMarker = 'ascending';
  }

  execute() {
    super.execute();
    const googleConfigArray = this.getGoogleConfigArray();
    this.sheet.getMainSectionRowsRange().sort(googleConfigArray);
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