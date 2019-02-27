// a simple data store of the list of paths/ttls that are to be cached
module.exports = function () {
  var paths = []
  const debug = require('debug')('cachemachine')

  // check whether 'path' matches one of our list of paths, if so
  // return it's TTL
  const inScope = function (path) {
    for (var i in paths) {
      if (path.match(paths[i].path)) {
        return paths[i].ttl
      }
    }
    return false
  }

  // add a path to the list
  const add = function (p) {
    // check type of incoming parameter. It should be an object
    // like this { path:'/abc', ttl: 60 }
    if (typeof p !== 'object' || typeof p.path === 'undefined' ||
        typeof p.ttl !== 'number' || p.ttl < 1) {
      return false
    }

    // if a string has been supplied, check it compiles as a RegExp
    if (typeof p.path === 'string') {
      try {
        p.path = RegExp(p.path)
      } catch (e) {
        debug('String is not a regular expression')
        return false
      }
    } else if (!(p.path instanceof RegExp)) {
      debug('You must supply a string or a regular expression')
      return false
    }
    debug('Adding path', p.path.toString(), 'with ttl of', p.ttl, 'seconds')
    paths.push(p)
    return true
  }

  // clear paths
  const clear = function () {
    paths = []
  }

  return {
    inScope: inScope,
    add: add,
    clear: clear
  }
}
