class SheetConfigProcessor {
  constructor(sheetConfig) {
    this.config = sheetConfig;
  }

  process() {
    this.replaceColumnStringIdentifiersWithIndices(this.config);
    this.replaceRowNumberIdentifiersWithIndices(this.config);
  }

  replaceColumnStringIdentifiersWithIndices(currentLevel, parentLevel=null, parentLevelKey='') {
    if(isObject(currentLevel)) {
      if(this.isColumnKey(parentLevelKey)) {
        this.replaceColumnValuesOnAllObjectProperties(currentLevel);
      } else {
        this.replaceColumnValuesOnSelectedObjectProperties(currentLevel);
      }
    } else if(isArray(currentLevel) && this.isColumnKey(parentLevelKey)) {
      this.replaceColumnValuesOnAllArrayElements(parentLevel, parentLevelKey);
    }
  }

  replaceColumnValuesOnSelectedObjectProperties(obj) {
    for(const key in obj) {
      if(this.isColumnKey(key)) {
        obj[key] = this.getIndexFromColumnString(obj[key]);
      }
      this.replaceColumnStringIdentifiersWithIndices(obj[key], obj, key);
    }
  }

  replaceColumnValuesOnAllObjectProperties(obj) {
    for(const key in obj) {
      const val = obj[key];
      if(isString(val)) {
        obj[key] = this.getIndexFromColumnString(val);
      } else {
        this.replaceColumnStringIdentifiersWithIndices(obj[key], obj, key);
      }
    }
  }

  replaceColumnValuesOnAllArrayElements(obj, arrayProperty) {
    obj[arrayProperty] = Array.from(obj[arrayProperty], arrayElement => this.getIndexFromColumnString(arrayElement));
  }

  getIndexFromColumnString(columnIdentifier){
    if(isString(columnIdentifier)) {
      return (columnIdentifier.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0)) - 1;
    }
    return columnIdentifier;
  }

  isColumnKey(str) {
    const strLower = str.toLowerCase();
    return strLower.endsWith('columns') || strLower.endsWith('column');
  }

  replaceRowNumberIdentifiersWithIndices(currentLevel, parentLevel=null, parentLevelKey='') {
    if(isObject(currentLevel)) {
      if(this.isRowKey(parentLevelKey)) {
        this.replaceRowValuesOnAllObjectProperties(currentLevel);
      } else {
        this.replaceRowValuesOnSelectedObjectProperties(currentLevel);
      }
    } else if(isArray(currentLevel) && this.isRowKey(parentLevelKey)) {
      this.replaceRowValuesOnAllArrayElements(parentLevel, parentLevelKey);
    }
  }

  replaceRowValuesOnSelectedObjectProperties(obj) {
    for(const key in obj) {
      if(this.isRowKey(key)) {
        obj[key] = this.getIndexFromRowNumber(obj[key]);
      }
      this.replaceRowNumberIdentifiersWithIndices(obj[key], obj, key);
    }
  }

  replaceRowValuesOnAllObjectProperties(obj) {
    for(const key in obj) {
      const val = obj[key];
      if(isNumber(val)) {
        obj[key] = this.getIndexFromRowNumber(val);
      } else {
        this.replaceRowNumberIdentifiersWithIndices(obj[key], obj, key);
      }
    }
  }

  replaceRowValuesOnAllArrayElements(obj, arrayProperty) {
    obj[arrayProperty] = Array.from(obj[arrayProperty], arrayElement => this.getIndexFromRowNumber(arrayElement));
  }

  getIndexFromRowNumber(rowNumber){
    if(isNumber(rowNumber) && rowNumber > 0) {
      return rowNumber - 1;
    }
    return rowNumber;
  }

  isRowKey(str) {
    const strLower = str.toLowerCase();
    return strLower.endsWith('rows') || strLower.endsWith('row');
  }
}