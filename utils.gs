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

function isMatch(candidate, matcher) {
  if(isDate(matcher)) {
    return isDate(candidate) && candidate.getTime() === matcher.getTime();
  }
  if(isString(matcher)) {
    return candidate.includes(matcher);
  }
  return candidate === matcher;
}

function getHtmlSafeID(unsafe) {
  return unsafe.replaceAll(' ', '-').replaceAll(':', '-');
}

function getMondayThisWeek() {
  var date = getTodaysDate();
  date = setToMidnight(date);
  var day = date.getDay();
  var difference = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(difference));
}

function getTodaysDate() {
  var date = new Date();
  return setToMidnight(date);
}

function setToMidnight(date) {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

function getNYearsFromTodaysDate(n) {
  const date = getTodaysDate();
  date.setFullYear(date.getFullYear() + n);
  return date;
}

function removeNewlines(str) {
  return str.replace(/(\r\n|\n|\r)/gm, ' ');
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toCamelCase(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

function toArray(val) {
  if(isArray(val)) return val;
  if(isObject(val)) return Object.values(val);
  return [val];
}

function toString(val) {
  return isString(val) ? val : '';
}

function pushIfNew(array, item) {
  if(array.indexOf(item) === -1) {
    array.push(item);
  }
}

function isObject(value) {
  return !!(value && typeof value === "object" && !Array.isArray(value));
}

function isArray(value) {
  return !!(value && typeof value === "object" && Array.isArray(value));
}

function isNumber(value) {
  return !!(value && typeof value === "number" && Number.isInteger(value));
}

function isString(value) {
  return !!(value && typeof value === "string");
}

function isDate(value) {
  return !!(value && value instanceof Date);
}

function isProperty(value) {
  return typeof value !== 'undefined';
}