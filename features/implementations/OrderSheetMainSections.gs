class OrderSheetMainSections extends Feature {
  constructor(sheet) {
    super(sheet, 'Order Sheet Main Sections');
    this.addResponseCapability(Event.onSidebarSubmit);
    this.ascendingMarker = 'ascending';
  }

  execute() {
    super.execute();
    const googleConfigArray = this.getGoogleConfigArray();
    const mainRangeSections = this.sheet.getMainSectionsSubRanges();
    for(const ranges of mainRangeSections) {
      ranges[0].sort(googleConfigArray);
    }
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