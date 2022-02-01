/* --------------------------------------------------------- */
/*
/*   NAMING HELP
/*
/*   The words parent, child, parentPropertyName,
/*   childPropertyName and childPropertyValue have specific
/*   meaning across this file.
/*
/*   const config = {
/*     widgets: {
/*       todo: {
/*         columns: {
/*           time: 'B',
/*           start: 'C'
/*         }
/*       },
/*       more: [{ id: 4 }, 'D' ]
/*         ...
/*
/*           parent
/*             |                       child
/*             v                         |
/*       todo: {                         v
/*         columns:<--parentPropertyName {
/*           time:<--childPropertyName       'B',  <--childPropertyValue
/*           start:<--childPropertyName      'C'   <--childPropertyValue
/*         }
/*       },
/*       more: [{ id: 4 }, 'D' ]      <--- childValue(s) of array
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
    };
    this.defaults = {};
  }

  process() {
    this.ensureAndTrimDefaults();
    this.buildFeatureClassArrays();
    this.buildColumnAndRowIndexObjects();
  }

/* --------------------------------------------------------- */
/*   DEFAULTS
/*   ========
/*   Apply default values to config in this format if needed:
/*
/*   this.defaults = {
/*     sidebar: {
/*       default: {
/*         type: 'text',
/*         title: 'Sorry',
/*         text: 'Some text.'
/*       }
/*     }
/*   };
/* --------------------------------------------------------- */
  ensureAndTrimDefaults() {
    this.ensureDefaultsIn(this.defaults, this.config);
  }

  ensureDefaultsIn(defaults, config) {
    for(const propertyName in defaults) {
      const propertyValue = defaults[propertyName];
      if(!config.hasOwnProperty(propertyName)) {
        config[propertyName] = propertyValue;
      }
      if(isObject(propertyValue)) {
        this.ensureDefaultsIn(propertyValue, config[propertyName]);
      }
    }
  }

/* --------------------------------------------------------- */
/*   FEATURES
/*   ========
/* --------------------------------------------------------- */
  buildFeatureClassArrays() {
    this.config.featureClasses = [];
    this.buildFeatureClassArraysFrom(this.config);
  }

  buildFeatureClassArraysFrom(config) {
    for(const propertyName in config) {
      const propertyValue = config[propertyName];
      if(propertyName === 'feature' || propertyName === 'features') {
        Object.keys(propertyValue).forEach(featureName => {
          pushIfNew(this.config.featureClasses, FeatureClass[featureName]);
        });
      }
      if(isObject(propertyValue)) {
        this.buildFeatureClassArraysFrom(propertyValue);
      }
    }
  }

/* --------------------------------------------------------- */
/*   INDEX OBJECT BUILD & REPLACEMENTS
/*   =================================
/* --------------------------------------------------------- */

  buildColumnAndRowIndexObjects() {
    this.buildIndexObjectForColumnsIn(this.config);
    this.buildIndexObjectForRowsIn(this.config);
  }

/* --------------------------------------------------------- */
/*   COLUMN RECURSION
/* --------------------------------------------------------- */
  buildIndexObjectForColumnsIn(child, parent=null, parentPropertyName='') {
    if(isObject(child)) {
      if(this.isColumnsPropertyName(parentPropertyName)) {
        this.replaceColumnsObjectWithIndicesObject(child, parent, parentPropertyName);
      } else {
        this.replaceColumnValuePropertiesAndRecurseObjectProperties(child);
      }
    } else if(isArray(child)) {
      if(this.isColumnsPropertyName(parentPropertyName)) {
        this.replaceColumnsArrayWithIndicesObject(child, parent, parentPropertyName);
      } else {
        for(const childValue of child) {
          this.buildIndexObjectForColumnsIn(childValue, child);
        }
      }
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
/*   columns: {
/*     asConfig:         { name: 'B', place: 'C' },
/*     cardinalIndices:  { name:  2,  place:  3  },
/*     zeroBasedIndices: { name:  1,  place:  2  }
/*   }
/* --------------------------------------------------------- */
  replaceColumnsObjectWithIndicesObject(child, parent, parentPropertyName) {
    const replacementChild = this.getNewIndicesReplacementObject(child);
    for(const childPropertyName in child) {
      const childPropertyValue = child[childPropertyName];
      const cardinalIndex = this.getCardinalIndexFromColumnString(childPropertyValue);
      replacementChild.cardinalIndices[childPropertyName] = cardinalIndex;
      replacementChild.zeroBasedIndices[childPropertyName] = cardinalIndex - 1;
    }
    parent[parentPropertyName] = replacementChild;
  }

/* --------------------------------------------------------- */
/*   person: {
/*     nameColumn:  'B',
/*     placeColumn: 'C',
/*     alertStr:    'OK'
/*   }
/*
/*      //becomes:
/*
/*   person: {
/*     nameColumn: {
/*       asConfig:      'B',
/*       cardinalIndex:  2,
/*       zeroBasedIndex: 1
/*     },
/*     placeColumn: {
/*       asConfig:      'C',
/*       cardinalIndex:  3,
/*       zeroBasedIndex: 2
/*     },
/*     alertStr: 'OK' //not processed
/*   }
/* --------------------------------------------------------- */
  replaceColumnValuePropertiesAndRecurseObjectProperties(child) {
    for(const childPropertyName in child) {
      const childPropertyValue = child[childPropertyName];
      if(this.isColumnPropertyName(childPropertyName)) {
        const replacementChild = this.getNewIndexReplacementObject(childPropertyValue);
        const cardinalIndex = this.getCardinalIndexFromColumnString(childPropertyValue);
        replacementChild.cardinalIndex = cardinalIndex;
        replacementChild.zeroBasedIndex = cardinalIndex - 1;
        child[childPropertyName] = replacementChild;
      } else {
        this.buildIndexObjectForColumnsIn(childPropertyValue, child, childPropertyName);
      }
    }
  }

/* --------------------------------------------------------- */
/*   personColumns: ['B', 'C', 'D']
/*
/*      //becomes:
/*
/*   personColumns: {
/*     asConfig:         ['B', 'C', 'D'],
/*     cardinalIndices:  [ 2,   3,   4 ],
/*     zeroBasedIndices: [ 1,   2,   3 ]
/*   }
/* --------------------------------------------------------- */
  replaceColumnsArrayWithIndicesObject(child, parent, parentPropertyName) {
    const replacementChild = this.getNewIndicesReplacementObject(child);
    const cardinalIndices = Array.from(child, element => this.getCardinalIndexFromColumnString(element));
    replacementChild.cardinalIndices = cardinalIndices;
    replacementChild.zeroBasedIndices = Array.from(cardinalIndices, element => element - 1);;
    parent[parentPropertyName] = replacementChild;
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
  buildIndexObjectForRowsIn(child, parent=null, parentPropertyName='') {
    if(isObject(child)) {
      if(this.isRowsPropertyName(parentPropertyName)) {
        this.replaceRowsObjectWithIndicesObject(child, parent, parentPropertyName);
      } else {
        this.replaceRowValuePropertiesAndRecurseObjectProperties(child);
      }
    } else if(isArray(child)) {
      if(this.isRowsPropertyName(parentPropertyName)) {
        this.replaceRowsArrayWithIndicesObject(child, parent, parentPropertyName);
      } else {
        for(const childValue of child) {
          this.buildIndexObjectForRowsIn(childValue, child);
        }
      }
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
/*   rows: {
/*     asConfig:         { name: 2, place: 3 },
/*     cardinalIndices:  { name: 2, place: 3 },
/*     zeroBasedIndices: { name: 1, place: 2 }
/*   }
/* --------------------------------------------------------- */
  replaceRowsObjectWithIndicesObject(child, parent, parentPropertyName) {
    const replacementChild = this.getNewIndicesReplacementObject(child);
    for(const childPropertyName in child) {
      const childPropertyValue = child[childPropertyName];
      const cardinalIndex = childPropertyValue;
      replacementChild.cardinalIndices[childPropertyName] = cardinalIndex;
      replacementChild.zeroBasedIndices[childPropertyName] = cardinalIndex - 1;
    }
    parent[parentPropertyName] = replacementChild;
  }

/* --------------------------------------------------------- */
/*   person: {
/*     nameRow:   2,
/*     placeRow:  3,
/*     alertStr: 'OK'
/*   }
/*
/*      //becomes:
/*
/*   person: {
/*     nameRow: {
/*       asConfig:       2,
/*       cardinalIndex:  2,
/*       zeroBasedIndex: 1
/*     },
/*     placeRow: {
/*       asConfig:       3,
/*       cardinalIndex:  3,
/*       zeroBasedIndex: 2
/*     },
/*     alertStr: 'OK' //not processed
/*   }
/* --------------------------------------------------------- */
  replaceRowValuePropertiesAndRecurseObjectProperties(child) {
    for(const childPropertyName in child) {
      const childPropertyValue = child[childPropertyName];
      if(this.isRowPropertyName(childPropertyName)) {
        const replacementChild = this.getNewIndexReplacementObject(childPropertyValue);
        const cardinalIndex = childPropertyValue;
        replacementChild.cardinalIndex = cardinalIndex;
        replacementChild.zeroBasedIndex = cardinalIndex - 1;
        child[childPropertyName] = replacementChild;
      } else {
        this.buildIndexObjectForRowsIn(childPropertyValue, child, childPropertyName);
      }
    }
  }

/* --------------------------------------------------------- */
/*   personRows: [2, 3, 4]
/*
/*      //becomes:
/*
/*   personRows: {
/*     asConfig:         [2, 3, 4],
/*     cardinalIndices:  [2, 3, 4],
/*     zeroBasedIndices: [1, 2, 3]
/*   }
/* --------------------------------------------------------- */
  replaceRowsArrayWithIndicesObject(child, parent, parentPropertyName) {
    const replacementChild = this.getNewIndicesReplacementObject(child);
    const cardinalIndices = child;
    replacementChild.cardinalIndices = cardinalIndices;
    replacementChild.zeroBasedIndices = Array.from(cardinalIndices, element => element - 1);;
    parent[parentPropertyName] = replacementChild;
  }

/* --------------------------------------------------------- */
/*   NON-ROW/COLUMN SPECIFIC
/* --------------------------------------------------------- */
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

  getNewIndexReplacementObject(asConfig) {
    return {
      asConfig: asConfig,
      cardinalIndex: null,
      zeroBasedIndex: null
    };
  }

  getNewIndicesReplacementObject(asConfig) {
    return {
      asConfig: asConfig,
      cardinalIndices: {},
      zeroBasedIndices: {}
    };
  }
}