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
  moveMatchingRowsFromMainToArchive:   MoveMatchingRowsFromMainToArchive,
  orderMainSection:                    OrderMainSection,
  replicateSheetInExternalSpreadsheet: ReplicateSheetInExternalSpreadsheet,
  updateCalendarFromSpreadsheet:       UpdateCalendarFromSpreadsheet,
  updateSheetHiddenValue:              UpdateSheetHiddenValue,
  updateSpreadsheetFromCalendar:       UpdateSpreadsheetFromCalendar
}