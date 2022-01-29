const sectionMarkers = {
  title:        'TITLE_MARKER',
  hiddenValues: 'HIDDEN_MARKER',
  headers:      'HEADER_MARKER',
  main:         'MAIN_HEADER_MARKER',
  done:         'DONE_HEADER_MARKER',
  generic:      'GENERIC_HEADER_MARKER'
}

const contentMarkers = {
  MAIN_HEADER_MARKER:    'MAIN_FOOTER_MARKER',
  DONE_HEADER_MARKER:    'DONE_FOOTER_MARKER',
  GENERIC_HEADER_MARKER: 'GENERIC_FOOTER_MARKER'
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
      sheetRange: false,
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
      outsideRowsRanges: false,
      outsideColumnsRanges: false,
      titlesAboveBelowRanges: false,
      mainSectionRange: false
    };
  }

  clearCache() {
    this.cache = this.initializeCache();
  }

  getValues() {
    if(!this.cache.values) {
      this.cache.values = this.getSheetRange().getValues();
    }
    return this.cache.values;
  }

  getSheetRange() {
    if(!this.cache.sheetRange) {
      this.cache.sheetRange = this.sheetRef.getRange(1, 1, this.getNumRows(), this.getNumColumns());
    }
    return this.cache.sheetRange;
  }

  getNumRows() {
    if(!this.cache.numRows) {
      this.cache.numRows = this.sheetRef.getMaxRows();
    }
    return this.cache.numRows;
  }

  getNumColumns() {
    if(!this.cache.numColumns) {
      this.cache.numColumns = this.sheetRef.getMaxColumns();
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

/* -------------------------------------------------------------------- */
/* getContentSectionsSubRanges (and its accessors)                      */
/* -------------------------------------------------------------------- */
/* The return array contains 1 item for each of the ranges identified   */
/* by the marker argument (which may be only 1).                        */
/*                                                                      */
/* The rangeConfigs argument takes the form:                            */
/*        [{ beginColumnOffset: 0, numColumns: 2 },                     */
/*         { beginColumnOffset: 2, numColumns: 3 }]  //etc              */
/*                                                                      */
/* Each element in the return array is an array of ranges matching the  */
/* specifications of rangeConfigs.                                      */
/* -------------------------------------------------------------------- */
  getContentSectionsSubRanges(marker, rangeConfigs=[{}]) {
    const multipleSubRanges = [];
    const lookups = this.getRangeLookups(marker);
    for(const lookup of lookups) {
      const subRanges = [];
      for(const rangeConfig of rangeConfigs) {
        const beginColumnOffset = rangeConfig.beginColumnOffset || 0;
        const beginRowOffset = rangeConfig.beginRowOffset || 0;
        const row = lookup.row + beginRowOffset;
        const column = this.getFirstContentColumn() + beginColumnOffset;
        const numRows = lookup.numRows - beginRowOffset;
        const numColumns = rangeConfig.numColumns || this.getNumContentColumns() - beginColumnOffset;
        subRanges.push(this.sheetRef.getRange(row, column, numRows, numColumns));
      }
      multipleSubRanges.push(subRanges);
    }
    return multipleSubRanges;
  }

  getTitlesSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(sectionMarkers.title, rangeConfigs);
  }

  getHiddenValuesSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(sectionMarkers.hiddenValues, rangeConfigs);
  }

  getHeaderSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(sectionMarkers.headers, rangeConfigs);
  }

  getMainSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(sectionMarkers.main, rangeConfigs);
  }

  getDoneSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(sectionMarkers.done, rangeConfigs);
  }

  getGenericSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(sectionMarkers.generic, rangeConfigs);
  }

  getUnderMainSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(contentMarkers[sectionMarkers.main], rangeConfigs);
  }

  getUnderDoneSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(contentMarkers[sectionMarkers.done], rangeConfigs);
  }

  getUnderGenericSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(contentMarkers[sectionMarkers.generic], rangeConfigs);
  }

/* -------------------------------------------------------------------- */
/* getContentSectionsSubRanges singular accessors                       */
/* -------------------------------------------------------------------- */
/* Methods which break down and cache simplified access to the the      */
/* array structure return values from getContentSectionsSubRanges       */
/* -------------------------------------------------------------------- */

  getMainSectionRange() {
    if(!this.cache.mainSectionRange) {
      this.cache.mainSectionRange = this.getMainSectionsSubRanges()[0][0];
    }
    return this.cache.mainSectionRange;
  }

  getRowRange(row) {
    const column = 1;
    const numRows = 1;
    const numColumns = this.getNumColumns();
    return this.sheetRef.getRange(row, column, numRows, numColumns);
  }

/* -------------------------------------------------------------------- */

  getOutsideRowsRanges() {
    if(!this.cache.outsideRowsRanges) {
      let ranges = [];
      const topOutsideRow = this.getFirstRow();
      const bottomOutsideRow = this.getLastRow();
      const column = 1;
      const numRows = 1;
      const numColumns = this.getNumColumns();
      ranges.push(this.sheetRef.getRange(topOutsideRow, column, numRows, numColumns));
      ranges.push(this.sheetRef.getRange(bottomOutsideRow, column, numRows, numColumns));
      this.cache.outsideRowsRanges = ranges;
    }
    return this.cache.outsideRowsRanges;
  }

  getOutsideColumnsRanges() {
    if(!this.cache.outsideColumnsRanges) {
      let ranges = [];
      const row = 1;
      const leftOutsideColumn = this.getFirstColumn();
      const rightOutsideColumn = this.getLastColumn();
      const numRows = this.getNumRows();
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
      if(values[i][columnZeroIndex].includes(findText)) indices.push(i + 1);
    }
    return indices;
  }

  getSingleRowRangeLookups(marker) {
    let lookups = [];
    const values = this.getValues();
    for(let i = 0; i < values.length; i++) {
      if(values[i][0].includes(marker)) lookups.push({ row: i + 1, numRows: 1 });
    }
    return lookups;
  }

  getContentRangeLookups(marker) {
    let lookups = [], start = 0;
    const endMarker = contentMarkers[marker];
    const values = this.getValues();
    for(let i = 0; i < values.length; i++) {
      const val = values[i][0];
      if(val.includes(endMarker)) {
        lookups.push({ row: start + 2, numRows: i - start - 1 });
      }
      if(val.includes(marker)) {
        start = i;
      }
    }
    return lookups;
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