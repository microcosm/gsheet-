class SetSheetStyles extends Feature {
  constructor(sheet) {
    super(sheet, 'Set Sheet Styles');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onSpreadsheetEdit);
    this.addResponseCapability(Event.onOvernightTimer);
    this.addResponseCapability(Event.onHourTimer);
    this.addResponseCapability(Event.onSidebarSubmit);
  }

  execute() {
    super.execute();
    this.styles = this.config.styles;
    this.setLookups();
    for(const section of this.styles.sections) {
      const lookup = this.lookups[section];
      const ranges = toArray(this.sheet[lookup.rangeGetter](lookup.styles));
      this.setRangeStyles(ranges, lookup.styles);
    }
  }

  isValidProperty(styles, propertyName) {
    return styles.hasOwnProperty(propertyName) && styles[propertyName] != PropertyCommand.IGNORE;
  }

  setRangeStyle(range, styles) {
    if(this.isValidProperty(styles, 'fontFamily' )) range.setFontFamily(styles.fontFamily);
    if(this.isValidProperty(styles, 'fontSize'   )) range.setFontSize  (styles.fontSize);
    if(this.isValidProperty(styles, 'fontColor'  )) range.setFontColor (styles.fontColor);
    if(this.isValidProperty(styles, 'background' )) range.setBackground(styles.background);
    if(this.isValidProperty(styles, 'border'     )) this.setBorders    ([styles.border], range);
    if(this.isValidProperty(styles, 'borders'    )) this.setBorders    (styles.borders, range);
    if(this.isValidProperty(styles, 'rowHeight'  )) this.sheet.sheetRef.setRowHeightsForced(range.getRow(), range.getNumRows(), styles.rowHeight);
    if(this.isValidProperty(styles, 'columnWidth')) this.sheet.sheetRef.setColumnWidths(range.getColumn(), range.getNumColumns(), styles.columnWidth);
  }

  setRangeStyles(ranges, styles) {
    for(let i = 0; i < ranges.length; i++) {
      const val = ranges[i];
      if(isArray(val)) this.setRangeStyles(val, styles);
      else this.setRangeStyle(val, styles[i % styles.length]);
    }
  }

  setBorders(borders, range) {
    for(const border of borders) {
      range.setBorder(border.top, border.left, border.bottom, border.right, border.vertical, border.horizontal, border.color, BorderStyle[border.style]);
    }
  }

  setLookups() {
    this.lookups = {
      titles:           { styles:this.styles.titles,           rangeGetter:'getTitlesSectionsSubRanges'       },
      titlesAboveBelow: { styles:this.styles.titlesAboveBelow, rangeGetter:'getTitlesAboveBelowRanges'        },
      hiddenValues:     { styles:this.styles.hiddenValues,     rangeGetter:'getHiddenValuesSectionsSubRanges' },
      headers:          { styles:this.styles.headers,          rangeGetter:'getHeaderSectionsSubRanges'       },
      main:             { styles:this.styles.contents,         rangeGetter:'getMainSectionsSubRanges'         },
      done:             { styles:this.styles.contents,         rangeGetter:'getDoneSectionsSubRanges'         },
      generic:          { styles:this.styles.contents,         rangeGetter:'getGenericSectionsSubRanges'      },
      underMain:        { styles:this.styles.underContents,    rangeGetter:'getUnderMainSectionsSubRanges'    },
      underDone:        { styles:this.styles.underContents,    rangeGetter:'getUnderDoneSectionsSubRanges'    },
      underGeneric:     { styles:this.styles.underContents,    rangeGetter:'getUnderGenericSectionsSubRanges' },
      rowsOutside:      { styles:this.styles.rowsOutside,      rangeGetter:'getOutsideRowsRanges'             },
      columnsOutside:   { styles:this.styles.columnsOutside,   rangeGetter:'getOutsideColumnsRanges'          },
      matchers:         { styles:this.styles.matchers,         rangeGetter:'getMatchingGenericSectionRanges'  }
    };
  }
}