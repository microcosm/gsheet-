const propertyOverrides = {
  IGNORE: 'ignore'
};

class ResetSpreadsheetStyles extends Feature {
  constructor(sheet) {
    super(sheet, 'Reset Spreadsheet Styles');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onSpreadsheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    this.setLookups();

    for(const section of this.config.sections) {
      const lookup = this.lookups[section];
      const rangeValue = lookup.sendConfigToRangeGetter ? this.sheet[lookup.rangeGetter](lookup.config) : this.sheet[lookup.rangeGetter]();
      this[lookup.styleSetter](rangeValue, lookup.config);
      if(lookup.heightSetter) this[lookup.heightSetter](rangeValue, lookup.config);
    }
  }

  isValidProperty(config, propertyName) {
    return config.hasOwnProperty(propertyName) && config[propertyName] != propertyOverrides.IGNORE;
  }

  //When the range value is a single, uniformly-styled range
  setSingleRangeStyle(range, config) {
    if(this.isValidProperty(config, 'fontFamily')) range.setFontFamily(config.fontFamily);
    if(this.isValidProperty(config, 'fontSize'  )) range.setFontSize  (config.fontSize);
    if(this.isValidProperty(config, 'fontColor' )) range.setFontColor (config.fontColor);
    if(this.isValidProperty(config, 'background')) range.setBackground(config.background);
    if(this.isValidProperty(config, 'border'    )) range.setBorder    (config.border.top, config.border.left, config.border.bottom, config.border.right, config.border.vertical, config.border.horizontal, config.border.color, borderStyles[config.border.style]);
    if(this.isValidProperty(config, 'rowHeight')) this.sheet.sheetRef.setRowHeightsForced(range.getRow(), range.getNumRows(), config.rowHeight);
  }

  //When the range value is multiple, uniformly-styled ranges
  setMultipleRangeStyles(ranges, config) {
    for(const range of ranges) {
      this.setSingleRangeStyle(range, config);
    }
  }

  //When the range value is vertically divided into differently styled sub-ranges
  setSubRangeStylesDifferently(subRanges, config) {
    for(let i = 0; i < subRanges.length; i++) {
      this.setSingleRangeStyle(subRanges[i], config[i]);
    }
  }

  //When the range value is multiple, uniformly-styled ranges which are vertically divided into differently styled sub-ranges
  setMultipleSubRangeStylesDifferently(multipleSubRanges, config) {
    for(const subRange of multipleSubRanges) {
      this.setSubRangeStylesDifferently(subRange, config);
    }
  }

  setLookups() {
    this.lookups = {
      titlesSubRanges:  this.getLookup(this.config.titlesSubRanges,   'getTitlesSubRanges',        'setMultipleSubRangeStylesDifferently'),
      titlesAboveBelow: this.getLookup(this.config.titlesAboveBelow,  'getTitlesAboveBelowRanges', 'setMultipleRangeStyles'),
      hiddenValues:     this.getLookup(this.config.hiddenValues,      'getHiddenValuesRowRange',   'setSingleRangeStyle'),
      headers:          this.getLookup(this.config.headers,           'getHeaderSectionRanges',    'setMultipleRangeStyles'),
      main:             this.getLookup(this.config.contents,          'getMainSectionRange',       'setSingleRangeStyle'),
      done:             this.getLookup(this.config.contents,          'getDoneSectionRange',       'setSingleRangeStyle'),
      mainSubRanges:    this.getLookup(this.config.contentsSubRanges, 'getMainSubRanges',          'setSubRangeStylesDifferently'),
      doneSubRanges:    this.getLookup(this.config.contentsSubRanges, 'getDoneSubRanges',          'setSubRangeStylesDifferently'),
      underMain:        this.getLookup(this.config.underContents,     'getUnderMainSectionRange',  'setSingleRangeStyle'),
      underDone:        this.getLookup(this.config.underContents,     'getUnderDoneSectionRange',  'setSingleRangeStyle'),
      outsides:         this.getLookup(this.config.outsides,          'getOutsideColumnsRanges',   'setMultipleRangeStyles')
    };
  }

  getLookup(config, rangeGetter, styleSetter) {
    return {
      config:                  config,
      rangeGetter:             rangeGetter,
      styleSetter:             styleSetter,
      sendConfigToRangeGetter: styleSetter === 'setSubRangeStylesDifferently' || styleSetter === 'setMultipleSubRangeStylesDifferently'
    };
  }
}