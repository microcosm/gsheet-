const SpreadsheetSource = {
  openByID:  'openByID',
  getActive: 'getActive'
};

const Event = {
  onSpreadsheetOpen:  'onSpreadsheetOpen',
  onSheetEdit:        'onSheetEdit',
  onCalendarEdit:     'onCalendarEdit',
  onOvernightTimer:   'onOvernightTimer',
  onHourTimer:        'onHourTimer',
  onSelectionChange:  'onSelectionChange',
  onShowSidebar:      'onShowSidebar',
  onSidebarSubmit:    'onSidebarSubmit',
  onGetActiveSheetID: 'onGetActiveSheetID'
};

const FeatureClass = {
  copyCalendarEventsToSheet: CopyCalendarEventsToSheet,
  copySheetEventsToCalendar: CopySheetEventsToCalendar,
  copySheetToExternalSpreadsheet: CopySheetToExternalSpreadsheet,
  copySheetValuesBySection: CopySheetValuesBySection,
  moveSheetRowsMainToDone: MoveSheetRowsMainToDone,
  orderSheetMainSection: OrderSheetMainSection,
  setSheetGroupsBySection: SetSheetGroupsBySection,
  setSheetHiddenRowsBySection: SetSheetHiddenRowsBySection,
  setSheetHiddenValue: SetSheetHiddenValue,
  setSheetStylesBySection: SetSheetStylesBySection
};

const PropertyCommand = {
  IGNORE: 'ignore',
  MATCH:  'match',
  EVENT_DATA: 'event_data'
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