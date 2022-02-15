class Style {
  constructor() {
    this.color = {
      darkestGrey: '#0c0c0c',
      darkGrey: '#999999',
      lightGrey: '#f3f3f3'
    };
    this.font = {
      default: 'Roboto Mono'
    };
  }

  getDefault(sections) {
    let styles = {
      sections: sections,
      titles: [{
        beginColumnOffset: 0,
        numColumns: 1,
        fontFamily: this.font.default,
        fontSize: 24,
        fontColor: this.color.darkestGrey,
        background: this.color.lightGrey,
        rowHeight: 55,
        border: { top: false, left: false, bottom: false, right: false, vertical: false, horizontal: false }
      }, {
        beginColumnOffset: 1,
        endColumnOffset: 1,
        fontFamily: this.font.default,
        fontSize: 1,
        fontColor: this.color.lightGrey,
        background: this.color.lightGrey,
        border: { top: false, left: false, bottom: false, right: false, vertical: false, horizontal: false }
      }, {
        numColumns: 1,
        endColumnOffset: 0,
        fontFamily: this.font.default,
        fontSize: 9,
        fontColor: null,
        background: this.color.lightGrey,
        border: { top: false, left: false, bottom: false, right: false, vertical: false, horizontal: false }
      }],
      titlesAboveBelow: [{
        fontFamily: this.font.default,
        fontSize: 1,
        fontColor: this.color.lightGrey,
        background: this.color.lightGrey,
        rowHeight: 9
      }],
      hiddenValues: [{
        fontFamily: this.font.default,
        fontSize: 1,
        fontColor: this.color.lightGrey,
        background: this.color.lightGrey
      }],
      headers: [{
        fontFamily: this.font.default,
        fontSize: 13,
        fontColor: '#ffffff',
        background: this.color.darkGrey,
        rowHeight: 56,
        border: { top: true, left: false, bottom: true, right: false, vertical: false, horizontal: false, color: '#333333', style: 'SOLID_THICK' }
      }],
      contents: [{
        fontFamily: this.font.default,
        fontSize: 9,
        fontColor: null,
        background: null,
        rowHeight: 48,
        border: { top: null, left: false, bottom: null, right: false, vertical: false, horizontal: true, color: this.color.darkGrey, style: 'SOLID' }
      }],
      underContents: [{
        fontFamily: this.font.default,
        fontSize: 1,
        fontColor: this.color.lightGrey,
        background: this.color.lightGrey,
        rowHeight: 9,
        border: { top: true, left: false, bottom: null, right: false, vertical: false, horizontal: false, color: '#333333', style: 'SOLID_THICK' }
      }],
      rowsOutside: [{
        fontFamily: this.font.default,
        fontSize: 1,
        fontColor: this.color.lightGrey,
        background: this.color.lightGrey,
        rowHeight: 9,
        border: { top: null, left: false, bottom: false, right: false, vertical: false, horizontal: false }
      }],
      columnsOutside: [{
        fontFamily: this.font.default,
        fontSize: 1,
        fontColor: this.color.lightGrey,
        background: this.color.lightGrey,
        columnWidth: 12,
        border: { top: false, left: false, bottom: false, right: false, vertical: false, horizontal: false }
      }]
    };
    return styles;
  }

  getTwoPanel(sections, numLeftColumns=1) {
    let styles = this.getDefault(sections);
    const defaultFontSize = styles.contents[0].fontSize;
    styles.contents[0].fontSize = PropertyCommand.IGNORE;
    styles.contents.push({
      beginColumnOffset: 0,
      numColumns: numLeftColumns,
      fontSize: 12
    }, {
      beginColumnOffset: numLeftColumns,
      fontSize: defaultFontSize
    });
    return styles;
  }

  getTimeline(sections) {
    let styles = {
      sections: sections,
      titlesAbove: [{
        endColumnOffset: 1,
        fontFamily: this.font.default,
        fontSize: 1,
        fontColor: this.color.lightGrey,
        background: this.color.lightGrey,
        rowHeight: 24,
        border: { top: false, left: false, bottom: null, right: false, vertical: false, horizontal: false }
      }, {
        endColumnOffset: 0,
        numColumns: 1,
        fontFamily: this.font.default,
        fontSize: 9,
        fontColor: null,
        background: this.color.lightGrey,
        border: { top: false, left: false, bottom: null, right: false, vertical: false, horizontal: false }
      }],
      titles: [{
        beginColumnOffset: 0,
        numColumns: 1,
        fontFamily: this.font.default,
        fontSize: 24,
        fontColor: this.color.darkestGrey,
        background: this.color.lightGrey,
        rowHeight: 55,
        border: { top: false, left: false, bottom: false, right: false, vertical: false, horizontal: false }
      }, {
        beginColumnOffset: 1,
        numColumns: 1,
        fontFamily: this.font.default,
        fontSize: 1,
        fontColor: this.color.lightGrey,
        background: this.color.lightGrey,
        border: { top: false, left: false, bottom: false, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }
      }, {
        beginColumnOffset: 2,
        numColumns: 1,
        fontFamily: this.font.default,
        fontSize: 7,
        fontColor: this.color.darkGrey,
        background: this.color.lightGrey,
        border: { top: true, left: true, bottom: true, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }
      }, {
        beginColumnOffset: 3,
        fontFamily: this.font.default,
        fontSize: 10,
        fontColor: null,
        background: null,
        border: { top: true, left: true, bottom: true, right: true, vertical: true, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }
      }],
      headers: [{
        beginColumnOffset: 0,
        numColumns: 2,
        fontFamily: this.font.default,
        fontSize: 1,
        fontColor: this.color.lightGrey,
        background: this.color.lightGrey,
        rowHeight: 36,
        border: { top: true, left: false, bottom: true, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }
      }, {
        beginColumnOffset: 2,
        numColumns: 1,
        fontFamily: this.font.default,
        fontSize: 10,
        fontColor: '#666666',
        background: this.color.lightGrey,
        border: { top: true, left: false, bottom: true, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }
      }, {
        beginColumnOffset: 3,
        fontFamily: this.font.default,
        fontSize: 8,
        fontColor: null,
        background: null,
        border: { top: true, left: true, bottom: true, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }
      }],
      contents: [{
        beginColumnOffset: 0,
        numColumns: 1,
        fontFamily: this.font.default,
        fontSize: 14,
        fontColor: null,
        background: null,
        border: { top: null, left: null, bottom: null, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }
      }, {
        beginColumnOffset: 1,
        numColumns: 1,
        fontFamily: this.font.default,
        fontSize: 9,
        fontColor: null,
        background: null,
        border: { top: null, left: null, bottom: null, right: true, vertical: false, horizontal: false, color: '#666666', style: 'SOLID_MEDIUM' }
      }, {
        beginColumnOffset: 2,
        numColumns: 1,
        fontFamily: this.font.default,
        fontSize: 8,
        fontColor: null,
        background: null,
        borders: [
          { top: null, left: null, bottom: null, right: null, vertical: false, horizontal: true, color: '#ffffff', style: 'SOLID' },
          { top: null, left: null, bottom: null, right: true, vertical: false, horizontal: null, color: '#b7b7b7', style: 'SOLID_MEDIUM' }
        ]
      }, {
        beginColumnOffset: 3,
        fontFamily: this.font.default,
        fontSize: 7,
        fontColor: null,
        background: null,
        rowHeight: 41,
        borders: [
          { top: null, left: null, bottom: null, right: null, vertical: false, horizontal: true, color: '#ffffff', style: 'SOLID' },
          { top: true, left: null, bottom: true, right: true, vertical: null, horizontal: null, color: '#666666', style: 'SOLID_MEDIUM' }
        ]
      }, {
        beginColumnOffset: 0,
        numColumns: 3,
        border: { top: true, left: true, bottom: true, right: null, vertical: null, horizontal: null, color: '#666666', style: 'SOLID_MEDIUM' }
      }],
      rowBottomOutside: [{
        fontFamily: this.font.default,
        fontSize: 1,
        fontColor: this.color.lightGrey,
        background: this.color.lightGrey,
        rowHeight: 9,
        border: { top: null, left: false, bottom: false, right: false, vertical: false, horizontal: false }
      }],
      columnsOutside: [{
        fontFamily: this.font.default,
        fontSize: 1,
        fontColor: this.color.lightGrey,
        background: this.color.lightGrey,
        columnWidth: 12
      }],
      matchers: [{
        match: {
          value: getMondayThisWeek(),
          column: 'C'
        },
        beginColumnOffset: 2,
        border: { top: true, left: true, bottom: true, right: true, vertical: null, horizontal: null, color: '#ea4335', style: 'SOLID_THICK' }
      }]
    };
    return styles;
  }
}