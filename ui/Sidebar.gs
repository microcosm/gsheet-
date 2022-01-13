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
    this.sidebarThirdPartyCSSClass = 'sidebar';
    this.formID = 'sidebar-form';
    this.defaultItemID = 'default-item';
    this.activeSheetID = getHtmlSafeID(state.activeSheet.name);
  }

  getFeatureArgumentStr(item) {
    if(!item.hasOwnProperty('feature')) throw 'Item needs a feature';
    return Object.keys(item.feature)[0];
  }

  getElementID(itemName, value) {
    return itemName + `.` + getHtmlSafeID(value);
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
    html += this.buildSidebarOpen(this.defaultItemID);
    html += this.buildSidebarHtml({ default: { type: 'text', title: 'Sorry', text: 'The sidebar has not been configured for this sheet.' }});
    html += this.buildSidebarClose();
    return html;
  }

  buildSidebarOpen(sheetName) {
    const sheetID = getHtmlSafeID(sheetName);
    const hidden = !(this.activeSheetID === sheetID);
    const hiddenHtml = hidden ? ` class='hidden'` : ``;
    return `<div id='` + sheetID + `'` + hiddenHtml + `>`;
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
    this.currentTitleID = getHtmlSafeID(item.title);
    return `<h1>` + item.title + `<span class='hidden spinner-parent' id='` + this.currentTitleID + `'>&nbsp;<i class='fas fa-spinner'></i></span></h1>`;
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
    const elementID = this.getElementID(this.currentItemName, option);
    return `<input type='button' class='inline' id='` + elementID + `' onclick="submitForm('` + this.getFeatureArgumentStr(item) + `', '` + this.currentItemName + `', '` + option + `', '` + elementID + `', '` + this.currentTitleID + `');" value='` + option + `'>`;
  }

  buildFormOpen() {
    return `<form id='` + this.formID + `' class='waiting'>`;
  }

  buildFormClose() {
    return `</form>`;
  }

  wrapWithTemplate(html) {
    return this.getHtmlTemplate().replace(this.bodyMarker, html);
  }

  getHtmlTemplate() {
    return `<!DOCTYPE html>
<html>
  <head>
    <base target='_top'>
    <style>
      .hidden {
        display: none;
      }
    </style>
    <link rel='stylesheet' href='https://ssl.gstatic.com/docs/script/css/add-ons1.css'>
    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'>
    <style type='text/css'>
      .processing {
        pointer-events: none;
      }
      .waiting {
        pointer-events: all;
      }
    </style>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        var activeSheetIDGlobal = '` + this.activeSheetID + `';
        setInterval(checkForNewSheetID, 300);
        function checkForNewSheetID() {
          if(document.visibilityState == 'visible') {
            google.script.run.withSuccessHandler(respondToActiveSheetSuccess).getActiveSheetID();
          }
        }
        function respondToActiveSheetSuccess(sheetID) {
          if(activeSheetIDGlobal !== sheetID) {
            activeSheetIDGlobal = sheetID;
            showCurrentSheetSidebar();
          }
        }
        function showCurrentSheetSidebar() {
          let found = false;
          let sidebar = document.getElementById('` + this.formID + `');
          for(const item of sidebar.children) {
            if(item.id === activeSheetIDGlobal) {
              item.classList.remove('hidden');
              found = true;
            } else {
              item.classList.add('hidden');
            }
          }
          if(!found) {
            document.getElementById('` + this.defaultItemID + `').classList.remove('hidden');
          }
        }
        showCurrentSheetSidebar();
      });

      function submitForm(feature, configAccessor, value, elementID, spinnerParent) {
        try {
          updateToProcessingState(elementID, spinnerParent);
          google.script.run
            .withSuccessHandler(onSidebarSubmitSuccess)
            .withFailureHandler(onSidebarSubmitFailure)
            .onSidebarSubmit({
              sidebar: true,
              sheetName: '` + state.activeSheet.name + `',
              configAccessor: configAccessor,
              feature: feature,
              value: value
            }
          );
        } catch(error) {
          updateToWaitingState();
          console.log(error);
          /* https://issuetracker.google.com/issues/69270374 */
          alert('Unable to process request. Try logging into only one Google account at a time, perhaps using a private window.');
        }
      }

      function onSidebarSubmitSuccess() {
        updateToWaitingState();
      }

      function onSidebarSubmitFailure() {
        alert('Unable to process request. Make sure you have an active internet connection and are logged in.');
        updateToWaitingState();
      }

      function updateToProcessingState(elementID, spinnerParent) {
        let form = document.getElementById('` + this.formID + `');
        form.classList.remove('waiting');
        form.classList.add('processing');
        document.getElementById(elementID).setAttribute('disabled', 'disabled');
        document.getElementById(spinnerParent).classList.remove('hidden');
      }

      function updateToWaitingState() {
        let form = document.getElementById('` + this.formID + `');
        form.classList.remove('processing');
        form.classList.add('waiting');

        let inputs = form.getElementsByTagName('input');
        for(let i = 0; i < inputs.length; i++) {
          inputs[i].removeAttribute('disabled');
        }
        let spinnerParents = form.getElementsByClassName('spinner-parent');
        for(let i = 0; i < spinnerParents.length; i++) {
          spinnerParents[i].classList.add('hidden');
        }
      }
    </script>
  </head>
  <body>
    <div class='` + this.sidebarThirdPartyCSSClass + `'>
      ` + this.bodyMarker + `
    </div>
  </body>
</html>`;
  }
}