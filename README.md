gsheet—
=======
_Pronounce: "gsheet-dash"_

Extends a Google Spreadsheet into an activity management dashboard. To use, combine the [Google Apps Script](https://developers.google.com/apps-script/guides/sheets) in this repo with some [data validation](https://support.google.com/docs/answer/186103) and [conditional formatting](https://support.google.com/docs/answer/78413).

This approach allows you to leverage the extensability and simplicity of customizable Google Sheets, tailoring it to various specific task-management contexts. You need someone with spreadsheet skills and/or scripting skills to look after it, but the benefit is simplicity, independence and custom extensibility.

Features
---
TODO:
- List features here

How to use
===
To implement this dashboard for a spreadsheet, create a new repo and add this repo [as a submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules). Create a `.gs` file which for custom configuration, and create a `var` called `config` like so:

```javascript
var config = {
  gsheet: {
    name: 'the name of your implementation',
    id: 'the spreadsheet ID you are attaching it to'
  },
  toggles: {
    performDataUpdates: true|false, //whether to actually apply any data updates to target sheets, calendars etc
    verboseLogging: true|false, //whether logging should be verbose
    showLogAlert: true|false  //whether to show the log as a UI alert when a user event is initiated via a spreadsheet 
  }
}
```

Below that, create the method `buildSheets()` which will be called by the dashboard. From there you can define customn methods to build features for each sheet you need.

```javascript
function buildSheets() {
  buildValuesSheet();
  buildProjectsSheet();
}

function buildValuesSheet() {
  registerValuesSheet({
    name: 'Values', //the name of the sheet
    range: 'A3:A5',
    usersColumnIndex: 0 //the index within the range which contains user information
  });
}

function buildProjectsSheet() {
  const config = {
    name: 'Projects',
    destinationSpreadsheetID: 'destination spreadsheet id',
    destinationSheetName: 'destination sheet name'
    features: [ReplicateSheetInExternalSpreadsheet] //this feature copies the entire sheet to an external sheet whenever the it is edited
  };
  registerFeatureSheet(config);
}

```

You assign a feature to a sheet by adding it to the `features` array in a `config` object and passing it to `registerFeatureSheet()`.

How it runs
===
Google Apps Script is stateless, meaning ([almost](https://developers.google.com/apps-script/guides/properties)) all the state exists on the file. Executions are triggered by user events, like opening or editing a file in a browser, or by system events like [timers](https://developers.google.com/apps-script/guides/triggers/installable).

Events are handled by event handler methods in `main.gs`, all of which take the following form:

1. Build relevant state
2. Execute relevant features

Building state
---
State is built in sections, with only the relevant state sections built by each handler. Part of state building is pulling in your config values, via a call to `buildSheets()`.

Your configuration sets up associations between sheets and features via `registerFeatureSheet()`. When this method is called, it:

1. Creates a new `FeatureSheet` object, which accesses the spreadsheet and finds the sheet identified by `name`. No data is read from he sheet at this stage, only when a featue execution demands it -- this saves on costly calls to the API. If the sheet can't be found an Exception is thrown.

2. Creates a new `Feature` object for each named in the `features` array, and assigns the new `FeatureSheet` to each of them.

Once all sheets are registered via this process, the dashboard state contains an array of all `FeatureSheet` objects, and an array of all `Feature` objects. If the two sheets both declare the same feature, that feature will exist in the `state.features.registered` array twice - once for each sheet.

The rest of the config values are stored in the new `FeatureSheet` object for access later during feature execution.

Feature execution
---
Each feature is designed to respond to a specific set of events for which they make sense. For example:

- The `ReplicateSheetInExternalSpreadsheet` feature syncs changes from a source sheet to a target sheet -- therefore it responds to `onSpreadsheetEdit`
- The `UpdateSheetHiddenValue` feature updates a hidden cell, typically triggering a UI change -- therefore it responds to `onSidebarSubmit` (from where a user has requested that UI change)

After the relevant state is built, two categories of values are evaluated to determine which feature(s) should execute:

| Category | Required? | Description |
| --- | --- | --- |
| Event | Required | The events a feature responds to are hard coded into each `Feature` class definition. |
| Event Data | Optional | Values passed by Apps Script to each event are parsed to determine if a feature should execute in response. Examples include `onSpreadsheetOpen`, `onSpreadsheetEdit`, `onOvernightTimer` and `onSidebarSubmit`. |

Event Data values could include things like the active sheet name, the cells, rows or columns selected or edited, the ID of a button a user clicked, and so on.

In the case of timed triggers, there is no Event Data. In the case of events like `onSpreadsheetOpen`, no event data is checked for as it is not relevant -- event data is only referenced by event handlers when it is necessary to determine whether a feature should execute.

Glossary
===
The terminology used in this repo matches and extends the [standard terminology](https://developers.google.com/sheets/api/guides/concepts) used in Google Sheets, including:

| Term | Description |
| --- | --- |
| Spreadsheet | A Google Sheets file. The primary object in Google Sheets that can contain multiple sheets, each with structured information contained in cells. |
| Sheet | A page or tab within a spreadsheet. |
| SpreadsheetID and SheetID | Like all Google Apps services, files are represented by a top-level alphanumeric ID, i.e. a "Spreadsheet ID". Each sheet inside a spreadsheet is represented by a unique title and numeric value, i.e. a "Sheet ID". These can both be found in the resource URL: `https://docs.google.com/spreadsheets/d/[SpreadsheetID]/edit#gid=[SheetID]` |
| Cell | An individual field of text or data within a sheet.
| Row, Column and Range |Cells are arranged in rows and columns, and can be grouped together as a range of cells.

To help shape the spreadsheet into a dashboard-like interface, the standard terms are extended with combinations and more specific terms:
| Term | Description |
| --- | --- |
| ValuesSheet | The single sheet containing user-configurable configuration values. |
| FeatureSheet | A sheet to which a registered feature should be applied. |
| Widget | A range within a Sheet representing a uniform set of labeled user interface elements, like a table or a set of controls. Many sheets have only one Widget, some have two or more which are grouped because they are conceptually related and easier for users to see in one place. |