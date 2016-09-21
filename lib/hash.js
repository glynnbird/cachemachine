  'use strict';
  
  var crypto = require('crypto');
  
  var sha1 = function(string) {
    return crypto.createHash('sha1').update(string).digest('hex');
  };

  var calculate = function(u, qs) {
    var str = qs ? JSON.stringify(qs) : '';
    return sha1(u + '?' + str);
  };

  module.exports = {
    calculate: calculate
  };