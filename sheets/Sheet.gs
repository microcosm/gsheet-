const SectionMarker = {
  aboveTitle:   'TITLE_ABOVE_MARKER',
  title:        'TITLE_MARKER',
  hiddenValues: 'HIDDEN_MARKER',
  headers:      'HEADER_MARKER',
  main:         'MAIN_HEADER_MARKER',
  done:         'DONE_HEADER_MARKER',
  generic:      'GENERIC_HEADER_MARKER'
};

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
      hiddenValuesRow: false,
      firstRow: false,
      lastRow: false,
      firstMainRow: false,
      firstDoneRow: false,
      firstColumn: false,
      numContentColumns: false,
      firstContentColumn: false,
      lastContentColumn: false,
      topOutsideRowRanges: false,
      bottomOutsideRowRanges: false,
      outsideRowsRanges: false,
      outsideColumnsRanges: false,
      titlesAboveBelowRanges: false
    };
  }

  clearCache() {
    this.cache = this.initializeCache();
  }

  isMarkerMatch(val, marker) {
    const vals = val.split(' ');
    for(const v of vals) {
      if(v.endsWith(marker)) return true;
    }
    return false;
  }

  getRowOffset(marker) {
    if(Object.keys(ContentMarker).includes(marker)) return 2;
    return 1;
  }

  getValue(row, column) {
    return this.getRow(row)[column - 1];
  }

  getRow(row) {
    const values = this.getValues();
    return values[row - 1];
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

  getHiddenValuesRow() {
    if(!this.cache.hiddenValuesRow) {
      this.cache.hiddenValuesRow = this.getFirstRow(SectionMarker.hiddenValues);
    }
    return this.cache.hiddenValuesRow;
  }

  getFirstColumn() {
    if(!this.cache.firstColumn) {
      this.cache.firstColumn = 1;
    }
    return this.cache.firstColumn;
  }

  getFirstMainRow() {
    if(!this.cache.firstMainRow) {
      this.cache.firstMainRow = this.getFirstRow(SectionMarker.main);
    }
    return this.cache.firstMainRow;
  }

  getFirstDoneRow() {
    if(!this.cache.firstDoneRow) {
      this.cache.firstDoneRow = this.getFirstRow(SectionMarker.done);
    }
    return this.cache.firstDoneRow;
  }

  getFirstRow(marker) {
    if(isString(marker)) return this.getFirstRows(marker)[0];
    if(!this.cache.firstRow) {
      this.cache.firstRow = 1;
    }
    return this.cache.firstRow;
  }

  getNthFirstRow(marker, n) {
    return this.getFirstRows(marker)[n - 1];
  }

  getFirstRows(marker) {
    const values = this.getValues();
    let rows = [];
    for(let i = 0; i < values.length; i++) {
      if(this.isMarkerMatch(values[i][0], marker)) rows.push(i + this.getRowOffset(marker));
    }
    return rows;
  }

  getLastRow(marker) {
    if(isString(marker)) return this.getLastRows(marker)[0];
    if(!this.cache.lastRow) {
      this.cache.lastRow = this.getNumRows();
    }
    return this.cache.lastRow;
  }

  getLastRows(marker) {
    const endMarker = ContentMarker[marker];
    const values = this.getValues();
    let rows = [];
    for(let i = 0; i < values.length; i++) {
      if(this.isMarkerMatch(values[i][0], endMarker)) rows.push(i);
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
/* If there are n sections marked up with sectionMarker, then there are */
/* n elements in the return array -- one for each sectionMarker in the  */
/* sheet.                                                               */
/*                                                                      */
/* If there are n config objects in rangeConfigs[i], then there are n   */ 
/* ranges in returnArray[i], each a subset of sectionMarker's implied   */
/* range, and based on the properties of the matching config object.    */
/*                                                                      */
/* The rangeConfigs argument can be an object rather than an array, in  */
/* which case the keys are ignored and the values are read as an array. */
/*                                                                      */
/* A rangeConfig for a single row marked by sectionMarker could be:     */
/*        [{ beginColumnOffset: 0, numColumns: 2 },                     */
/*         { beginColumnOffset: 2, numColumns: 3 }]                     */
/*                                                                      */
/* In which case the return array would look like:                      */
/*        [[range-of-first-two-cells,                                   */
/*          range-of-next-three-cells]]                                 */
/* -------------------------------------------------------------------- */
  getContentSectionsSubRanges(sectionMarker, rangeConfigs=[{}]) {
    const multipleSubRanges = [];
    const sectionLookups = this.getSectionRangeLookups(sectionMarker);
    for(const sectionLookup of sectionLookups) {
      const subRanges = [];
      for(const rangeConfig of toArray(rangeConfigs)) {
        const invertColumnCounting = (!isProperty(rangeConfig.beginColumnOffset)) && isProperty(rangeConfig.endColumnOffset);

        const beginColumnOffset = rangeConfig.beginColumnOffset || 0;
        const endColumnOffset = rangeConfig.endColumnOffset || 0;
        const beginRowOffset = rangeConfig.beginRowOffset || 0;

        const row = sectionLookup.row + beginRowOffset;
        const numRows = sectionLookup.numRows - beginRowOffset;

        const numColumns = rangeConfig.numColumns || this.getNumContentColumns() - beginColumnOffset - endColumnOffset;

        const column = invertColumnCounting ?
          this.getLastContentColumn() - endColumnOffset - numColumns + this.getFirstContentColumn() - 1 :
          this.getFirstContentColumn() + beginColumnOffset;

        if(numRows > 0) subRanges.push(this.sheetRef.getRange(row, column, numRows, numColumns));
      }
      multipleSubRanges.push(subRanges);
    }
    return multipleSubRanges;
  }

  getTitlesAboveSectionsSubRanges(rangeConfigs=[{}]) {
    return this.getContentSectionsSubRanges(SectionMarker.aboveTitle, rangeConfigs);
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

  getMatchingGenericSectionRanges(rangeConfigs) {
    let ranges = [];
    for(const rangeConfig of toArray(rangeConfigs)) {
      const rows = this.getMatchingRowsFromContentSections(rangeConfig.match.value, rangeConfig.match.column.cardinalIndex, SectionMarker.generic);
      for(const row of rows) {
        rangeConfig.row = row;
        ranges.push(this.getContentSectionRange(rangeConfig));
      }
    }
    return ranges;
  }

  getMatchingRowsFromContentSections(matcher, column, contentMarker) {
    const columnZeroIndex = column - 1;
    const values = this.getValues();
    let indices = [];

    const firstRows = this.getFirstRows(contentMarker);
    const lastRows = this.getLastRows(contentMarker);
    if(firstRows.length !== lastRows.length) throw 'Content markers do not match.';

    for(let i = 0; i < firstRows.length; i++) {
      const firstRow = firstRows[i];
      const lastRow = lastRows[i];
      for(let j = firstRow - 1; j < lastRow; j++) {
        if(isMatch(values[j][columnZeroIndex], matcher)) indices.push(j + 1);
      }
    }
    return indices;
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

  getTopOutsideRowRanges() {
    if(!this.cache.topOutsideRowRanges) {
      const topOutsideRow = this.getFirstRow();
      const column = 1;
      const numRows = 1;
      const numColumns = this.getNumColumns();
      this.cache.topOutsideRowRanges = [this.sheetRef.getRange(topOutsideRow, column, numRows, numColumns)];
    }
    return this.cache.topOutsideRowRanges;
  }

  getBottomOutsideRowRanges() {
    if(!this.cache.bottomOutsideRowRanges) {
      const bottomOutsideRow = this.getLastRow();
      const column = 1;
      const numRows = 1;
      const numColumns = this.getNumColumns();
      this.cache.bottomOutsideRowRanges = [this.sheetRef.getRange(bottomOutsideRow, column, numRows, numColumns)];
    }
    return this.cache.bottomOutsideRowRanges;
  }

  getOutsideRowsRanges() {
    if(!this.cache.outsideRowsRanges) {
      let ranges = [];
      ranges = ranges.concat(this.getTopOutsideRowRanges());
      ranges = ranges.concat(this.getBottomOutsideRowRanges());
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

  getSingleRowSectionRangeLookups(marker) {
    let lookups = [];
    const values = this.getValues();
    for(let i = 0; i < values.length; i++) {
      if(this.isMarkerMatch(values[i][0], marker)) {
        lookups.push({ row: i + 1, numRows: 1 });
      }
    }
    return lookups;
  }

  getContentSectionRangeLookups(marker) {
    let lookups = [], start = 0;
    const endMarker = ContentMarker[marker];
    const values = this.getValues();
    for(let i = 0; i < values.length; i++) {
      const val = values[i][0];
      if(this.isMarkerMatch(val, endMarker)) {
        lookups.push({ row: start + 2, numRows: i - start - 1 });
      }
      if(this.isMarkerMatch(val, marker)) {
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
  }

  isNamed(name) {
    return this.name === name;
  }
}