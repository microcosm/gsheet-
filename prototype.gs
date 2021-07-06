Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

String.prototype.isANumber = function() {
  return !(this.length === 0 || !this.trim()) &&
         !isNaN(this);
};

Number.prototype.isANumber = function() {
  return true;
};