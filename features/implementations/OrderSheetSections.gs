class OrderSheetSections extends Feature {
  constructor(sheet) {
    super(sheet, 'Order Sheet Sections');
    this.addResponseCapability(Event.onSidebarSubmit);
    this.ascendingMarker = 'ascending';
  }

  execute() {
    super.execute();
    const googleConfigArray = this.getGoogleConfigArray();
    const rangeSections = this.getSectionsSubRanges();
    for(const ranges of rangeSections) {
      ranges[0].sort(googleConfigArray);
    }
  }

  getSectionsSubRanges() {
    if(this.config.sections === SectionsCategory.DONE) {
      return this.sheet.getDoneSectionsSubRanges();
    }
    if(!this.config.sections === SectionsCategory.MAIN) {
      logString(`Section configuration property '` + this.config.sections + `' not recognized. Assuming 'main' section.`);
    }
    return this.sheet.getMainSectionsSubRanges();
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