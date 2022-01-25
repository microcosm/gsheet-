const propertyOverrides = {
  IGNORE: 'ignore'
};

class ResetSpreadsheetStyles extends Feature {
  constructor(sheet) {
    super(sheet, 'Reset Spreadsheet Styles');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onSpreadsheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
  }

  execute() {
    super.execute();
    this.setLookups();

    for(const section of this.config.sections) {
      const lookup = this.lookups[section];
      const range = lookup.sendConfigToRangeGetter ? this.sheet[lookup.rangeGetter](lookup.config) : this.sheet[lookup.rangeGetter]();
      this[lookup.styleSetter](range, lookup.config);
      if(lookup.heightSetter) this[lookup.heightSetter](range, lookup.config);
    }
  }

  isValidProperty(config, propertyName) {
    return config.hasOwnProperty(propertyName) && config[propertyName] != propertyOverrides.IGNORE;
  }

  setMultipleRangeStyles(ranges, config) {
    for(const range of ranges) {
      this.setSingleRangeStyle(range, config);
    }
  }

  setMultipleRangeStylesDifferently(ranges, config) {
    for(let i = 0; i < ranges.length; i++) {
      this.setSingleRangeStyle(ranges[i], config[i]);
    }
  }

  setSingleRangeStyle(range, config) {
    if(this.isValidProperty(config, 'fontFamily')) range.setFontFamily(config.fontFamily);
    if(this.isValidProperty(config, 'fontSize'  )) range.setFontSize  (config.fontSize);
    if(this.isValidProperty(config, 'fontColor' )) range.setFontColor (config.fontColor);
    if(this.isValidProperty(config, 'border'    )) range.setBorder    (config.border.top, config.border.left, config.border.bottom, config.border.right, config.border.vertical, config.border.horizontal, config.border.color, borderStyles[config.border.style]);
  }

  setMultipleRangeHeights(ranges, config) {
    for(const range of ranges) {
      this.setSingleRangeHeights(range, config)
    }
  }

  setSingleRangeHeights(range, config) {
    if(this.isValidProperty(config, 'rowHeight')) this.sheet.sheetRef.setRowHeightsForced(range.getRow(), range.getNumRows(), config.rowHeight);
  }

  setLookups() {
    this.lookups = {
      titles:           this.getLookup(this.config.titles,            'getTitleSectionRanges',           'setMultipleRangeStyles',           'setMultipleRangeHeights'),
      titlesAboveBelow: this.getLookup(this.config.titlesAboveBelow,  'getTitleAboveBelowSectionRanges', 'setMultipleRangeStyles',           'setMultipleRangeHeights'),
      hiddenValues:     this.getLookup(this.config.hiddenValues,      'getHiddenValuesRowRange',         'setSingleRangeStyle',              'setSingleRangeHeights'  ),
      headers:          this.getLookup(this.config.headers,           'getHeaderSectionRanges',          'setMultipleRangeStyles',           'setMultipleRangeHeights'),
      main:             this.getLookup(this.config.contents,          'getMainSectionRange',             'setSingleRangeStyle',              'setSingleRangeHeights'  ),
      done:             this.getLookup(this.config.contents,          'getDoneSectionRange',             'setSingleRangeStyle',              'setSingleRangeHeights'  ),
      mainSubRanges:    this.getLookup(this.config.contentsSubRanges, 'getMainSubRanges',                'setMultipleRangeStylesDifferently'),
      doneSubRanges:    this.getLookup(this.config.contentsSubRanges, 'getDoneSubRanges',                'setMultipleRangeStylesDifferently'),
      underMain:        this.getLookup(this.config.underContents,     'getUnderMainSectionRange',        'setSingleRangeStyle',               'setSingleRangeHeights' ),
      underDone:        this.getLookup(this.config.underContents,     'getUnderDoneSectionRange',        'setSingleRangeStyle',               'setSingleRangeHeights' )
    };
  }

  getLookup(config, rangeGetter, styleSetter, heightSetter=false) {
    return {
      config:                  config,
      rangeGetter:             rangeGetter,
      styleSetter:             styleSetter,
      heightSetter:            heightSetter,
      sendConfigToRangeGetter: styleSetter === 'setMultipleRangeStylesDifferently'
    };
  }
}