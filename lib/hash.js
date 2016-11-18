'use strict';

var crypto = require('crypto');

// calculate sha1 of string
var sha1 = function(string) {
  return crypto.createHash('sha1').update(string).digest('hex');
};

// calculate hash of url and querystring
var calculate = function(u, qs) {
  var str = qs ? JSON.stringify(qs) : '';
  return sha1(u + '?' + str);
};

module.exports = {
  calculate: calculate
};