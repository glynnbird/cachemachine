
module.exports = function() {
  var paths = [],
  debug = require('debug')('cachemachine');

  var inScope = function(path) {
    for (var i in paths) {
      if (path.match(paths[i].path)) {
        return paths[i].ttl;
      }
    }
    return false;
  };

  var add = function(p) {
    if (typeof p != 'object' || typeof p.path =='undefined' || typeof p.ttl !='number' || p.ttl < 1) {
      return false;
    }
    if (typeof p.path === 'string') {
      try {
        p.path = RegExp(p.path);
      } catch(e) {
        debug('String is not a regular expression');
        return false;
      }
    } else if (!(p.path instanceof RegExp)) {
      debug('You must supply a string or a regular expression');
      return false;
    }
    debug('Adding path', p.path.toString(), 'with ttl of', p.ttl, 'seconds');
    paths.push(p);
    return true;
  };

  var clear = function() {
    paths = [];
  };

  return {
    inScope: inScope,
    add: add,
    clear: clear
  };
};