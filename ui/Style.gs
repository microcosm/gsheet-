class Style {
  constructor() {
    this.color = {
      darkestGrey: '#0c0c0c',
      darkGrey: '#999999',
      lightGrey: '#f3f3f3'
    };
    this.font = {
      family: 'Roboto Mono'
    };
    this.border = {
      empty: { top: false, left: false, bottom: false, right: false, vertical: false, horizontal: false },
      thinPanelDivider: { top: null, left: true, bottom: null, right: null, vertical: null, horizontal: null, color: '#999999', style: 'SOLID' },
      thickPanelDivider: { top: null, left: true, bottom: null, right: null, vertical: null, horizontal: null, color: '#999999', style: 'SOLID_MEDIUM' },
      thinVerticalDivider: { top: null, left: null, bottom: null, right: null, vertical: true, horizontal: null, color: '#cccccc', style: 'SOLID' }
    };
    this.alignment = {
      vertical: {
        top: 'top',
        middle: 'middle',
        bottom: 'bottom'
      },
      horizontal: {
        left: 'left',
        center: 'center',
        right: 'right'
      }
    };
  }

  getBlank(append={}) {
    let style = {
      fontFamily: this.font.family,
      fontSize: 1,
      fontColor: this.color.lightGrey,
      background: this.color.lightGrey,
      verticalAlignment: this.alignment.vertical.middle
    }
    return Object.assign(style, append);
  }

  getBare(sections) {
    let styles = {
      sections: sections,
      titles: {
        all: {
          fontFamily: this.font.family,
          rowHeight: 39,
          verticalAlignment: this.alignment.vertical.middle
        }
      },
      headers: {
        all: {
          fontFamily: this.font.family,
          rowHeight: 39,
          verticalAlignment: this.alignment.vertical.middle
        }
      },
      contents: {
        all: {
          fontFamily: this.font.family,
          fontSize: 9,
          rowHeight: 23,
          verticalAlignment: this.alignment.vertical.middle
        }
      },
      rowsOutside: {
        all: this.getBlank({ rowHeight: 9, border: { top: null, left: false, bottom: false, right: false, vertical: false, horizontal: false }})
      },
      columnsOutside: {
        all: this.getBlank({ columnWidth: 12, border: { top: false, left: false, bottom: false, right: false, vertical: false, horizontal: false }})
      }
    };
    return styles;
  }

  getDefault(sections) {
    let styles = {
      sections: sections,
      titles: {
        title: {
          beginColumnOffset: 0,
          numColumns: 1,
          fontFamily: this.font.family,
          fontSize: 24,
          fontColor: this.color.darkestGrey,
          background: this.color.lightGrey,
          verticalAlignment: this.alignment.vertical.bottom,
          horizontalAlignment: this.alignment.horizontal.left,
          rowHeight: 55,
          borders: [{ top: false, left: false, bottom: false, right: false, vertical: false, horizontal: false }]
        },
        review: {
          numColumns: 1,
          endColumnOffset: 0,
          fontFamily: this.font.family,
          fontSize: 9,
          fontColor: null,
          background: this.color.lightGrey,
          verticalAlignment: this.alignment.vertical.bottom,
          borders: [{ top: false, left: false, bottom: false, right: false, vertical: false, horizontal: false }]
        },
        between: this.getBlank({ beginColumnOffset: 1, endColumnOffset: 1, border: this.border.empty })
      },
      headers: {
        all: {
          fontFamily: this.font.family,
          fontSize: 13,
          fontColor: '#ffffff',
          background: this.color.darkGrey,
          verticalAlignment: this.alignment.vertical.bottom,
          rowHeight: 56,
          borders: [{ top: true, left: false, bottom: true, right: false, vertical: false, horizontal: false, color: '#333333', style: 'SOLID_THICK' }]
        }
      },
      contents: {
        all: {
          fontFamily: this.font.family,
          fontSize: 9,
          fontColor: null,
          background: null,
          verticalAlignment: this.alignment.vertical.middle,
          rowHeight: 48,
          borders: [{ top: null, left: false, bottom: null, right: false, vertical: false, horizontal: true, color: this.color.darkGrey, style: 'SOLID' }]
        }
      },
      titlesAboveBelow: {
        all: this.getBlank({ rowHeight: 9, borders: [{ top: null, left: false, bottom: null, right: false, vertical: false, horizontal: false }] })
      },
      hiddenValues: {
        all: this.getBlank()
      },
      underContents: {
        all: this.getBlank({ rowHeight: 9, borders: [{ top: true, left: false, bottom: null, right: false, vertical: false, horizontal: false, color: '#333333', style: 'SOLID_THICK' }] })
      },
      rowsOutside: {
        all: this.getBlank({ rowHeight: 9, borders: [{ top: null, left: false, bottom: false, right: false, vertical: false, horizontal: false }] })
      },
      columnsOutside: {
        all: this.getBlank({ columnWidth: 12, borders: [{ top: false, left: false, bottom: false, right: false, vertical: false, horizontal: false }] })
      }
    };
    return styles;
  }

  getTwoPanel(sections, numLeftColumns=1) {
    let styles = this.getDefault(sections);
    styles.contents.all.fontSize = PropertyCommand.IGNORE;
    styles.contents.left = {
      beginColumnOffset: 0,
      numColumns: numLeftColumns
    };
    styles.contents.right = {
      beginColumnOffset: numLeftColumns,
      borders: [this.border.thickPanelDivider]
    };
    styles.headers.left = Object.assign({}, styles.contents.left);
    styles.headers.right = Object.assign({}, styles.contents.right);
    return styles;
  }

  getThreePanel(sections, numLeftColumns=1, numMidColumns=1) {
    let styles = this.getDefault(sections);
    styles.contents.all.fontSize = PropertyCommand.IGNORE;
    styles.contents.left = {
      beginColumnOffset: 0,
      numColumns: numLeftColumns,
    };
    styles.contents.middle = {
      beginColumnOffset: numLeftColumns,
      numColumns: numMidColumns,
      borders: [this.border.thickPanelDivider]
    };
    styles.contents.right = {
      beginColumnOffset: numLeftColumns + numMidColumns,
      borders: [this.border.thickPanelDivider]
    };
    styles.headers.left = Object.assign({}, styles.contents.left);
    styles.headers.middle = Object.assign({}, styles.contents.middle);
    styles.headers.right = Object.assign({}, styles.contents.right);
    return styles;
  }

  getFourPanel(sections, numLeftColumns=1, numLeftMidColumns=1, numRightMidColumns=1) {
    let styles = this.getDefault(sections);
    styles.contents.all.fontSize = PropertyCommand.IGNORE;
    styles.contents.left = {
      beginColumnOffset: 0,
      numColumns: numLeftColumns,
    };
    styles.contents.leftMiddle = {
      beginColumnOffset: numLeftColumns,
      numColumns: numLeftMidColumns,
      borders: [this.border.thickPanelDivider]
    };
    styles.contents.rightMiddle = {
      beginColumnOffset: numLeftColumns + numLeftMidColumns,
      numColumns: numRightMidColumns,
      borders: [this.border.thickPanelDivider]
    };
    styles.contents.right = {
      beginColumnOffset: numLeftColumns + numLeftMidColumns + numRightMidColumns,
      borders: [this.border.thickPanelDivider]
    };
    styles.headers.left = Object.assign({}, styles.contents.left);
    styles.headers.leftMiddle = Object.assign({}, styles.contents.leftMiddle);
    styles.headers.rightMiddle = Object.assign({}, styles.contents.rightMiddle);
    styles.headers.right = Object.assign({}, styles.contents.right);
    return styles;
  }

  getTimeline(sections) {
    let styles = {
      sections: sections,
      titlesAbove: {
        review: {
          beginColumnOffset: 2,
          numColumns: 1,
          fontFamily: this.font.family,
          fontSize: 9,
          fontColor: null,
          background: this.color.lightGrey,
          borders: [{ top: false, left: false, bottom: null, right: false, vertical: false, horizontal: false }]
        },
        left: this.getBlank({ beginColumnOffset: 0, numColumns: 2, rowHeight: 24, border: { top: false, left: false, bottom: null, right: false, vertical: false, horizontal: false }}),
        right: this.getBlank({ beginColumnOffset: 3, rowHeight: 24, border: { top: false, left: false, bottom: null, right: false, vertical: false, horizontal: false }})
      },
      titles: {
        title: {
          beginColumnOffset: 0,
          numColumns: 2,
          fontFamily: this.font.family,
          fontSize: 24,
          fontColor: this.color.darkestGrey,
          background: this.color.lightGrey,
          verticalAlignment: this.alignment.vertical.bottom,
          horizontalAlignment: this.alignment.horizontal.left,
          rowHeight: 55,
          borders: [{ top: false, left: false, bottom: false, right: false, vertical: false, horizontal: false }]
        },
        filter: {
          beginColumnOffset: 2,
          numColumns: 1,
          fontFamily: this.font.family,
          fontSize: 7,
          fontColor: this.color.darkGrey,
          background: this.color.lightGrey,
          verticalAlignment: this.alignment.vertical.top,
          horizontalAlignment: this.alignment.horizontal.left,
          borders: [{ top: true, left: true, bottom: true, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }]
        },
        displayHeadings: {
          beginColumnOffset: 3,
          fontFamily: this.font.family,
          fontSize: 10,
          fontColor: null,
          background: null,
          verticalAlignment: this.alignment.vertical.bottom,
          horizontalAlignment: this.alignment.horizontal.center,
          borders: [{ top: true, left: true, bottom: true, right: true, vertical: true, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }]
        }
      },
      headers: {
        left: this.getBlank({ beginColumnOffset: 0, numColumns: 2, rowHeight: 36, border: { top: true, left: false, bottom: true, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }}),
        year: {
          beginColumnOffset: 2,
          numColumns: 1,
          fontFamily: this.font.family,
          fontSize: 10,
          fontColor: '#666666',
          background: this.color.lightGrey,
          verticalAlignment: this.alignment.vertical.middle,
          horizontalAlignment: this.alignment.horizontal.center,
          rowHeight: 36,
          borders: [{ top: true, left: false, bottom: true, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }]
        },
        realHeadings: {
          beginColumnOffset: 3,
          fontFamily: this.font.family,
          fontSize: 8,
          fontColor: null,
          background: null,
          verticalAlignment: this.alignment.vertical.middle,
          horizontalAlignment: this.alignment.horizontal.center,
          borders: [{ top: true, left: true, bottom: true, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }]
        }
      },
      contents: {
        months: {
          beginColumnOffset: 0,
          numColumns: 1,
          fontFamily: this.font.family,
          fontSize: 14,
          fontColor: null,
          background: null,
          verticalAlignment: this.alignment.vertical.middle,
          horizontalAlignment: this.alignment.horizontal.center,
          columnWidth: 95,
          borders: [{ top: null, left: null, bottom: null, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }]
        },
        weeks: {
          beginColumnOffset: 1,
          numColumns: 1,
          fontFamily: this.font.family,
          fontSize: 9,
          fontColor: null,
          background: null,
          verticalAlignment: this.alignment.vertical.middle,
          horizontalAlignment: this.alignment.horizontal.right,
          columnWidth: 70,
          borders: [{ top: null, left: null, bottom: null, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }]
        },
        calendarSync: {
          beginColumnOffset: 2,
          numColumns: 1,
          fontFamily: this.font.family,
          fontSize: 8,
          fontColor: null,
          background: null,
          verticalAlignment: this.alignment.vertical.middle,
          horizontalAlignment: this.alignment.horizontal.left,
          columnWidth: 180,
          borders: [{ top: null, left: null, bottom: null, right: null, vertical: false, horizontal: true, color: '#ffffff', style: 'SOLID' }]
        },
        main: {
          beginColumnOffset: 3,
          fontFamily: this.font.family,
          fontSize: 7,
          fontColor: null,
          background: null,
          verticalAlignment: this.alignment.vertical.middle,
          horizontalAlignment: this.alignment.horizontal.center,
          rowHeight: 41,
          columnWidth: 105,
          borders: [
            { top: null, left: null, bottom: null, right: null, vertical: false, horizontal: true, color: '#ffffff', style: 'SOLID' },
            { top: true, left: true, bottom: true, right: true, vertical: null, horizontal: null, color: '#666666', style: 'SOLID_MEDIUM' }
          ]
        },
        borderOverlay: {
          beginColumnOffset: 0,
          numColumns: 3,
          borders: [{ top: true, left: true, bottom: true, right: null, vertical: null, horizontal: null, color: '#666666', style: 'SOLID_MEDIUM' }]
        }
      },
      rowBottomOutside: {
        all: this.getBlank({ rowHeight: 9, border: { top: null, left: false, bottom: false, right: false, vertical: false, horizontal: false }})
      },
      columnsOutside: {
        all: this.getBlank({ columnWidth: 12 })
      },
      rowMatchers: {
        currentWeekForRedBorder: {
          match: {
            value: getMondayThisWeek(),
            column: 'C'
          },
          beginColumnOffset: 2,
          borders: [{ top: true, left: true, bottom: true, right: true, vertical: null, horizontal: null, color: '#ea4335', style: 'SOLID_THICK' }]
        }
      }
    };
    return styles;
  }
}