const SectionMarker = {
  title:        'TITLE_MARKER',
  hiddenValues: 'HIDDEN_MARKER',
  headers:      'HEADER_MARKER',
  main:         'MAIN_HEADER_MARKER',
  done:         'DONE_HEADER_MARKER',
  generic:      'GENERIC_HEADER_MARKER'
}

const ContentMarker = {
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
      this.cache.firstMainRow = this.getFirstContentRow(SectionMarker.main);
    }
    return this.cache.firstMainRow;
  }

  getLastMainRow() {
    if(!this.cache.lastMainRow) {
      this.cache.lastMainRow = this.getLastContentRow(SectionMarker.main);
    }
    return this.cache.lastMainRow;
  }

  getFirstDoneRow() {
    if(!this.cache.firstDoneRow) {
      this.cache.firstDoneRow = this.getFirstContentRow(SectionMarker.done);
    }
    return this.cache.firstDoneRow;
  }

  getLastDoneRow() {
    if(!this.cache.lastDoneRow) {
      this.cache.lastDoneRow = this.getLastContentRow(SectionMarker.done);
    }
    return this.cache.lastDoneRow;
  }

  getFirstContentRow(marker) {
    return this.getFirstContentRows(marker)[0];
  }

  getFirstContentRows(marker) {
    const values = this.getValues();
    let rows = [];
    for(let i = 0; i < values.length; i++) {
      if(values[i][0].includes(marker)) rows.push(i + 2);
    }
    return rows;
  }

  getLastContentRow(marker) {
    return this.getLastContentRows(marker)[0];
  }

  getLastContentRows(marker) {
    const endMarker = ContentMarker[marker];
    const values = this.getValues();
    let rows = [];
    for(let i = 0; i < values.length; i++) {
      if(values[i][0].includes(endMarker)) rows.push(i);
    }
    return rows;
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
/* by the sectionMarker argument (which may be only 1).                 */
/*                                                                      */
/* The rangeConfigs argument takes the form:                            */
/*        [{ beginColumnOffset: 0, numColumns: 2 },                     */
/*         { beginColumnOffset: 2, numColumns: 3 }]  //etc              */
/*                                                                      */
/* Each element in the return array is an array of ranges matching the  */
/* specifications of rangeConfigs.                                      */
/* -------------------------------------------------------------------- */
  getContentSectionsSubRanges(sectionMarker, rangeConfigs=[{}]) {
    const multipleSubRanges = [];
    const sectionLookups = this.getSectionRangeLookups(sectionMarker);
    for(const sectionLookup of sectionLookups) {
      const subRanges = [];
      for(const rangeConfig of rangeConfigs) {
        const beginColumnOffset = rangeConfig.beginColumnOffset || 0;
        const beginRowOffset = rangeConfig.beginRowOffset || 0;
        const row = sectionLookup.row + beginRowOffset;
        const column = this.getFirstContentColumn() + beginColumnOffset;
        const numRows = sectionLookup.numRows - beginRowOffset;
        const numColumns = rangeConfig.numColumns || this.getNumContentColumns() - beginColumnOffset;
        subRanges.push(this.sheetRef.getRange(row, column, numRows, numColumns));
      }
      multipleSubRanges.push(subRanges);
    }
    return multipleSubRanges;
  }

  getTitlesSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(SectionMarker.title, rangeConfigs);
  }

  getHiddenValuesSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(SectionMarker.hiddenValues, rangeConfigs);
  }

  getHeaderSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(SectionMarker.headers, rangeConfigs);
  }

  getMainSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(SectionMarker.main, rangeConfigs);
  }

  getDoneSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(SectionMarker.done, rangeConfigs);
  }

  getGenericSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(SectionMarker.generic, rangeConfigs);
  }

  getUnderMainSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(ContentMarker[SectionMarker.main], rangeConfigs);
  }

  getUnderDoneSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(ContentMarker[SectionMarker.done], rangeConfigs);
  }

  getUnderGenericSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(ContentMarker[SectionMarker.generic], rangeConfigs);
  }

/* -------------------------------------------------------------------- */

  getMainSectionRange() {
    if(!this.cache.mainSectionRange) {
      this.cache.mainSectionRange = this.getMainSectionsSubRanges()[0][0];
    }
    return this.cache.mainSectionRange;
  }

/* -------------------------------------------------------------------- */

  getMatchingGenericSectionRanges(rangeConfigs) {
    let ranges = [];
    for(const rangeConfig of rangeConfigs) {
      const rows = this.getMatchingRowsFromContentSection(rangeConfig.match.value, rangeConfig.match.column.cardinalIndex, SectionMarker.generic);
      for(const row of rows) {
        rangeConfig.row = row;
        ranges.push(this.getContentSectionRange(rangeConfig));
      }
    }
    return ranges;
  }

  getContentSectionRange(rangeConfig) {
    const beginColumnOffset = rangeConfig.beginColumnOffset || 0;
    const beginRowOffset = rangeConfig.beginRowOffset || 0;
    const row = rangeConfig.row;
    const column = this.getFirstContentColumn() + beginColumnOffset;
    const numRows = rangeConfig.numRows || 1;
    const numColumns = rangeConfig.numColumns || this.getNumContentColumns() - beginColumnOffset;
    return this.sheetRef.getRange(row, column, numRows, numColumns);
  }

  getRowRange(row) {
    const column = 1;
    const numRows = 1;
    const numColumns = this.getNumColumns();
    return this.sheetRef.getRange(row, column, numRows, numColumns);
  }

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
      const lookups = this.getSectionRangeLookups(SectionMarker.title);
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

  getSectionRangeLookups(marker) {
    if(Object.keys(ContentMarker).includes(marker)) {
      return this.getContentSectionRangeLookups(marker);
    } else {
      return this.getSingleRowSectionRangeLookups(marker);
    }
  }

  getMatchingRowsFromContentSection(matcher, column, contentMarker) {
    const columnZeroIndex = column - 1;
    const values = this.getValues();
    let indices = [];

    const firstContentRows = this.getFirstContentRows(contentMarker);
    const lastContentRows = this.getLastContentRows(contentMarker);
    if(firstContentRows.length !== lastContentRows.length) throw 'Content markers do not match.';

    for(let i = 0; i < firstContentRows.length; i++) {
      const firstContentRow = firstContentRows[i];
      const lastContentRow = lastContentRows[i];
      for(let j = firstContentRow - 1; j < lastContentRow; j++) {
        if(isMatch(values[j][columnZeroIndex], matcher)) indices.push(j + 1);
      }
    }
    return indices;
  }

  getSingleRowSectionRangeLookups(marker) {
    let lookups = [];
    const values = this.getValues();
    for(let i = 0; i < values.length; i++) {
      if(values[i][0].includes(marker)) lookups.push({ row: i + 1, numRows: 1 });
    }
    return lookups;
  }

  getContentSectionRangeLookups(marker) {
    let lookups = [], start = 0;
    const endMarker = ContentMarker[marker];
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