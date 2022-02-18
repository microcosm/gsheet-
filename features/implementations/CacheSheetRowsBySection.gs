class CacheSheetRowsBySection extends Feature {
  constructor(sheet) {
    super(sheet, 'Cache Sheet Rows By Section');
    this.addResponseCapability(Event.onSheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
  }

  execute() {
    super.execute();
    state.builder.buildScriptPropertiesState();
    const contentSectionValues = this.sheet.getContentSectionsValues(this.config.section);
    state.scriptProperties.setProperty(this.config.cacheKey, JSON.stringify(contentSectionValues));
  }
}