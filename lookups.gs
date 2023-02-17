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
  alertSheetOnEdit: AlertSheetOnEdit,
  cacheSheetRowsBySection: CacheSheetRowsBySection,
  copyCalendarEventsToSheet: CopyCalendarEventsToSheet,
  copySheet: CopySheet,
  copySheetEventsToCalendar: CopySheetEventsToCalendar,
  copySheetValuesBySection: CopySheetValuesBySection,
  createSheetItem: CreateSheetItem,
  moveSheetRowsToDone: MoveSheetRowsToDone,
  orderSheetSections: OrderSheetSections,
  setSheetGroupsBySection: SetSheetGroupsBySection,
  setSheetHiddenRowsBySection: SetSheetHiddenRowsBySection,
  setSheetStylesBySection: SetSheetStylesBySection,
  setSheetValue: SetSheetValue
};

const PropertyCommand = {
  IGNORE: 'ignore',
  MATCH: 'match',
  EVENT_DATA: 'event_data',
  CURRENT_DATE: 'current_date',
  LAST_COLUMN: 'last_column'
};

const Priority = {
  HIGH_PRIORITY: 'HIGH_PRIORITY',
  LOW_PRIORITY:  'LOW_PRIORITY'
};

const SectionsCategory = {
  MAIN: 'SECTIONS_CATEGORY_MAIN',
  DONE: 'SECTIONS_CATEGORY_DONE',
}

const BorderStyle = {
  SOLID:        SpreadsheetApp.BorderStyle.SOLID,
  SOLID_MEDIUM: SpreadsheetApp.BorderStyle.SOLID_MEDIUM,
  SOLID_THICK:  SpreadsheetApp.BorderStyle.SOLID_THICK,
  DOTTED:       SpreadsheetApp.BorderStyle.DOTTED,
  DASHED:       SpreadsheetApp.BorderStyle.DASHED,
  DOUBLE:       SpreadsheetApp.BorderStyle.DOUBLE
};