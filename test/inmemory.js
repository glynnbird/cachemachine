var cache = require('../lib/inmemorycache.js'),
  assert = require('assert');

describe('In-Memory cache', function() {
  var thecache = null;
  var val = {x:1, y:2};
  var val2 = {x:1, y:2, z:3};

  before(function() {
    // create new cache
    thecache = cache();
  });

  it('should be a function', function() {
    assert.equal(typeof cache, 'function');
  });

  it('should be a expose the correct functions', function() {
    assert.equal(typeof thecache.get, 'function');
    assert.equal(typeof thecache.put, 'function');
    assert.equal(typeof thecache.remove, 'function');
    assert.equal(typeof thecache.clearAll, 'function');
    assert.equal(typeof thecache.info, 'function');
  });

  it('should allow a key to be set', function(done) {
    thecache.put('a', val, 60, function(err, data) {
      assert.equal(err, null);
      assert.equal(typeof data, 'object');
      assert.equal(typeof data.value, 'object');
      assert.equal(data.value.x, val.x);
      assert.equal(data.value.y, val.y);
      assert.equal(typeof data._ts, 'number');
      assert(data._ts > (new Date().getTime()/1000), 'timestamp is in the future');
      done();
    });
  });

  it('should allow a key to be fetched', function(done) {
    thecache.get('a', function(err, data) {
      assert.equal(err, null);
      assert.equal(typeof data, 'object');
      assert.deepEqual(data, val);
      done();
    });
  });

  it('should allow a key to be updated', function(done) {
    thecache.put('a', val, 60, function(err, data) {
      assert.equal(err, null);
      assert.equal(typeof data, 'object');
      thecache.put('a', val2, 60, function(err, data) {
        thecache.get('a', function(err, data) {
          assert.equal(err, null);
          assert.deepEqual(data, val2);
          done();
        });
      });
    });
  });

  it('should allow keys to be deleted', function(done) {
    thecache.remove('a', function(err, data) {
      assert.equal(data, null);
      assert.equal(err, null);
      thecache.get('a', function(err, data) {
        assert.equal(data, null);
        assert.equal(err, true);
        done();
      });
    });
  });

  it('should fail to fetch a non-existant key', function(done) {
    thecache.get('b', function(err, data) {
      assert.equal(data, null);
      assert.equal(err, true);
      done();
    });
  });

  it('should allow the cache to be cleared', function(done) {
    thecache.put('a', val, 60, function(err, data) {
      assert.equal(typeof data, 'object');
      assert.equal(err, null);
      thecache.clearAll(function(err, data) {
        assert.equal(data, null);
        assert.equal(err, null);
        thecache.get('a', function(err, data) {
          assert.equal(data, null);
          assert.equal(err, true);
          done();
        });
      });
    });
  });

  it('should expire keys', function(done) {
    thecache.put('a', val, 1, function(err, data) {
      thecache.get('a', function(err, data) {
        assert.equal(err, null);
        assert.equal(typeof data, 'object');
        assert.deepEqual(data, val);
        setTimeout(function() {
          thecache.get('a', function(err, data) {
            assert.equal(data, null);
            done();
          });
        }, 1000);
      });
    });
  });

  it('should report cache information', function(done) {
    thecache.put('a', val, 60, function(err, data) {
      thecache.put('b', val, 60, function(err, data) {
        thecache.info(function(err, data) {
          assert.equal(err, null);
          assert.equal(typeof data, 'object');
          assert.equal(typeof data.keys, 'number');
          assert.equal(data.keys, 2);
          assert.equal(typeof data.memory, 'number');
          done();
        });
      });
    });
  });

});