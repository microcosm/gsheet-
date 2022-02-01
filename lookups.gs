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

const FeatureClass = {
  //calendar
  calendarEventsToSheet: CalendarEventsToSheet,
  //flexible
  collapseSection:       CollapseSection,
  moveFromMainToDone:    MoveFromMainToDone,
  setSheetStyles:        SetSheetStyles,
  sheetEventsToCalendar: SheetEventsToCalendar,
  sheetToExternalSheet:  SheetToExternalSheet,
  //sidebar
  orderMainSection:      OrderMainSection,
  setHiddenValue:        SetHiddenValue
};

const PropertyOverride = {
  IGNORE: 'ignore'
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