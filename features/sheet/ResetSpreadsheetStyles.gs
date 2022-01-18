class ResetSpreadsheetStyles extends Feature {
  constructor(sheet) {
    super(sheet, 'Reset Spreadsheet Styles', featureInitiators.sheet);
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onSpreadsheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
  }

  execute() {
    super.execute();
    this.setLookups();

    for(const section of this.config.sections) {
      const lookup = this.lookups[section];
      const range = this.sheet[lookup.rangeGetter]();
      this[lookup.styleSetter](range, lookup.config);
      this[lookup.heightSetter](range, lookup.config);
    }
  }

  setMultipleRangeStyles(ranges, config) {
    for(const range of ranges) {
      this.setSingleRangeStyle(range, config);
    }
  }

  setSingleRangeStyle(range, config) {
    if(config.hasOwnProperty('fontFamily')) range.setFontFamily(config.fontFamily);
    if(config.hasOwnProperty('fontSize'))   range.setFontSize  (config.fontSize);
    if(config.hasOwnProperty('fontColor'))  range.setFontColor (config.fontColor);
    if(config.hasOwnProperty('border'))     range.setBorder    (config.border.top, config.border.left, config.border.bottom, config.border.right, config.border.vertical, config.border.horizontal, config.border.color, borderStyles[config.border.style]);
  }

  setMultipleRangeHeights(ranges, config) {
    for(const range of ranges) {
      this.setSingleRangeHeights(range, config)
    }
  }

  setSingleRangeHeights(range, config) {
    if(config.hasOwnProperty('rowHeight')) this.sheet.sheetRef.setRowHeightsForced(range.getRow(), range.getNumRows(), config.rowHeight);
  }

  setLookups() {
    this.lookups = {
      titles:           this.getLookup(this.config.titles,           'getTitleSectionRanges',           'setMultipleRangeStyles', 'setMultipleRangeHeights'),
      titlesAboveBelow: this.getLookup(this.config.titlesAboveBelow, 'getTitleAboveBelowSectionRanges', 'setMultipleRangeStyles', 'setMultipleRangeHeights'),
      hiddenValues:     this.getLookup(this.config.hiddenValues,     'getHiddenValuesRowRange',         'setSingleRangeStyle',    'setSingleRangeHeights'  ),
      headers:          this.getLookup(this.config.headers,          'getHeaderSectionRanges',          'setMultipleRangeStyles', 'setMultipleRangeHeights'),
      main:             this.getLookup(this.config.contents,         'getMainSectionRange',             'setSingleRangeStyle',    'setSingleRangeHeights'  ),
      done:             this.getLookup(this.config.contents,         'getDoneSectionRange',             'setSingleRangeStyle',    'setSingleRangeHeights'  ),
      underContents:    this.getLookup(this.config.underContents,    'getUnderContentSectionRanges',    'setMultipleRangeStyles', 'setMultipleRangeHeights')
    };
  }

  getLookup(config, rangeGetter, styleSetter, heightSetter) {
    return {
      config:       config,
      rangeGetter:  rangeGetter,
      styleSetter:  styleSetter,
      heightSetter: heightSetter
    };
  }
}