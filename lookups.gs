const Event = {
  onSpreadsheetOpen: 'onSpreadsheetOpen',
  onSpreadsheetEdit: 'onSpreadsheetEdit',
  onCalendarEdit:    'onCalendarEdit',
  onOvernightTimer:  'onOvernightTimer',
  onSelectionChange: 'onSelectionChange',
  onShowSidebar:     'onShowSidebar',
  onSidebarSubmit:   'onSidebarSubmit'
};

const featureClasses = {
  orderSheet:                          OrderSheet,
  replicateSheetInExternalSpreadsheet: ReplicateSheetInExternalSpreadsheet,
  updateCalendarFromSpreadsheet:       UpdateCalendarFromSpreadsheet,
  updateSheetHiddenValue:              UpdateSheetHiddenValue,
  updateSpreadsheetFromCalendar:       UpdateSpreadsheetFromCalendar
}