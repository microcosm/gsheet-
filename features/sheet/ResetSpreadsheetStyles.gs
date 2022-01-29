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
    if(this.isValidProperty(config, 'fontFamily' )) range.setFontFamily(config.fontFamily);
    if(this.isValidProperty(config, 'fontSize'   )) range.setFontSize  (config.fontSize);
    if(this.isValidProperty(config, 'fontColor'  )) range.setFontColor (config.fontColor);
    if(this.isValidProperty(config, 'background' )) range.setBackground(config.background);
    if(this.isValidProperty(config, 'border'     )) this.setBorders    ([config.border], range);
    if(this.isValidProperty(config, 'borders'    )) this.setBorders    (config.borders, range);
    if(this.isValidProperty(config, 'rowHeight'  )) this.sheet.sheetRef.setRowHeightsForced(range.getRow(), range.getNumRows(), config.rowHeight);
    if(this.isValidProperty(config, 'columnWidth')) this.sheet.sheetRef.setColumnWidths(range.getColumn(), range.getNumColumns(), config.columnWidth);
  }

  setRangeStyles(ranges, config) {
    for(let i = 0; i < ranges.length; i++) {
      const val = ranges[i];
      if(isArray(val)) this.setRangeStyles(val, config);
      else this.setRangeStyle(val, config[i % config.length]);
    }
  }

  setBorders(configs, range) {
    for(const config of configs) {
      range.setBorder(config.top, config.left, config.bottom, config.right, config.vertical, config.horizontal, config.color, borderStyles[config.style]);
    }
  }

  setLookups() {
    this.lookups = {
      titles:           { config:this.config.titles,           rangeGetter:'getTitlesSectionsSubRanges'       },
      titlesAboveBelow: { config:this.config.titlesAboveBelow, rangeGetter:'getTitlesAboveBelowRanges'        },
      hiddenValues:     { config:this.config.hiddenValues,     rangeGetter:'getHiddenValuesSectionsSubRanges' },
      headers:          { config:this.config.headers,          rangeGetter:'getHeaderSectionsSubRanges'       },
      main:             { config:this.config.contents,         rangeGetter:'getMainSectionsSubRanges'         },
      done:             { config:this.config.contents,         rangeGetter:'getDoneSectionsSubRanges'         },
      generic:          { config:this.config.contents,         rangeGetter:'getGenericSectionsSubRanges'      },
      underMain:        { config:this.config.underContents,    rangeGetter:'getUnderMainSectionsSubRanges'    },
      underDone:        { config:this.config.underContents,    rangeGetter:'getUnderDoneSectionsSubRanges'    },
      underGeneric:     { config:this.config.underContents,    rangeGetter:'getUnderGenericSectionsSubRanges' },
      rowsOutside:      { config:this.config.rowsOutside,      rangeGetter:'getOutsideRowsRanges'             },
      columnsOutside:   { config:this.config.columnsOutside,   rangeGetter:'getOutsideColumnsRanges'          }
    };
  }
}