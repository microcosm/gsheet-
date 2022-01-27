const sectionMarkers = {
  title:        'TITLE_MARKER',
  hiddenValues: 'HIDDEN_MARKER',
  headers:      'HEADER_MARKER',
  main:         'MAIN_HEADER_MARKER',
  done:         'DONE_HEADER_MARKER',

  titleLeft:   'TITLE_MARKER',
  hiddenLeft:  'HIDDEN_MARKER',
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
      dataRange: false,
      maxRows: false,
      maxColumns: false,
      numRows: false,
      numColumns: false,
      firstRow: false,
      firstMainRow: false,
      lastMainRow: false,
      firstDoneRow: false,
      lastDoneRow: false,
      firstColumn: false,
      numContentColumns: false,
      firstContentColumn: false,
      lastContentColumn: false,
      outsideColumnsRanges: false,
      titlesAboveBelowRanges: false,



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
      underDoneSectionRange: false
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

  getFirstRow() {
    if(!this.cache.firstRow) {
      this.cache.firstRow = 1;
    }
    return this.cache.firstRow;
  }

  getLastRow() {
    return this.getNumRows();
  }

  getFirstColumn() {
    if(!this.cache.firstColumn) {
      this.cache.firstColumn = 1;
    }
    return this.cache.firstColumn;
  }

  getFirstMainRow() {
    if(!this.cache.firstMainRow) {
      this.cache.firstMainRow = this.getFirstContentRow(sectionMarkers.main);
    }
    return this.cache.firstMainRow;
  }

  getLastMainRow() {
    if(!this.cache.lastMainRow) {
      this.cache.lastMainRow = this.getLastContentRow(sectionMarkers.main);
    }
    return this.cache.lastMainRow;
  }

  getFirstDoneRow() {
    if(!this.cache.firstDoneRow) {
      this.cache.firstDoneRow = this.getFirstContentRow(sectionMarkers.done);
    }
    return this.cache.firstDoneRow;
  }

  getLastDoneRow() {
    if(!this.cache.lastDoneRow) {
      this.cache.lastDoneRow = this.getLastContentRow(sectionMarkers.done);
    }
    return this.cache.lastDoneRow;
  }

  getFirstContentRow(marker) {
    const values = this.getValues();
    for(let i = 0; i < values.length; i++) {
      if(values[i][0] === marker) return i + 2;
    }
    return -1;
  }

  getLastContentRow(marker) {
    const endMarker = contentMarkers[marker];
    const values = this.getValues();
    for(let i = 0; i < values.length; i++) {
      if(values[i][0] === marker) return i;
    }
    return -1;
  }

  getLastColumn() {
    return this.getNumColumns();
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

  getTitlesSubRanges(rangeConfigs=[{}]) {
    return this.getContentColumnSubRanges(sectionMarkers.title, rangeConfigs);
  }

  getHiddenValuesSubRanges(rangeConfigs=[{}]) {
    return this.getContentColumnSubRanges(sectionMarkers.hiddenValues, rangeConfigs);
  }

  getHeaderSubRanges(rangeConfigs=[{}]) {
    return this.getContentColumnSubRanges(sectionMarkers.headers, rangeConfigs);
  }

  getMainSubRanges(rangeConfigs=[{}]) {
    return this.getContentColumnSubRanges(sectionMarkers.main, rangeConfigs);
  }

  getDoneSubRanges(rangeConfigs=[{}]) {
    return this.getContentColumnSubRanges(sectionMarkers.done, rangeConfigs);
  }

  getUnderMainSubRanges(rangeConfigs=[{}]) {
    return this.getContentColumnSubRanges(contentMarkers[sectionMarkers.main], rangeConfigs);
  }

  getUnderDoneSubRanges(rangeConfigs=[{}]) {
    return this.getContentColumnSubRanges(contentMarkers[sectionMarkers.done], rangeConfigs);
  }

  getContentColumnSubRanges(marker, rangeConfigs=[{}]) {
    const multipleSubRanges = [];
    const lookups = this.getRangeLookups(marker);
    for(const lookup of lookups) {
      const subRanges = [];
      for(const rangeConfig of rangeConfigs) {
        const column = this.getFirstContentColumn() + (rangeConfig.beginColumnOffset || 0);
        const numColumns = rangeConfig.numColumns || this.getNumContentColumns() - beginColumnOffset;
        subRanges.push(this.sheetRef.getRange(lookup.row, column, lookup.numRows, numColumns));
      }
      multipleSubRanges.push(subRanges);
    }
    return multipleSubRanges;
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
      const lookups = this.getRangeLookups(sectionMarkers.title);
      const column = this.getFirstContentColumn();
      const numColumns = this.getNumContentColumns();
      let ranges = [];
      for(const lookup of lookups) {
        ranges.push(this.sheetRef.getRange(lookup.row + 1, column, lookup.numRows, numColumns));
        ranges.push(this.sheetRef.getRange(lookup.row - 1, column, lookup.numRows, numColumns));
      }
      this.cache.titlesAboveBelowRanges = ranges;
    }
    return this.cache.titlesAboveBelowRanges;
  }

  getRangeLookups(marker) {
    if(Object.keys(contentMarkers).includes(marker)) {
      return this.getContentRangeLookups(marker);
    } else {
      return this.getSingleRowRangeLookups(marker);
    }
  }

  getMatchingRowsFromMainContent(findText, column) {
    const columnZeroIndex = column - 1;
    const values = this.getValues();
    const endMarker = contentMarkers[sectionMarkers.main];
    let indices = [];
    for(let i = this.getFirstMainRow() - 1; i < values.length; i++) {
      if(values[i][0] === endMarker) return indices;
      if(values[i][columnZeroIndex].endsWith(findText)) indices.push(i + 1);
    }
    return indices;
  }

  getSingleRowRangeLookups(marker) {
    let lookups = [];
    const values = this.getValues();
    for(let i = 0; i < values.length; i++) {
      if(values[i][0].endsWith(marker)) lookups.push({ row: i + 1, numRows: 1 });
    }
    return lookups;
  }

  getContentRangeLookups(marker) {
    let lookups = [], start = 0;
    const endMarker = contentMarkers[marker];
    const values = this.getValues();
    for(let i = 0; i < values.length; i++) {
      const val = values[i][0];
      if(val === marker) {
        start = i;
      } else if(val === endMarker) {
        lookups.push({ row: start + 2, numRows: i - start - 1 });
      }
    }
    return lookups;
  }


  /* =============================== */

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