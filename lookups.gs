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
  moveMatchingRowsFromMainToArchive:   MoveMatchingRowsFromMainToArchive,
  orderMainSection:                    OrderMainSection,
  updateSheetHiddenValue:              UpdateSheetHiddenValue
}

const borderStyles = {
  SOLID:       SpreadsheetApp.BorderStyle.SOLID,
  SOLID_THICK: SpreadsheetApp.BorderStyle.SOLID_THICK
}