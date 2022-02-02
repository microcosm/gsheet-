class ActivateCell extends Feature {
  constructor(sheet) {
    super(sheet, 'Activate Cell');
    this.addResponseCapability(Event.onSpreadsheetOpen);
    this.addResponseCapability(Event.onSpreadsheetEdit);
    this.addResponseCapability(Event.onSidebarSubmit);
    this.addResponseCapability(Event.onSelectionChange);
    this.getTime = 'getTime';
  }

  execute() {
    super.execute();
    if(!this.setMatcher()) return;
    logString(state.activeSheet.name + ' ' + this.sheet.name + ' ' + state.activeSheet.isNamed(this.sheet.name))
    if(!state.activeSheet.isNamed(this.sheet.name)) return;
    this.activateMatchingCell();
  }

  setMatcher() {
    const matcher = this.config.matcher;
    if(!isDate(matcher)) return false;
    this.matchigTime = matcher.getTime();
    return true;
  }

  activateMatchingCell() {
    const matchingCell = this.getMatchingCell()
    if(matchingCell) {
      logString('Activating...')
      matchingCell.activate();
    }
  }

  getMatchingCell() {
    const column = this.config.column.zeroBasedIndex;
    const values = this.sheet.getValues();
    for(let i = 0; i < values.length; i++) {
      if(this.isMatchingDate(values[i][column])) {
        logString('Found row ' + (i + 1) + ' col ' + this.config.column.cardinalIndex);
        return state.spreadsheet.ref.getActiveSheet().getRange(i + 1, this.config.column.cardinalIndex, 1, 1);
      }
    }
    return false;
  }

  isMatchingDate(candidate) {
    if(!isDate(candidate)) return false;
    logString('Comparing ' + candidate.getTime() + ' ' + candidate + ' to ' + this.matchigTime + ' ' + this.config.matcher);
    if(candidate.getTime() === this.matchigTime) logString('FOUND');
    return candidate.getTime() === this.matchigTime;
  }
}