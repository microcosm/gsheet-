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
    this.titleSuffix = ' Controls';// to change
    this.htmlBuilder = new SidebarHtmlBuilder(uiRef);
  }

  onShowSidebar() {
    const html = this.htmlBuilder.buildHtml();
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
    this.defaultSidebarID = 'default-sidebar';
  }

  getFeatureArgumentStr(item) {
    if(!item.hasOwnProperty('feature')) throw 'Item needs a feature';
    return Object.keys(item.feature)[0];
  }

  buildHtml() {
    var html = '';
    html += this.buildFormOpen();
    state.sheets.forEach((sheet) => {
      if(sheet.config.hasOwnProperty('sidebar')) {
        html += this.buildSidebarOpen(sheet.name);
        html += this.buildSidebarHtml(sheet.config.sidebar);
        html += this.buildSidebarClose();
      }
    });
    html += this.buildDefaultSidebarHtml();
    html += this.buildFormClose();
    return this.wrapWithTemplate(html);
  }

  buildDefaultSidebarHtml() {
    var html = '';
    html += this.buildSidebarOpen(this.defaultSidebarID);
    html += this.buildSidebarHtml({ default: { type: 'text', title: 'Sorry', text: 'The sidebar has not been configured for this sheet.' }});
    html += this.buildSidebarClose();
    return html;
  }

  buildSidebarOpen(sheetName) {
    return `<div id='` + getHtmlSafeID(sheetName) + `'>`;
  }

  buildSidebarClose() {
    return `</div>`;
  }

  buildSidebarHtml(config) {
    this.config = config;
    var html = '';
    for(const itemName in this.config) {
      this.currentItemName = itemName;
      const item = this.config[itemName];
      if(item) html += this[this.itemHtmlBuilders[item.type]](item);
    }
    return html;
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
      var activeSheetIDGlobal = '` + getHtmlSafeID(state.activeSheet.name) + `';
      setInterval(checkForNewSheetID, 1000);
      function checkForNewSheetID() {
        if(document.visibilityState == 'visible') {
          google.script.run.withSuccessHandler(logActiveSheet).getActiveSheetID();
        }
      }
      function logActiveSheet(sheetID) {
        if(activeSheetIDGlobal !== sheetID) {
          activeSheetIDGlobal = sheetID;
          console.log(sheetID);
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