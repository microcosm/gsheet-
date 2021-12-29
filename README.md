gsheet—
=======
_Pronounce: "gsheet-dash"_

You can make a Google Sheet into quite a sophisticated activity management dashboard by mixing [data validation](https://support.google.com/docs/answer/186103), [conditional formatting](https://support.google.com/docs/answer/78413) and extending with [Google Apps Script](https://developers.google.com/apps-script/guides/sheets).

With most dashboard systems you have to choose between
1. wait for an independent development team to build you a custom system, or
2. live by the constraints of an off-the-shelf system

gsheet— allows teams to leverage the extensability and simplicity of Google Sheets with customizations to support specific task-management contexts. Whenever you need a new feature a team member can spin it up out of some pre-built components or create new features by mixing data validation, [conditional formatting](https://support.google.com/docs/answer/78413) and extensions written in Google Apps Script.

The downside is you need someone with spreadsheet skills and/or scripting skills to look after it. As long as someone on the team is willing to handle these more technical aspects, other team members benefit from a low-cost highly-specific user interface with minimal spreadsheet and no scripting knowledge required.

This repo represents the Google Apps Script portion of my implementation of this "gsheet dash" approach.

Features
-----------------
TODO:
- List features here

Glossary
--------
The terminology used in this repo matches and extends the [standard terminology](https://developers.google.com/sheets/api/guides/concepts) used in Google Sheets, including.

*Spreadsheet*
A Google Sheets file. The primary object in Google Sheets that can contain multiple sheets, each with structured information contained in cells.

*Sheet*
A page or tab within a spreadsheet.

*SpreadsheetID* and *SheetID*
Like all Google Apps services, files are represented by a top-level alphanumeric ID, i.e. a "Spreadsheet ID". Each sheet inside a spreadsheet is represented by a unique title and numeric value, i.e. a "Sheet ID". These can both be found in the resource URL:
`https://docs.google.com/spreadsheets/d/[SpreadsheetID]/edit#gid=[SheetID]`

*Cell*
An individual field of text or data within a sheet.

*Row*, *Column* and *Range*
Cells are arranged in rows and columns, and can be grouped together as a range of cells.

To help shape the spreadsheet into a dashboard-like interface, the standard terms are extended with combinations and more specific terms.

*GoogleSheet*
An integration class representing a Sheet within a Google Spreadsheet by wrapping access to the Google Apps Script API.

*GoogleCalendar*
An integration class representing a Google Calendar by wrapping access to the Google Apps Script API.

*ScriptSheet*
A custom Sheet accessor containing data which should be processed by a custom script.

*Widget*
A range within a Sheet representing a uniform set of labeled user interface elements, like a table or a set of controls. Many ScriptSheets have only one Widget, some have two or more which are grouped because they are conceptually related.

*ScriptRange*
The single range in a ScriptSheet containing all data which should be processed by a custom script, which may be the exact same range as a single Widget or maybe a larger range covering several Widgets.