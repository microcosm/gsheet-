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
    this.htmlBuilder = new SidebarHtmlBuilder(uiRef);
  }

  onShowSidebar() {
    const html = this.htmlBuilder.buildHtml(state.activeSheet.config.sidebar);
    var widget = HtmlService.createHtmlOutput(html);
    widget.setTitle(state.activeSheet.name + this.titleSuffix);
    this.uiRef.showSidebar(widget);
  }

  onSidebarSubmit(e) {
    logString(e);
  }
}

class SidebarHtmlBuilder {
  constructor(uiRef) {
    this.itemHtmlBuilders = {
      text: 'buildTextItemHtml',
      buttons: 'buildButtonsItemHtml' 
    };
    this.bodyMarker = '<x>';
    this.htmlTemplate = this.getHtmlTemplate();
  }

  buildHtml(config) {
    var html = '';
    for(const itemName in config) {
      const item = config[itemName];
      html += this[this.itemHtmlBuilders[item.type]](item);
    }
    return this.wrapWithTemplate(html);
  }

  buildTitleHtml(title) {
    return `<h1>` + title + `</h1>`;
  }

  buildButtonHtml(option) {
    return `<input type='button' onclick='submitForm();' value='` + option + `'>`;
  }

  buildTextItemHtml(item) {
    return this.buildTitleHtml(item.title) + `<p>` + item.text + `</p>`;
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
    return `<form id='sidebar'>`;
  }

  buildFormClose() {
    return `</form>`;
  }

  wrapWithTemplate(html) {
    return this.htmlTemplate.replace(this.bodyMarker, html);
  }

  getHtmlTemplate() {
    return `<!DOCTYPE html>
<html>
 <head>
   <base target='_top'>
   <script>
     function submitForm() {
       google.script.run.onSidebarSubmit(document.getElementById('sidebar'));
     }
   </script>
 </head>
 <body>
   ` + this.bodyMarker + `
 </body>
</html>`;
  }
}