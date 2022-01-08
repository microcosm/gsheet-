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
    id: 'colorby',
    title: 'Color by',
    options: ['Timing' , 'Work Stream']
  },
  order: {
    type: 'buttons',
    id: 'orderby',
    title: 'Order by',
    options: ['Timing' , 'Work Stream']
  }
}
*/

class Sidebar {
  constructor(uiRef) {
    this.uiRef = uiRef;
    this.titleSuffix = ' Controls';
    this.itemHtmlBuilders = {
      text: 'buildTextItemHtml',
      buttons: 'buildButtonsItemHtml' 
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
      html += this[this.itemHtmlBuilders[item.type]](item);
    }
    return html;
  }

  buildTitleHtml(title) {
    return '<h1>' + title + '</h1>';
  }

  buildButtonHtml(option) {
    return '<input type="button" value="' + option + '">';
  }

  buildTextItemHtml(item) {
    return this.buildTitleHtml(item.title) + '<p>' + item.text + '</p>';
  }

  buildButtonsItemHtml(item) {
    var html = '';
    html += this.buildTitleHtml(item.title);
    html += this.buildFormOpen(item.id);
    for(const optionName in item.options) {
      const option = item.options[optionName];
      html += this.buildButtonHtml(option);
    }
    html += this.buildFormClose();
    return html;
  }

  buildFormOpen(id) {
    return '<form id="' + id + '">';
  }

  buildFormClose() {
    return '</form>';
  }
}