function waitForLocks(){
  state.lock = LockService.getScriptLock();
  try {
    state.lock.waitLock(60000);
    logLockObtained();
    return true;
  } catch(e) {
    return false;
  }
}

function releaseLock() {
  SpreadsheetApp.flush();
  state.lock.releaseLock();
  logLockReleased();
}