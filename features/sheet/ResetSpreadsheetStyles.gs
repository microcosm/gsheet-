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
      const ranges = toArray(this.sheet[lookup.rangeGetter](lookup.config));
      this.setRangeStyles(ranges, lookup.config);
    }
  }

  isValidProperty(config, propertyName) {
    return config.hasOwnProperty(propertyName) && config[propertyName] != propertyOverrides.IGNORE;
  }

  setRangeStyle(range, config) {
    if(this.isValidProperty(config, 'fontFamily')) range.setFontFamily(config.fontFamily);
    if(this.isValidProperty(config, 'fontSize'  )) range.setFontSize  (config.fontSize);
    if(this.isValidProperty(config, 'fontColor' )) range.setFontColor (config.fontColor);
    if(this.isValidProperty(config, 'background')) range.setBackground(config.background);
    if(this.isValidProperty(config, 'border'    )) range.setBorder    (config.border.top, config.border.left, config.border.bottom, config.border.right, config.border.vertical, config.border.horizontal, config.border.color, borderStyles[config.border.style]);
    if(this.isValidProperty(config, 'rowHeight')) this.sheet.sheetRef.setRowHeightsForced(range.getRow(), range.getNumRows(), config.rowHeight);
  }

  setRangeStyles(ranges, config) {
    for(let i = 0; i < ranges.length; i++) {
      const val = ranges[i];
      if(isArray(val)) this.setRangeStyles(val, config);
      else this.setRangeStyle(val, config[i % config.length]);
    }
  }

  setLookups() {
    this.lookups = {
      titles:           { config:this.config.titles        ,   rangeGetter:'getTitlesSubRanges'        },
      titlesAboveBelow: { config:this.config.titlesAboveBelow, rangeGetter:'getTitlesAboveBelowRanges' },
      hiddenValues:     { config:this.config.hiddenValues,     rangeGetter:'getHiddenValuesSubRanges'  },
      headers:          { config:this.config.headers,          rangeGetter:'getHeaderSubRanges'        },
      main:             { config:this.config.contents,         rangeGetter:'getMainSubRanges'          },
      done:             { config:this.config.contents,         rangeGetter:'getDoneSubRanges'          },
      underMain:        { config:this.config.underContents,    rangeGetter:'getUnderMainSubRanges'     },
      underDone:        { config:this.config.underContents,    rangeGetter:'getUnderDoneSubRanges'     },
      outsides:         { config:this.config.outsides,         rangeGetter:'getOutsideColumnsRanges'   }
    };
  }
}