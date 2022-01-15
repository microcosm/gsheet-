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
  updateCalendarFromSpreadsheet:       UpdateCalendarFromSpreadsheet,

  //Sidebar initiated features
  moveMatchingRowsFromMainToArchive:   MoveMatchingRowsFromMainToArchive,
  orderMainSection:                    OrderMainSection,
  updateSheetHiddenValue:              UpdateSheetHiddenValue
}