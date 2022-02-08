const SpreadsheetSource = {
  openByID:  'openByID',
  getActive: 'getActive'
};

const Event = {
  onSpreadsheetOpen:  'onSpreadsheetOpen',
  onSpreadsheetEdit:  'onSpreadsheetEdit',
  onCalendarEdit:     'onCalendarEdit',
  onOvernightTimer:   'onOvernightTimer',
  onHourTimer:        'onHourTimer',
  onSelectionChange:  'onSelectionChange',
  onShowSidebar:      'onShowSidebar',
  onSidebarSubmit:    'onSidebarSubmit',
  onGetActiveSheetID: 'onGetActiveSheetID'
};

const FeatureClass = {
  //calendar
  calendarEventsToSheet: CalendarEventsToSheet,
  //flexible
  moveFromMainToDone:    MoveFromMainToDone,
  resetSectionGroups:    ResetSectionGroups,
  setSheetStyles:        SetSheetStyles,
  sheetEventsToCalendar: SheetEventsToCalendar,
  sheetToExternalSheet:  SheetToExternalSheet,
  //sidebar
  orderMainSection:      OrderMainSection,
  setHiddenValue:        SetHiddenValue
};

const PropertyCommand = {
  IGNORE: 'ignore',
  MATCH:  'match'
};

const Priority = {
  HIGH_PRIORITY: 'HIGH_PRIORITY',
  LOW_PRIORITY:  'LOW_PRIORITY'
};

const BorderStyle = {
  SOLID:        SpreadsheetApp.BorderStyle.SOLID,
  SOLID_MEDIUM: SpreadsheetApp.BorderStyle.SOLID_MEDIUM,
  SOLID_THICK:  SpreadsheetApp.BorderStyle.SOLID_THICK,
  DOTTED:       SpreadsheetApp.BorderStyle.DOTTED,
  DASHED:       SpreadsheetApp.BorderStyle.DASHED,
  DOUBLE:       SpreadsheetApp.BorderStyle.DOUBLE
};