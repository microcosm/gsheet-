const sectionMarkers = {
  title:       'TITLE_MARKER',
  header:      'HEADER_MARKER',
  main:        'MAIN_HEADER_MARKER',
  done:        'DONE_HEADER_MARKER',

  titleLeft:   'TITLE_MARKER',
  hiddenLeft:  'HIDDEN_LEFT',
  hiddenRight: 'HIDDEN_RIGHT',
  headerLeft:  'HEADER_MARKER',
  headerRight: 'HEADER_RIGHT',
  mainBegin:   'MAIN_BEGIN',
  mainEnd:     'MAIN_END',
  doneBegin:   'DONE_BEGIN',
  doneEnd:     'DONE_END'
}

const contentMarkers = {
  MAIN_HEADER_MARKER: 'MAIN_FOOTER_MARKER',
  DONE_HEADER_MARKER: 'DONE_FOOTER_MARKER'
};

class Sheet {
  constructor(config) {
    this.config = config;
    this.cache = this.initializeCache();
    const configProcessor = new SheetConfigProcessor(this.config);
    configProcessor.process();
    this.name = this.config.name;
    this.sheetRef = state.spreadsheet.ref.getSheetByName(this.name);
    this.validate();
    this.range = this.config.range || 'A:Z';
  }

  initializeCache() {
    return {
      values: false,
      numColumns: false,
      numRows: false,
      numContentColumns: false,
      firstContentColumn: false,
      lastContentColumn: false,

      dataRange: false,
      titleCellRanges: false,
      titleRowRanges: false,
      titlesAboveBelowRanges: false,
      headerSectionRanges: false,
      hiddenValuesRowRange: false,
      hiddenValuesSectionRow: false,
      mainSectionRange: false,
      mainSectionBeginRow: false,
      mainSectionEndRow: false,
      mainSectionNumRows: false,
      doneSectionRange: false,
      doneSectionBeginRow: false,
      doneSectionEndRow: false,
      doneSectionNumRows: false,
      contentSectionsBeginColumn: false,
      contentSectionsEndColumn: false,
      contentSectionsNumColumns: false,
      underMainSectionRange: false,
      underDoneSectionRange: false,
      outsideColumnsRanges: false,
      maxRows: false,
      maxColumns: false
    };
  }

  clearCache() {
    this.cache = this.initializeCache();
  }

  getValues() {
    if(!this.cache.values) {
      this.cache.values = this.getDataRange().getValues();
    }
    return this.cache.values;
  }

  getDataRange() {
    if(!this.cache.dataRange) {
      this.cache.dataRange = this.sheetRef.getDataRange()
    }
    return this.cache.dataRange;
  }

  getMaxRows() {
    if(!this.cache.maxRows) {
      this.cache.maxRows = this.sheetRef.getMaxRows()
    }
    return this.cache.maxRows;
  }

  getMaxColumns() {
    if(!this.cache.maxColumns) {
      this.cache.maxColumns = this.sheetRef.getMaxColumns()
    }
    return this.cache.maxColumns;
  }

  getRangeIndices(marker) {
    if(Object.keys(contentMarkers).includes(marker)) {
      return this.getContentRangeIndices(marker);
    } else {
      return this.getRowRangeIndices(marker);
    }
  }

  getRowRangeIndices(marker) {
    let indices = [];
    const values = this.getValues();
    for(let i = 0; i < values.length; i++) {
      if(values[i][0].endsWith(marker)) indices.push({ begin: i + 1, numRows: 1 });
    }
    return indices;
  }

  getContentRangeIndices(marker) {
    let indices = [], start = 0;
    const endMarker = contentMarkers[marker];
    const values = this.getValues();
    for(let i = 0; i < values.length; i++) {
      const val = values[i][0];
      if(val === marker) {
        start = i;
      } else if(val === endMarker) {
        indices.push({ begin: start + 2, numRows: i - start - 1 });
      }
    }
    return indices;
  }

  getNumRows() {
    if(!this.cache.numRows) {
      const values = this.getValues();
      this.cache.numRows = values.length;
    }
    return this.cache.numRows;
  }

  getNumColumns() {
    if(!this.cache.numColumns) {
      const values = this.getValues();
      this.cache.numColumns = values[0].length;
    }
    return this.cache.numColumns;
  }

  getNumContentColumns() {
    if(!this.cache.numContentColumns) {
      const values = this.getValues();
      this.cache.numContentColumns = this.getNumColumns() - 2;
    }
    return this.cache.numContentColumns;
  }

  getFirstContentColumn() {
    if(!this.cache.firstContentColumn) {
      this.cache.firstContentColumn = 2;
    }
    return this.cache.firstContentColumn;
  }

  getLastContentColumn() {
    if(!this.cache.lastContentColumn) {
      this.cache.lastContentColumn = this.getFirstContentColumn() + this.getNumContentColumns() - 1;
    }
    return this.cache.lastContentColumn;
  }

  getOutsideColumnsRanges() {
    if(!this.cache.outsideColumnsRanges) {
      let ranges = [];
      const row = 1;
      const leftOutsideColumn = this.getContentSectionsBeginColumn() - 1;
      const rightOutsideColumn = this.getContentSectionsEndColumn() + 1;
      const numRows = this.getMaxRows();
      const numColumns = 1;
      ranges.push(this.sheetRef.getRange(row, leftOutsideColumn, numRows, numColumns));
      ranges.push(this.sheetRef.getRange(row, rightOutsideColumn, numRows, numColumns));
      this.cache.outsideColumnsRanges = ranges;
    }
    return this.cache.outsideColumnsRanges;
  }

  getTitlesAboveBelowRanges() {
    if(!this.cache.titlesAboveBelowRanges) {
      const indices = this.getRangeIndices(sectionMarkers.title);
      const column = this.getFirstContentColumn();
      const numColumns = this.getNumContentColumns();
      let ranges = [];
      for(const index of indices) {
        ranges.push(this.sheetRef.getRange(index.begin + 1, column, index.numRows, numColumns));
        ranges.push(this.sheetRef.getRange(index.begin - 1, column, index.numRows, numColumns));
      }
      this.cache.titlesAboveBelowRanges = ranges;
    }
    return this.cache.titlesAboveBelowRanges;
  }

  getTitlesSubRanges(rangeConfigs) {
    return this.getContentColumnSubRanges(sectionMarkers.title, rangeConfigs);
  }

  getMainSubRanges(rangeConfigs) {
    return this.getContentColumnSubRanges(sectionMarkers.main, rangeConfigs);
  }

  getDoneSubRanges(rangeConfigs) {
    return this.getContentColumnSubRanges(sectionMarkers.done, rangeConfigs);
  }

  getContentColumnSubRanges(marker, rangeConfigs) {
    const multipleSubRanges = [];
    const indices = this.getRangeIndices(marker);
    for(const index of indices) {
      const subRanges = [];
      for(const rangeConfig of rangeConfigs) {
        const beginColumnOffset = rangeConfig.beginColumnOffset || 0;
        const column = this.getFirstContentColumn() + beginColumnOffset;
        const numColumns = rangeConfig.numColumns || this.getNumContentColumns() - beginColumnOffset;
        subRanges.push(this.sheetRef.getRange(index.begin, column, index.numRows, numColumns));
      }
      multipleSubRanges.push(subRanges);
    }
    return multipleSubRanges;
  }

  getHiddenValuesRowRange() {
    if(!this.cache.hiddenValuesRowRange) {
      const row = this.getHiddenValuesSectionRow();
      const numRows = 1;
      const beginColumn = this.getContentSectionsBeginColumn();
      const numColumns = this.getContentSectionsNumColumns();
      this.cache.hiddenValuesRowRange = this.sheetRef.getRange(row, beginColumn, numRows, numColumns);
    }
    return this.cache.hiddenValuesRowRange;
  }

  getHeaderSectionRanges() {
    if(!this.cache.headerSectionRanges) {
      let ranges = [];
      const indices = this.getRangeIndices(sectionMarkers.header);
      const column = 2;
      const numColumns = this.getNumContentColumns();
      for(const index of indices) {
        ranges.push(this.sheetRef.getRange(index.begin, column, index.numRows, numColumns));
      }
      this.cache.headerSectionRanges = ranges;
    }
    return this.cache.headerSectionRanges;
  }

  getMainSectionRange() {
    if(!this.cache.mainSectionRange) {
      const beginRow = this.getMainSectionBeginRow();
      const numRows = this.getMainSectionEndRow() - beginRow + 1;
      const beginColumn = this.getContentSectionsBeginColumn();
      const numColumns = this.getContentSectionsNumColumns();
      this.cache.mainSectionRange = this.sheetRef.getRange(beginRow, beginColumn, numRows, numColumns);
    }
    return this.cache.mainSectionRange;
  }

  getDoneSectionRange() {
    if(!this.cache.doneSectionRange) {
      const beginRow = this.getDoneSectionBeginRow();
      const numRows = this.getDoneSectionEndRow() - beginRow + 1;
      const beginColumn = this.getContentSectionsBeginColumn();
      const numColumns = this.getContentSectionsNumColumns();
      this.cache.doneSectionRange = this.sheetRef.getRange(beginRow, beginColumn, numRows, numColumns);
    }
    return this.cache.doneSectionRange;
  }

  getHiddenValuesSectionRow() {
    if(!this.cache.hiddenValuesSectionRow) {
      this.cache.hiddenValuesSectionRow = this.lookupRowIndex(sectionMarkers.hiddenLeft);
    }
    return this.cache.hiddenValuesSectionRow;
  }

  getMainSectionBeginRow() {
    if(!this.cache.mainSectionBeginRow) {
      this.cache.mainSectionBeginRow = this.lookupRowIndex(sectionMarkers.mainBegin, 2);
    }
    return this.cache.mainSectionBeginRow;
  }

  getMainSectionEndRow() {
    if(!this.cache.mainSectionEndRow) {
      this.cache.mainSectionEndRow = this.lookupRowIndex(sectionMarkers.mainEnd, -1);
    }
    return this.cache.mainSectionEndRow;
  }

  getMainSectionNumRows() {
    if(!this.cache.mainSectionNumRows) {
      this.cache.mainSectionNumRows = this.getMainSectionEndRow() - this.getMainSectionBeginRow() + 1;
    }
    return this.cache.mainSectionNumRows;
  }

  getDoneSectionBeginRow() {
    if(!this.cache.doneSectionBeginRow) {
      this.cache.doneSectionBeginRow = this.lookupRowIndex(sectionMarkers.doneBegin, 2);
    }
    return this.cache.doneSectionBeginRow;
  }

  getDoneSectionEndRow() {
    if(!this.cache.doneSectionEndRow) {
      this.cache.doneSectionEndRow = this.lookupRowIndex(sectionMarkers.doneEnd, -1);
    }
    return this.cache.doneSectionEndRow;
  }

  getDoneSectionNumRows() {
    if(!this.cache.doneSectionNumRows) {
      this.cache.doneSectionNumRows = this.getDoneSectionEndRow() - this.getDoneSectionBeginRow() + 1;
    }
    return this.cache.doneSectionNumRows;
  }

  getContentSectionsBeginColumn() {
    if(!this.cache.contentSectionsBeginColumn) {
      this.cache.contentSectionsBeginColumn = this.getDataRange().createTextFinder(sectionMarkers.headerLeft).findNext().getColumn() + 1;
    }
    return this.cache.contentSectionsBeginColumn;
  }

  getContentSectionsEndColumn() {
    if(!this.cache.contentSectionsEndColumn) {
      this.cache.contentSectionsEndColumn = this.getDataRange().createTextFinder(sectionMarkers.headerRight).findNext().getColumn() - 1;
    }
    return this.cache.contentSectionsEndColumn;
  }

  getContentSectionsNumColumns() {
    if(!this.cache.contentSectionsNumColumns) {
      this.cache.contentSectionsNumColumns = this.getContentSectionsEndColumn() - this.getContentSectionsBeginColumn() + 1;
    }
    return this.cache.contentSectionsNumColumns;
  }

  getUnderMainSectionRange() {
    if(!this.cache.underMainSectionRange) {
      this.cache.underMainSectionRange = this.getUnderContentSectionRange(sectionMarkers.mainEnd);
    }
    return this.cache.underMainSectionRange;
  }

  getUnderDoneSectionRange() {
    if(!this.cache.underDoneSectionRange) {
      this.cache.underDoneSectionRange = this.getUnderContentSectionRange(sectionMarkers.doneEnd);
    }
    return this.cache.underDoneSectionRange;
  }

  getUnderContentSectionRange(marker) {
    const contentSectionEndMarkerRow = this.lookupRowIndex(marker);
    const numRows = 1;
    const beginColumn = this.getContentSectionsBeginColumn();
    const numColumns = this.getContentSectionsEndColumn() - beginColumn + 1;
    return this.sheetRef.getRange(contentSectionEndMarkerRow, beginColumn, numRows, numColumns);
  }

  getMainSectionRowsRange(beginOffset=0, endOffset=0) {
    return this.getRangeOfRows(this.getMainSectionBeginRow() + beginOffset, this.getMainSectionEndRow() + endOffset);
  }

  getDoneSectionRowsRange(beginOffset=0, endOffset=0) {
    return this.getRangeOfRows(this.getDoneSectionBeginRow() + beginOffset, this.getDoneSectionEndRow() + endOffset);
  }

  lookupRowIndex(marker, offset=0) {
    return this.getDataRange().createTextFinder(marker).findNext().getRow() + offset;
  }

  getRangeOfRow(row) {
    const beginColumn = 1;
    const numRows = 1;
    const numColumns = this.getDataRange().getNumColumns();
    return this.sheetRef.getRange(row, beginColumn, numRows, numColumns);
  }

  getRangeOfRows(beginRow, endRow) {
    const beginColumn = 1;
    const numRows = endRow - beginRow + 1;
    const numColumns = this.getDataRange().getNumColumns();
    return this.sheetRef.getRange(beginRow, beginColumn, numRows, numColumns);
  }

  validate() {
    if(this.sheetRef == null) {
      throw 'Cannot establish access to sheet "' + this.name + '" - check config values.';
    }
  }
}

class ValuesSheet extends Sheet {
  constructor(config) {
    super(config);
  }

  getValues() {
    if(!this.cache.values) {
      this.cache.values = this.sheetRef.getRange(this.range).getValues();
    }
    return this.cache.values;
  }

  getValuesOf(columnID) {
    return this.getValues().map((value) => { return value[columnID]; });
  }

  getValueOf(rowId, columnID) {
    return this.getValues()[rowId][columnID];
  }
}

class FeatureSheet extends Sheet {
  constructor(config) {
    super(config);
    this.ensureAccessExpectations();
  }

  isNamed(name) {
    return this.name === name;
  }

  ensureAccessExpectations() {
    this.assignPropertiesFromConfig(['id']);
  }

  assignPropertiesFromConfig(propertyNames) {
    propertyNames.forEach((propertyName) => {
      this.assignPropertyFromConfig(propertyName);
    });
  }

  assignPropertyFromConfig(propertyName) {
    const propertyNameHasVersion = 'has' + capitalizeFirstLetter(propertyName);
    this[propertyNameHasVersion] = false;
    if(this.config.hasOwnProperty(propertyName)) {
      this[propertyName] = this.config[propertyName];
      this[propertyNameHasVersion] = true;
    }
  }
}