const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

Date.prototype.getDayStr = function() {
  return dayNames[this.getDay()];
};

Date.prototype.getMonthStr = function() {
  return monthNames[this.getMonth()];
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