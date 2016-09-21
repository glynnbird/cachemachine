'use strict';

var debug = require('debug')('cachemachine');

module.exports = function () {

  var thecache = {};

  var timestamp = function () {
    return new Date().getTime()/1000;
  };

  var purge = function () {
    for (var i in thecache) {
      var now = timestamp();
      var obj = thecache[i];
      if (obj._ts <= now) {
        delete thecache[i];
      }
    }
  };

  setInterval(purge, 1000 * 60);

  // put a new key/value pair in cache. 'value' is a JS object
  var put = function (key, value, ttl, callback) {
    debug('Setting key', key);
    thecache[key] = {
      value: value,
      _ts: timestamp() + ttl
    };
    callback(null, thecache[key]);
  };

  var get = function (key, callback) {

    if (typeof thecache[key] != "undefined") {
      var now = timestamp();
      var ts = thecache[key]._ts;

      if (ts >= now) {
        debug('Getting key', key);
        callback(null, thecache[key].value);
      } else {
        debug('Failed to get key', key);
        delete thecache[key];
        callback(null, null);
      }
    } else {
      debug('Failed to get key', key);
      callback(true, null);
    }
  };

  var remove = function (key, callback) {
    delete thecache[key];
    callback(null, null);
  };

  var clearAll = function (callback) {
    thecache = {};
    callback(null, null);
  };

  var info = function (callback) {
    purge();
    var obj = {
      keys: Object.keys(thecache).length,
      memory: 0
    };
    return callback(null, obj);
  };

  return {
    get: get,
    put: put,
    remove: remove,
    clearAll: clearAll,
    info: info
  };
};
