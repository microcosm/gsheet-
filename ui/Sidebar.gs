class Sidebar {
  constructor(uiRef) {
    this.uiRef = uiRef;
    this.title = 'Dashboard';
    this.htmlBuilder = new SidebarHtmlBuilder(uiRef);
  }

  onShowSidebar() {
    const html = this.htmlBuilder.buildHtml();
    var widget = HtmlService.createHtmlOutput(html);
    widget.setTitle(this.title);
    this.uiRef.showSidebar(widget);
  }
}

class SidebarHtmlBuilder {
  constructor(uiRef) {
    this.sheetControlItemHtmlBuilders = {
      text: 'buildTextItemHtml',
      buttons: 'buildButtonsItemHtml' 
    };
    this.bodyMarker = '<x>';
    this.statusUpdateInterval = 600;
    this.sidebarThirdPartyCSSClass = 'sidebar';
    this.formID = 'sidebar-form';
    this.defaultItemID = 'default-item';
    this.activeSheetControlID = this.getElementID(state.activeSheet.name);
  }

  getFeatureArgumentStr(item) {
    if(!item.hasOwnProperty('features')) throw 'Item needs at least one feature';
    return Object.keys(item.features).join();
  }

  getElementID(parent, child=false) {
    let unsafeElementID = parent;
    unsafeElementID += child ? `.` + child : ``;
    return getHtmlSafeID(unsafeElementID);
  }

  buildHtml() {
    var html = '';
    html += this.buildFormOpen();
    state.sheets.forEach((sheet) => {
      if(sheet.config.hasOwnProperty('sidebar')) {
        this.currentSheetControlName = sheet.name;
        this.currentSheetControlId = this.getElementID(sheet.name);
        html += this.buildSheetControlsOpen();
        html += this.buildSheetControlsHtml(sheet.config.sidebar);
        html += this.buildSheetControlsClose();
      }
    });
    html += this.buildDefaultSidebarHtml();
    html += this.buildFormClose();
    return this.wrapWithTemplate(html);
  }

  buildDefaultSidebarHtml() {
    var html = '';
    this.currentSheetControlName = this.defaultItemID;
    this.currentSheetControlId = this.getElementID(this.defaultItemID);
    html += this.buildSheetControlsOpen();
    html += this.buildSheetControlsHtml({ default: { type: 'text', title: 'Sorry', text: 'The sidebar has not been configured for this sheet.' }});
    html += this.buildSheetControlsClose();
    return html;
  }

  buildSheetControlsOpen() {
    const hidden = !(this.activeSheetControlID === this.currentSheetControlId);
    const hiddenHtml = hidden ? ` class='hidden'` : ``;
    return `<div class='sheet-controls' id='` + this.currentSheetControlId + `'` + hiddenHtml + `>`;
  }

  buildSheetControlsClose() {
    return `</div>`;
  }

  buildSheetControlsHtml(config) {
    this.config = config;
    var html = '';
    for(const sheetControlItemName in this.config) {
      this.currentSheetControlItemName = sheetControlItemName;
      this.currentSheetControlItemId = this.getElementID(this.currentSheetControlId, sheetControlItemName);
      const sheetControlItemConfig = this.config[sheetControlItemName];
      if(sheetControlItemConfig) {
        let itemBuilderMethod = this.sheetControlItemHtmlBuilders[sheetControlItemConfig.type];
        html += this[itemBuilderMethod](sheetControlItemConfig);
      }
    }
    return html;
  }

  buildTitleItemHtml(item)  {
    this.currentTitleID = this.getElementID(this.currentSheetControlItemId, item.title);
    return `<h1>` + item.title + `<span class='hidden spinner-parent' id='` + this.currentTitleID + `'>&nbsp;<i class='fas fa-spinner fa-spin'></i></span></h1>`;
  }

  buildTextItemHtml(item) {
    return this.buildTitleItemHtml(item) + `<p>` + item.text + `</p>`;
  }

  buildButtonsItemHtml(item) {
    var html = '';
    html += this.buildTitleItemHtml(item);
    for(const optionName in item.options) {
      const option = item.options[optionName];
      html += this.buildButtonHtml(item, option);
    }
    return html;
  }

  buildButtonHtml(item, option) {
    const elementID = this.getElementID(this.currentSheetControlItemId, option);
    return `<input type='button' class='inline' id='` + elementID + `' onclick="submitForm('` + this.getFeatureArgumentStr(item) + `', '` + this.currentSheetControlName + `', '` + this.currentSheetControlItemName + `', '` + option + `', '` + elementID + `', '` + this.currentTitleID + `');" value='` + option + `'>`;
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
    <base target='_blank'>
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
      .inline + .inline {
        margin-left: 0;
      }
      input[type="button"] {
        margin: 0 12px 12px 0;
      }
    </style>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        var activeSheetControlIDGlobal = '` + this.activeSheetControlID + `';
        setInterval(checkForNewSheetID, ` + this.statusUpdateInterval + `);
        function checkForNewSheetID() {
          if(document.visibilityState == 'visible') {
            google.script.run.withSuccessHandler(respondToActiveSheetSuccess).onGetActiveSheetControlID();
          }
        }
        function respondToActiveSheetSuccess(sheetID) {
          if(activeSheetControlIDGlobal !== sheetID) {
            activeSheetControlIDGlobal = sheetID;
            showCurrentSheetSidebar();
          }
        }
        function showCurrentSheetSidebar() {
          let found = false;
          let sidebar = document.getElementById('` + this.formID + `');
          for(const item of sidebar.children) {
            if(item.id === activeSheetControlIDGlobal) {
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

      function submitForm(features, sheetName, configAccessor, value, elementID, spinnerParent) {
        try {
          updateToProcessingState(elementID, spinnerParent);
          google.script.run
            .withSuccessHandler(onSidebarSubmitSuccess)
            .withFailureHandler(onSidebarSubmitFailure)
            .onSidebarSubmit({
              sidebar: true,
              sheetName: sheetName,
              configAccessor: configAccessor,
              features: features,
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