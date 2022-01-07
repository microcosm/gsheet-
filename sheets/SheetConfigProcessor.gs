class SheetConfigProcessor {
  constructor(config) {
    this.config = config;
    this.identifiers = {
      index: 'Index',
      indices: 'Indices',
      cardinal: 'Cardinal', //1, 2, 3... used by spreadsheet
      zeroBased: 'ZeroBased', //0, 1, 2... used in programmatic arrays
      column: 'column',
      columns: 'columns',
      row: 'row',
      rows: 'rows'
    }
  }

  process() {
    this.generateColumnIndicesFromStringIdentifiers(this.config);
    this.generateRowIndicesFromNumberIdentifiers(this.config);
  }

  generateColumnIndicesFromStringIdentifiers(currentLevel, parentLevel=null, propertyName='') {
    if(isObject(currentLevel)) {
      if(this.isColumnsKey(propertyName)) {
        this.generateColumnIndicesOnAllObjectProperties(currentLevel, parentLevel, propertyName);
      } else {
        this.generateColumnIndicesOnSelectedObjectProperties(currentLevel);
      }
    } else if(isArray(currentLevel) && this.isColumnsKey(propertyName)) {
      this.generateColumnIndicesOnAllArrayElements(propertyName, parentLevel);
    }
  }

  generateColumnIndicesOnSelectedObjectProperties(obj) {
    for(const key in obj) {
      if(this.isColumnKey(key)) {
        const cardinalIndex = this.getCardinalIndexFromColumnString(obj[key]);
        obj[this.getCardinalIndexPropertyName(key)] = cardinalIndex;
        obj[this.getZeroBasedIndexPropertyName(key)] = cardinalIndex - 1;
      }
      this.generateColumnIndicesFromStringIdentifiers(obj[key], obj, key);
    }
  }

  generateColumnIndicesOnAllObjectProperties(obj, parentLevel, propertyName) {
    const propertyNames = this.createCardinalAndZeroBasedIndicesProperties(parentLevel, propertyName);
    for(const key in obj) {
      const val = obj[key];
      if(isString(val)) {
        const cardinalIndex = this.getCardinalIndexFromColumnString(val);
        parentLevel[propertyNames.cardinalIndicesPropertyName][key] = cardinalIndex;
        parentLevel[propertyNames.zeroBasedIndicesPropertyName][key] = cardinalIndex - 1;
      }
    }
  }

  generateColumnIndicesOnAllArrayElements(propertyName, obj) {
    const cardinalIndices = Array.from(obj[propertyName], arrayElement => this.getCardinalIndexFromColumnString(arrayElement));
    obj[this.getCardinalIndicesPropertyName(propertyName)] = cardinalIndices;
    obj[this.getZeroBasedIndicesPropertyName(propertyName)] = Array.from(cardinalIndices, arrayElement => arrayElement - 1);
  }

  getCardinalIndexFromColumnString(columnString){
    if(isString(columnString)) {
      return columnString.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0);
    }
    return columnString;
  }

  isColumnKey(str) {
    return str.toLowerCase().endsWith(this.identifiers.column);
  }

  isColumnsKey(str) {
    return str.toLowerCase().endsWith(this.identifiers.columns);
  }

  generateRowIndicesFromNumberIdentifiers(currentLevel, parentLevel=null, propertyName='') {
    if(isObject(currentLevel)) {
      if(this.isRowsKey(propertyName)) {
        this.generateRowIndicesOnAllObjectProperties(currentLevel, parentLevel, propertyName);
      } else {
        this.generateRowIndicesOnSelectedObjectProperties(currentLevel);
      }
    } else if(isArray(currentLevel) && this.isRowsKey(propertyName)) {
      this.generateRowIndicesOnAllArrayElements(propertyName, parentLevel);
    }
  }

  generateRowIndicesOnSelectedObjectProperties(obj) {
    for(const key in obj) {
      if(this.isRowKey(key)) {
        const cardinalIndex = obj[key];
        obj[this.getCardinalIndexPropertyName(key)] = cardinalIndex;
        obj[this.getZeroBasedIndexPropertyName(key)] = cardinalIndex - 1;
      }
      this.generateRowIndicesFromNumberIdentifiers(obj[key], obj, key);
    }
  }

  generateRowIndicesOnAllObjectProperties(obj, parentLevel, propertyName) {
    const propertyNames = this.createCardinalAndZeroBasedIndicesProperties(parentLevel, propertyName);
    for(const key in obj) {
      const val = obj[key];
      if(isNumber(val)) {
        const cardinalIndex = val;
        parentLevel[propertyNames.cardinalIndicesPropertyName][key] = cardinalIndex;
        parentLevel[propertyNames.zeroBasedIndicesPropertyName][key] = cardinalIndex - 1;
      }
    }
  }

  generateRowIndicesOnAllArrayElements(propertyName, obj) {
    const cardinalIndices = obj[propertyName];
    obj[this.getCardinalIndicesPropertyName(propertyName)] = cardinalIndices;
    obj[this.getZeroBasedIndicesPropertyName(propertyName)] = Array.from(cardinalIndices, arrayElement => arrayElement - 1);
  }

  isRowKey(str) {
    return str.toLowerCase().endsWith(this.identifiers.row);
  }

  isRowsKey(str) {
    return str.toLowerCase().endsWith(this.identifiers.rows);
  }

  createCardinalAndZeroBasedIndicesProperties(parentLevel, propertyName) {
    const cardinalIndicesPropertyName = this.getCardinalIndicesPropertyName(propertyName);
    if(!parentLevel.hasOwnProperty(cardinalIndicesPropertyName)) {
      parentLevel[cardinalIndicesPropertyName] = {};
    }
    const zeroBasedIndicesPropertyName = this.getZeroBasedIndicesPropertyName(propertyName);
    if(!parentLevel.hasOwnProperty(zeroBasedIndicesPropertyName)) {
      parentLevel[zeroBasedIndicesPropertyName] = {};
    }
    return {
      cardinalIndicesPropertyName: cardinalIndicesPropertyName,
      zeroBasedIndicesPropertyName: zeroBasedIndicesPropertyName
    };
  }

  getCardinalIndexPropertyName(propertyName) {
    return propertyName + this.identifiers.cardinal + this.identifiers.index;
  }

  getZeroBasedIndexPropertyName(propertyName) {
    return propertyName + this.identifiers.zeroBased + this.identifiers.index;
  }

  getCardinalIndicesPropertyName(propertyName) {
    return propertyName.slice(0, -1) + this.identifiers.cardinal + this.identifiers.indices;
  }

  getZeroBasedIndicesPropertyName(propertyName) {
    return propertyName.slice(0, -1) + this.identifiers.zeroBased + this.identifiers.indices;
  }
}