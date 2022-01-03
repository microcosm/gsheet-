const dateNames = {
  days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
}

Date.prototype.getDayStr = function() {
  return dateNames.days[this.getDay()];
};

Date.prototype.getMonthStr = function() {
  return dateNames.months[this.getMonth()];
};

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

function isValidNumber(candidate) {
  return typeof candidate == 'number' ||
    (typeof candidate == 'string' && candidate.length > 0 && !isNaN(candidate));
}

function isValidTimeString(candidate) {
  return typeof candidate == 'string' && candidate.includes(':');
}

function getTodaysDate() {
  var date = new Date();
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

function removeNewlines(str) {
  return str.replace(/(\r\n|\n|\r)/gm, ' ');
}

function spreadsheetColumnLettersToIndex(columnLetters){
  return (columnLetters.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0)) - 1;
}