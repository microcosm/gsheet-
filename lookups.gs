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

const featureClasses = {
  //Calendar initiated features
  updateSpreadsheetFromCalendar:       UpdateSpreadsheetFromCalendar,

  //Sheet initiated features
  replicateSheetInExternalSpreadsheet: ReplicateSheetInExternalSpreadsheet,
  resetSpreadsheetStyles:              ResetSpreadsheetStyles,
  updateCalendarFromSpreadsheet:       UpdateCalendarFromSpreadsheet,

  //Sidebar initiated features
  collapseDoneSection:                 CollapseDoneSection,
  moveMatchingRowsFromMainToDone:      MoveMatchingRowsFromMainToDone,
  orderMainSection:                    OrderMainSection,
  updateSheetHiddenValue:              UpdateSheetHiddenValue
};

const priorities = {
  HIGH_PRIORITY: 'HIGH_PRIORITY',
  LOW_PRIORITY:  'LOW_PRIORITY'
};

const featureInitiators = {
  calendar: 'calendar',
  sheet:    'sheet',
  sidebar:  'sidebar'
}

const borderStyles = {
  SOLID:       SpreadsheetApp.BorderStyle.SOLID,
  SOLID_THICK: SpreadsheetApp.BorderStyle.SOLID_THICK
};