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
    this.htmlBuilder = new SidebarHtmlBuilder(uiRef);
  }

  onShowSidebar() {
    const html = this.htmlBuilder.buildHtml(state.activeSheet.config.sidebar);
    var widget = HtmlService.createHtmlOutput(html);
    widget.setTitle(state.activeSheet.name + this.titleSuffix);
    this.uiRef.showSidebar(widget);
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

  getFeatureArgumentStr(item) {
    if(!item.hasOwnProperty('feature')) throw 'Item needs a feature';
    return Object.keys(item.feature)[0];
  }

  buildHtml(config) {
    this.config = config;
    var html = '';
    html += this.buildFormOpen();
    for(const itemName in this.config) {
      this.currentItemName = itemName;
      const item = this.config[itemName];
      if(item) html += this[this.itemHtmlBuilders[item.type]](item);
    }
    html += this.buildFormClose();
    return this.wrapWithTemplate(html);
  }

  buildTitleHtml(item) {
    return `<h1>` + item.title + `</h1>`;
  }

  buildTextItemHtml(item) {
    return this.buildTitleHtml(item) + `<p>` + item.text + `</p>`;
  }

  buildButtonsItemHtml(item) {
    var html = '';
    html += this.buildTitleHtml(item);
    for(const optionName in item.options) {
      const option = item.options[optionName];
      html += this.buildButtonHtml(item, option);
    }
    return html;
  }

  buildButtonHtml(item, option) {
    return `<input type='button' class='inline' onclick='submitForm("` + this.getFeatureArgumentStr(item) + `", "` + this.currentItemName + `");' value='` + option + `'>`;
  }

  buildFormOpen() {
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
    <link rel='stylesheet' href='https://ssl.gstatic.com/docs/script/css/add-ons1.css'>
    <script>
      var activeSheetNameGlobal = '` + state.activeSheet.name + `';
      setInterval(checkForNewSheetName, 1000);
      function checkForNewSheetName() {
        google.script.run.withSuccessHandler(logActiveSheet).getActiveSheetName();
      }
      function logActiveSheet(sheetName) {
        if(activeSheetNameGlobal !== sheetName) {
          activeSheetNameGlobal = sheetName;
          console.log(sheetName);
        }
      }
      function submitForm(feature, configAccessor) {
        try {
          google.script.run.onSidebarSubmit({
            sidebar: {
              sheetName: '` + state.activeSheet.name + `',
              configAccessor: configAccessor,
              feature: feature
            }
          });
        } catch(error) {
          console.log(error);
          /* https://issuetracker.google.com/issues/69270374 */
          alert("Unable to process request. Try logging into only one Google account, in another browser or private window. Google Apps Script doesn't yet support multiple account logins.");
        }
      }
    </script>
  </head>
  <body>
    <div class='sidebar'>
      ` + this.bodyMarker + `
    </div>
  </body>
</html>`;
  }
}