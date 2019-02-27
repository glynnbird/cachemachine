var cache = require('../lib/rediscache.js')

var assert = require('assert')

describe('Redis cache', function () {
  var thecache = null
  var val = { x: 1, y: 2 }
  var val2 = { x: 1, y: 2, z: 3 }

  before(function () {
    // create new cache
    thecache = cache()
  })

  it('should be a function', function () {
    assert.strictEqual(typeof cache, 'function')
  })

  it('should be a expose the correct functions', function () {
    assert.strictEqual(typeof thecache.get, 'function')
    assert.strictEqual(typeof thecache.put, 'function')
    assert.strictEqual(typeof thecache.remove, 'function')
    assert.strictEqual(typeof thecache.clearAll, 'function')
    assert.strictEqual(typeof thecache.info, 'function')
  })

  it('should allow a key to be set', function (done) {
    thecache.put('a', val, 60, function (err, data) {
      assert.strictEqual(err, null)
      assert.strictEqual(typeof data, 'object')
      assert.strictEqual(typeof data.value, 'object')
      assert.strictEqual(data.value.x, val.x)
      assert.strictEqual(data.value.y, val.y)
      assert.strictEqual(typeof data._ts, 'number')
      assert(data._ts > (new Date().getTime() / 1000), 'timestamp is in the future')
      done()
    })
  })

  it('should allow a key to be fetched', function (done) {
    thecache.get('a', function (err, data) {
      assert.strictEqual(err, null)
      assert.strictEqual(typeof data, 'object')
      assert.deepStrictEqual(data, val)
      done()
    })
  })

  it('should allow a key to be updated', function (done) {
    thecache.put('a', val, 60, function (err, data) {
      assert.strictEqual(err, null)
      assert.strictEqual(typeof data, 'object')
      thecache.put('a', val2, 60, function (err, data) {
        assert.strictEqual(err, null)
        thecache.get('a', function (err, data) {
          assert.strictEqual(err, null)
          assert.deepStrictEqual(data, val2)
          done()
        })
      })
    })
  })

  it('should allow keys to be deleted', function (done) {
    thecache.remove('a', function (err, data) {
      assert.strictEqual(data, null)
      assert.strictEqual(err, null)
      thecache.get('a', function (err, data) {
        assert.strictEqual(data, null)
        assert.ok(err)
        done()
      })
    })
  })

  it('should fail to fetch a non-existant key', function (done) {
    thecache.get('b', function (err, data) {
      assert.strictEqual(data, null)
      assert.ok(err)
      done()
    })
  })

  it('should allow the cache to be cleared', function (done) {
    thecache.put('a', val, 60, function (err, data) {
      assert.strictEqual(typeof data, 'object')
      assert.strictEqual(err, null)
      thecache.clearAll(function (err, data) {
        assert.strictEqual(data, null)
        assert.strictEqual(err, null)
        thecache.get('a', function (err, data) {
          assert.strictEqual(data, null)
          assert.ok(err)
          done()
        })
      })
    })
  })

  it('should expire keys', function (done) {
    thecache.put('a', val, 1, function (err, data) {
      assert.strictEqual(err, null)
      thecache.get('a', function (err, data) {
        assert.strictEqual(err, null)
        assert.strictEqual(typeof data, 'object')
        assert.deepStrictEqual(data, val)
        setTimeout(function () {
          thecache.get('a', function (err, data) {
            assert.ok(err)
            assert.strictEqual(data, null)
            done()
          })
        }, 1500)
      })
    })
  })

  it('should report cache information', function (done) {
    thecache.put('a', val, 60, function (err, data) {
      assert.strictEqual(err, null)
      thecache.put('b', val, 60, function (err, data) {
        assert.strictEqual(err, null)
        thecache.info(function (err, data) {
          assert.strictEqual(err, null)
          assert.strictEqual(typeof data, 'object')
          assert.strictEqual(typeof data.keys, 'number')
          assert.strictEqual(data.keys, 2)
          assert.strictEqual(typeof data.memory, 'number')
          thecache.clearAll(function (err, data) {
            assert.strictEqual(err, null)
            done()
          })
        })
      })
    })
  })
})
