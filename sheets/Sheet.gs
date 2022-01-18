const sectionMarkers = {
  titleLeft:   'TITLE_LEFT',
  titleRight:  'TITLE_RIGHT',
  hiddenLeft:  'HIDDEN_LEFT',
  hiddenRight: 'HIDDEN_RIGHT',
  headerLeft:  'HEADER_LEFT',
  headerRight: 'HEADER_RIGHT',
  mainBegin:   'MAIN_BEGIN',
  mainEnd:     'MAIN_END',
  doneBegin:   'DONE_BEGIN',
  doneEnd:     'DONE_END'
}

class Sheet {
  constructor(config) {
    this.config = config;
    this.cache = this.initializeCache();
    const configProcessor = new SheetConfigProcessor(this.config);
    configProcessor.process();
    this.name = this.config.name;
    this.sheetRef = state.spreadsheet.getSheetByName(this.name);
    this.validate();
    this.range = this.config.range || 'A:Z';
  }

  initializeCache() {
    return {
      values: false,
      dataRange: false,
      titleSectionRanges: false,
      titleAboveBelowSectionRanges: false,
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
      underContentSectionRanges: false
    };
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

  getTitleSectionRanges() {
    if(!this.cache.titleSectionRanges) {
      let ranges = [];
      const leftMarkerRanges = this.getDataRange().createTextFinder(sectionMarkers.titleLeft).findAll();
      const rightMarkerRanges = this.getDataRange().createTextFinder(sectionMarkers.titleRight).findAll();
      let leftMarkerRow = 1; let rightMarkerRow = 1; let leftMarkerColumn = 1; let rightMarkerColumn = 1; let row = 1; let column = 1; let numRows = 1; let numColumns = 1;

      if(leftMarkerRanges.length === rightMarkerRanges.length) {
        for(let i = 0; i < leftMarkerRanges.length; i++) {
          leftMarkerRow = leftMarkerRanges[i].getRow();
          rightMarkerRow = rightMarkerRanges[i].getRow();
          leftMarkerColumn = leftMarkerRanges[i].getColumn();
          rightMarkerColumn = rightMarkerRanges[i].getColumn();

          if(leftMarkerRow === rightMarkerRow || leftMarkerColumn + 2 !== rightMarkerColumn) {
            row = leftMarkerRow;
            column = leftMarkerColumn + 1;
            ranges.push(this.sheetRef.getRange(row, column, numRows, numColumns));
          } else {
            logError('Title markers not aligned or positioned correctly');
          }
        }
      } else {
        logError('Title markers not found in pairs');
      }
      this.cache.titleSectionRanges = ranges;
    }
    return this.cache.titleSectionRanges;
  }

  getTitleAboveBelowSectionRanges() {
    if(!this.cache.titleAboveBelowSectionRanges) {
      const titleSectionRanges = this.getTitleSectionRanges();
      let ranges = [];
      let aboveRow = 1, belowRow = 1, column = 1, numRows = 1, numColumns = 1;
      for(const titleSectionRange of titleSectionRanges) {
        aboveRow = titleSectionRange.getRow() - 1;
        belowRow = titleSectionRange.getRow() + 1;
        column = titleSectionRange.getColumn();
        numRows = 1;
        numColumns = titleSectionRange.getNumColumns();
        ranges.push(this.sheetRef.getRange(aboveRow, column, numRows, numColumns));
        ranges.push(this.sheetRef.getRange(belowRow, column, numRows, numColumns));
      }
      this.cache.titleAboveBelowSectionRanges = ranges;
    }
    return this.cache.titleAboveBelowSectionRanges;
  }

  getHiddenValuesRowRange() {
    if(!this.cache.hiddenValuesRowRange) {
      const row = this.getHiddenValuesSectionRow();
      const numRows = 1;
      const beginColumn = this.getContentSectionsBeginColumn();
      const numColumns = this.getContentSectionsEndColumn() - beginColumn + 1;
      this.cache.hiddenValuesRowRange = this.sheetRef.getRange(row, beginColumn, numRows, numColumns);
    }
    return this.cache.hiddenValuesRowRange;
  }

  getHeaderSectionRanges() {
    if(!this.cache.headerSectionRanges) {
      let ranges = [];
      const leftMarkerRanges = this.getDataRange().createTextFinder(sectionMarkers.headerLeft).findAll();
      const rightMarkerRanges = this.getDataRange().createTextFinder(sectionMarkers.headerRight).findAll();
      let leftMarkerRow = 1; let rightMarkerRow = 1; let leftColumn = 1; let rightColumn = 1; let row = 1; let numRows = 1; let numColumns = 1;

      if(leftMarkerRanges.length === rightMarkerRanges.length) {
        for(let i = 0; i < leftMarkerRanges.length; i++) {
          leftMarkerRow = leftMarkerRanges[i].getRow();
          rightMarkerRow = rightMarkerRanges[i].getRow();

          if(leftMarkerRow === rightMarkerRow) {
            row = leftMarkerRow;
            leftColumn = leftMarkerRanges[i].getColumn() + 1;
            rightColumn = rightMarkerRanges[i].getColumn() - 1;
            numColumns = rightColumn - leftColumn + 1;
            ranges.push(this.sheetRef.getRange(row, leftColumn, numRows, numColumns));
          } else {
            logError('Header markers not aligned');
          }
        }
      } else {
        logError('Header markers not found in pairs');
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
      const numColumns = this.getContentSectionsEndColumn() - beginColumn + 1;
      this.cache.mainSectionRange = this.sheetRef.getRange(beginRow, beginColumn, numRows, numColumns);
    }
    return this.cache.mainSectionRange;
  }

  getDoneSectionRange() {
    if(!this.cache.doneSectionRange) {
      const beginRow = this.getDoneSectionBeginRow();
      const numRows = this.getDoneSectionEndRow() - beginRow + 1;
      const beginColumn = this.getContentSectionsBeginColumn();
      const numColumns = this.getContentSectionsEndColumn() - beginColumn + 1;
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

  getUnderContentSectionRanges() {
    if(!this.cache.underContentSectionRanges) {
      let ranges = [];
      const mainSectionEndMarkerRow = this.lookupRowIndex(sectionMarkers.mainEnd);
      const doneSectionEndMarkerRow = this.lookupRowIndex(sectionMarkers.doneEnd);
      const numRows = 1;
      const beginColumn = this.getContentSectionsBeginColumn();
      const numColumns = this.getContentSectionsEndColumn() - beginColumn + 1;
      ranges.push(this.sheetRef.getRange(mainSectionEndMarkerRow, beginColumn, numRows, numColumns));
      ranges.push(this.sheetRef.getRange(doneSectionEndMarkerRow, beginColumn, numRows, numColumns));
      this.cache.underContentSectionRanges = ranges;
    }
    return this.cache.underContentSectionRanges
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

  isTriggeredByColumn(columnCardinalIndex) {
    return !this.hasTriggerColumns || this.triggerColumns.cardinalIndices.includes(columnCardinalIndex);
  }

  ensureAccessExpectations() {
    this.assignPropertiesFromConfig(['id', 'triggerColumns']);
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