var pathstore = require('../lib/pathstore.js'),
  assert = require('assert');

describe('Pathstore', function() {

  beforeEach(function() {
    pathstore.clear();
  });

  it('should be an object', function() {
    assert.equal(typeof pathstore, 'object');
  });

  it('should expose the correct functions', function() {
    assert.equal(typeof pathstore.add, 'function');
    assert.equal(typeof pathstore.inScope, 'function');
    assert.equal(typeof pathstore.clear, 'function');
  });

  it('should allow a string to be added', function() {
    var added = pathstore.add({ path: '^[a-zA-Z0-9]+$', ttl: 60});
    assert.equal(added, true);
  });

  it('should allow a regexp to be added', function() {
    var added = pathstore.add({ path: /[a-zA-Z0-9]+$/, ttl: 60});
    assert.equal(added, true);
  });

  it('should reject bad regular expressions', function() {
    var added = pathstore.add({ path: '[+$', ttl: 60});
    assert.equal(added, false);
  });

  it('should reject bad parameters', function() {
    var added = pathstore.add({});
    assert.equal(added, false);
  });

  it('should reject missing paths', function() {
    var added = pathstore.add({ ttl: 50});
    assert.equal(added, false);
  });

  it('should reject missing ttl', function() {
    var added = pathstore.add({ path: '.*'});
    assert.equal(added, false);
  });

  it('should reject negative ttl', function() {
    var added = pathstore.add({ path: '.*', ttl: -1});
    assert.equal(added, false);
  });

  it('should scope correctly', function() {
    pathstore.add({ path: /^\/bob\/sue[0-9]+$/, ttl: 50});
    pathstore.add({ path: /^\/bob[0-9]+$/, ttl: 60});
    assert.equal(pathstore.inScope('/bob1'), 60);
    assert.equal(pathstore.inScope('/bob12'), 60);
    assert.equal(pathstore.inScope('/rita'), false);
    assert.equal(pathstore.inScope('/bob/sue1'), 50);
  });

});
