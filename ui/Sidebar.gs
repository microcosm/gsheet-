/* 
SAMPLE CONFIG

sidebar: {
  guidance: {
    type: 'text',
    title: 'Usage Guidance',
    text: 'This is guidance text on a sheet.'
  },
  color: {
    type: 'buttons',
    title: 'Color by',
    options: ['Timing' , 'Work Stream']
  },
  order: {
    type: 'buttons',
    title: 'Order by',
    options: ['Timing' , 'Work Stream']
  }
}
*/

class Sidebar {
  constructor(uiRef) {
    this.uiRef = uiRef;
    this.titleSuffix = ' Controls';
    this.htmlBuilders = {
      text: this.buildTextItemHtml,
      buttons: this.buildButtonsItemHtml 
    };
  }

  onShowSidebar() {
    const html = this.buildHtml(state.activeSheet.config.sidebar);
    var widget = HtmlService.createHtmlOutput(html);
    widget.setTitle(state.activeSheet.name + this.titleSuffix);
    this.uiRef.showSidebar(widget);
  }

  buildHtml(config) {
    var html = '';
    for(const itemName in config) {
      const item = config[itemName];
      html += this.htmlBuilders[item.type](item);
    }
    return html;
  }

  buildTextItemHtml(item) {
    return '<h1>' + item.title + '</h1>' +
           '<p>' + item.text + '</p>';
  }

  buildButtonsItemHtml(item) {
    return '<h1>' + item.title + '</h1>' +
           '<p>TODO</p>';
  }
}