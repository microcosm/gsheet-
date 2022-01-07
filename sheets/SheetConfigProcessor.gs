/* --------------------------------------------------------- */
/*
/*   NAMING HELP
/*
/*   The words parent, child, val, parentPropertyName and
/*   childPropertyName have specific meaning across this
/*   file.
/*
/*   const config = {
/*     widgets: {
/*       todo: {
/*         columns: {
/*           time: 'B',
/*           start: 'C'
/*         }
/*         ...
/*
/*           parent
/*             |                       child
/*             v                         |
/*       todo: {                         v
/*         columns:<--parentPropertyName {
/*           time:<--childPropertyName       'B',  <--val
/*           start:<--childPropertyName      'C'   <--val
/*         }
/*         ...
/*
/* --------------------------------------------------------- */

class SheetConfigProcessor {
  constructor(config) {
    this.config = config;
    this.identifiers = {
      index:     'Index',
      indices:   'Indices',
      cardinal:  'Cardinal',
      zeroBased: 'ZeroBased',
      column:    'column',
      columns:   'columns',
      row:       'row',
      rows:      'rows'
    }
  }

  process() {
    this.createIndicesVersionsOfAllColumns(this.config);
    this.createIndicesVersionsOfAllRows(this.config);
  }

/* --------------------------------------------------------- */
/*   COLUMN RECURSION
/* --------------------------------------------------------- */
  createIndicesVersionsOfAllColumns(child, parent=null, parentPropertyName='') {
    if(isObject(child)) {
      if(this.isColumnsPropertyName(parentPropertyName)) {
        this.createColumnIndicesVersionsOfParent(child, parent, parentPropertyName);
      } else {
        this.createColumnIndicesVersionsOfChildValuePropertiesAndRecurseOthers(child);
      }
    } else if(isArray(child) && this.isColumnsPropertyName(parentPropertyName)) {
      this.createColumnIndicesVersionsOfParentArray(child, parentPropertyName, parent);
    }
  }

/* --------------------------------------------------------- */
/*   columns: {
/*     name:  'B',
/*     place: 'C'
/*   }
/*
/*       //becomes:
/*
/*   columns:                { name: 'B', place: 'C' },
/*   columnCardinalIndices:  { name:  2,  place:  3  },
/*   columnZeroBasedIndices: { name:  1,  place:  2  }
/* --------------------------------------------------------- */
  createColumnIndicesVersionsOfParent(child, parent, parentPropertyName) {
    const parentPropertyNames = this.createCardinalAndZeroBasedIndicesProperties(parent, parentPropertyName);
    for(const childPropertyName in child) {
      const val = child[childPropertyName];
      if(isString(val)) {
        const cardinalIndex = this.getCardinalIndexFromColumnString(val);
        parent[parentPropertyNames.cardinalIndicesPropertyName][childPropertyName] = cardinalIndex;
        parent[parentPropertyNames.zeroBasedIndicesPropertyName][childPropertyName] = cardinalIndex - 1;
      }
    }
  }

/* --------------------------------------------------------- */
/*   person: {
/*     nameColumn:  'B',
/*     placeColumn: 'C',
/*     alertStr: 'OK'
/*   }
/*
/*      //becomes:
/*
/*   person: {
/*     nameColumn:               'B',
/*     nameColumnCardinalIndex:   2,
/*     nameColumnZeroBasedIndex:  1,
/*     placeColumn:              'C',
/*     placeColumnCardinalIndex:  3,
/*     placeColumnZeroBasedIndex: 2,
/*     alertStr: 'OK' //not processed
/*   }
/* --------------------------------------------------------- */
  createColumnIndicesVersionsOfChildValuePropertiesAndRecurseOthers(child) {
    for(const childPropertyName in child) {
      if(this.isColumnPropertyName(childPropertyName)) {
        const cardinalIndex = this.getCardinalIndexFromColumnString(child[childPropertyName]);
        child[this.getCardinalIndexPropertyName(childPropertyName)] = cardinalIndex;
        child[this.getZeroBasedIndexPropertyName(childPropertyName)] = cardinalIndex - 1;
      } else {
        this.createIndicesVersionsOfAllColumns(child[childPropertyName], child, childPropertyName);
      }
    }
  }

/* --------------------------------------------------------- */
/*   personColumns: ['B', 'C', 'D']
/*
/*      //becomes:
/*
/*   personColumns:                ['B', 'C', 'D'],
/*   personColumnCardinalIndices:  [ 2,   3,   4 ],
/*   personColumnZeroBasedIndices: [ 1,   2,   3 ]
/* --------------------------------------------------------- */
  createColumnIndicesVersionsOfParentArray(child, parentPropertyName, parent) {
    const cardinalIndices = Array.from(child, arrayElement => this.getCardinalIndexFromColumnString(arrayElement));
    parent[this.getCardinalIndicesPropertyName(parentPropertyName)] = cardinalIndices;
    parent[this.getZeroBasedIndicesPropertyName(parentPropertyName)] = Array.from(cardinalIndices, arrayElement => arrayElement - 1);
  }

/* --------------------------------------------------------- */
/*   args like 'A' 'B' 'C' or 'Z' 'AA'
/*
/*   return     1   2   3      26  27
/* --------------------------------------------------------- */
  getCardinalIndexFromColumnString(columnString){
    if(isString(columnString)) {
      return columnString.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0);
    }
    return columnString;
  }

/* --------------------------------------------------------- */
/*   ROW RECURSION
/* --------------------------------------------------------- */
  createIndicesVersionsOfAllRows(child, parent=null, parentPropertyName='') {
    if(isObject(child)) {
      if(this.isRowsPropertyName(parentPropertyName)) {
        this.createRowIndicesVersionsOfParent(child, parent, parentPropertyName);
      } else {
        this.createRowIndicesVersionsOfChildValuePropertiesAndRecurseOthers(child);
      }
    } else if(isArray(child) && this.isRowsPropertyName(parentPropertyName)) {
      this.createRowIndicesVersionsOfParentArray(child, parentPropertyName, parent);
    }
  }

/* --------------------------------------------------------- */
/*   rows: {
/*     name:  2,
/*     place: 3
/*   }
/*
/*       //becomes:
/*
/*   rows:                { name: 2, place: 3 },
/*   rowCardinalIndices:  { name: 2, place: 3 },
/*   rowZeroBasedIndices: { name: 1, place: 2 }
/* --------------------------------------------------------- */
  createRowIndicesVersionsOfParent(child, parent, parentPropertyName) {
    const parentPropertyNames = this.createCardinalAndZeroBasedIndicesProperties(parent, parentPropertyName);
    for(const childPropertyName in child) {
      const val = child[childPropertyName];
      if(isNumber(val)) {
        const cardinalIndex = val;
        parent[parentPropertyNames.cardinalIndicesPropertyName][childPropertyName] = cardinalIndex;
        parent[parentPropertyNames.zeroBasedIndicesPropertyName][childPropertyName] = cardinalIndex - 1;
      }
    }
  }

/* --------------------------------------------------------- */
/*   person: {
/*     nameRow:  2,
/*     placeRow: 3,
/*     alertStr: 'OK'
/*   }
/*
/*      //becomes:
/*
/*   person: {
/*     nameRow:                2,
/*     nameRowCardinalIndex:   2,
/*     nameRowZeroBasedIndex:  1,
/*     placeRow:               3,
/*     placeRowCardinalIndex:  3,
/*     placeRowZeroBasedIndex: 2,
/*     alertStr: 'OK' //not processed
/*   }
/* --------------------------------------------------------- */
  createRowIndicesVersionsOfChildValuePropertiesAndRecurseOthers(child) {
    for(const childPropertyName in child) {
      if(this.isRowPropertyName(childPropertyName)) {
        const cardinalIndex = child[childPropertyName];
        child[this.getCardinalIndexPropertyName(childPropertyName)] = cardinalIndex;
        child[this.getZeroBasedIndexPropertyName(childPropertyName)] = cardinalIndex - 1;
      } else {
        this.createIndicesVersionsOfAllRows(child[childPropertyName], child, childPropertyName);
      }
    }
  }

/* --------------------------------------------------------- */
/*   personRows: [2, 3, 4]
/*
/*      //becomes:
/*
/*   personRows:                [2, 3, 4],
/*   personRowCardinalIndices:  [2, 3, 4],
/*   personRowZeroBasedIndices: [1, 2, 3]
/* --------------------------------------------------------- */
  createRowIndicesVersionsOfParentArray(child, parentPropertyName, parent) {
    const cardinalIndices = child;
    parent[this.getCardinalIndicesPropertyName(parentPropertyName)] = cardinalIndices;
    parent[this.getZeroBasedIndicesPropertyName(parentPropertyName)] = Array.from(cardinalIndices, arrayElement => arrayElement - 1);
  }

/* --------------------------------------------------------- */
/*   NON-ROW/COLUMN SPECIFIC
/* --------------------------------------------------------- */
  createCardinalAndZeroBasedIndicesProperties(parent, parentPropertyName) {
    const cardinalIndicesPropertyName = this.getCardinalIndicesPropertyName(parentPropertyName);
    if(!parent.hasOwnProperty(cardinalIndicesPropertyName)) {
      parent[cardinalIndicesPropertyName] = {};
    }
    const zeroBasedIndicesPropertyName = this.getZeroBasedIndicesPropertyName(parentPropertyName);
    if(!parent.hasOwnProperty(zeroBasedIndicesPropertyName)) {
      parent[zeroBasedIndicesPropertyName] = {};
    }
    return {
      cardinalIndicesPropertyName: cardinalIndicesPropertyName,
      zeroBasedIndicesPropertyName: zeroBasedIndicesPropertyName
    };
  }

  isColumnPropertyName(str) {
    return str.toLowerCase().endsWith(this.identifiers.column);
  }

  isColumnsPropertyName(str) {
    return str.toLowerCase().endsWith(this.identifiers.columns);
  }

  isRowPropertyName(str) {
    return str.toLowerCase().endsWith(this.identifiers.row);
  }

  isRowsPropertyName(str) {
    return str.toLowerCase().endsWith(this.identifiers.rows);
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