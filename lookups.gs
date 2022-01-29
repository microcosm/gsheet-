const SpreadsheetSource = {
  openByID:  'openByID',
  getActive: 'getActive'
};

const Event = {
  onSpreadsheetOpen:  'onSpreadsheetOpen',
  onSpreadsheetEdit:  'onSpreadsheetEdit',
  onCalendarEdit:     'onCalendarEdit',
  onOvernightTimer:   'onOvernightTimer',
  onSelectionChange:  'onSelectionChange',
  onShowSidebar:      'onShowSidebar',
  onSidebarSubmit:    'onSidebarSubmit',
  onGetActiveSheetID: 'onGetActiveSheetID'
};

const FeatureClasses = {
  //Calendar initiated
  updateSpreadsheetFromCalendar:       UpdateSpreadsheetFromCalendar,

  //Sheet initiated
  replicateSheetInExternalSpreadsheet: ReplicateSheetInExternalSpreadsheet,
  resetSpreadsheetStyles:              ResetSpreadsheetStyles,
  updateCalendarFromSpreadsheet:       UpdateCalendarFromSpreadsheet,

  //Sidebar initiated
  collapseDoneSection:                 CollapseDoneSection,
  moveMatchingRowsFromMainToDone:      MoveMatchingRowsFromMainToDone,
  orderMainSection:                    OrderMainSection,
  updateSheetHiddenValue:              UpdateSheetHiddenValue
};

const priorities = {
  HIGH_PRIORITY: 'HIGH_PRIORITY',
  LOW_PRIORITY:  'LOW_PRIORITY'
};

const borderStyles = {
  SOLID:        SpreadsheetApp.BorderStyle.SOLID,
  SOLID_MEDIUM: SpreadsheetApp.BorderStyle.SOLID_MEDIUM,
  SOLID_THICK:  SpreadsheetApp.BorderStyle.SOLID_THICK,
  DOTTED:       SpreadsheetApp.BorderStyle.DOTTED,
  DASHED:       SpreadsheetApp.BorderStyle.DASHED,
  DOUBLE:       SpreadsheetApp.BorderStyle.DOUBLE
};