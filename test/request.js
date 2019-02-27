var assert = require('assert')

var stream = require('stream')

var nock = require('nock')

describe('cachemachine', function () {
  it('should be a function', function () {
    var request = require('../app.js')()
    assert.strictEqual(typeof request, 'function')
  })

  it('should return a stream for cache hits', function () {
    var request = require('../app.js')()
    nock('http://localhost')
      .get('/abc').reply(200, 'Hello world')
    var req = request('http://localhost/abc', function (e, r, b) {
      assert.strictEqual(b, 'Hello world')
      assert.strictEqual(req instanceof stream.PassThrough, true)
    })
  })

  it('should return a stream for cache misses', function () {
    var request = require('../app.js')({ paths: [{ path: '/rita', ttl: 60 }] })
    nock('http://localhost')
      .get('/abc').reply(200, 'Hello world')
    var req = request('http://localhost/abc', function (e, r, b) {
      assert.strictEqual(b, 'Hello world')
      assert.strictEqual(req instanceof stream.PassThrough, true)
    })
  })

  it('should return a stream for non-GET requests', function () {
    var request = require('../app.js')()
    nock('http://localhost')
      .put('/abc').reply(200, 'Hello world')
    var req = request.put('http://localhost/abc', function (e, r, b) {
      assert.strictEqual(b, 'Hello world')
      assert.strictEqual(req instanceof stream.PassThrough, true)
    })
  })

  it('should expose the correct functions', function () {
    var request = require('../app.js')()
    assert.strictEqual(typeof request.get, 'function')
    assert.strictEqual(typeof request.head, 'function')
    assert.strictEqual(typeof request.post, 'function')
    assert.strictEqual(typeof request.put, 'function')
    assert.strictEqual(typeof request.patch, 'function')
    assert.strictEqual(typeof request.del, 'function')
    assert.strictEqual(typeof request['delete'], 'function')
  })

  it('should make http requests and cache them', function (done) {
    var request = require('../app.js')()
    nock('http://localhost')
      .get('/abc').reply(200, 'Hello world')
      .get('/abc').reply(200, 'Hello world2')

    request('http://localhost/abc', function (e, r, b) {
      assert.strictEqual(b, 'Hello world')
      request('http://localhost/abc', function (e, r, b) {
        // we should still get the first reply as its cached
        assert.strictEqual(b, 'Hello world')
        done()
      })
    })
  })

  it('should only cache the requests you specify', function (done) {
    var opts = {
      paths: [
        { path: '^/rita$', ttl: 60 }
      ]
    }
    var request = require('../app.js')(opts)
    nock('http://localhost')
      .get('/rita').reply(200, 'rita1')
      .get('/rita').reply(200, 'rita2')
      .get('/bob').reply(200, 'bob1')
      .get('/bob').reply(200, 'bob2')

    request('http://localhost/rita', function (e, r, b) {
      assert.strictEqual(b, 'rita1')
      request('http://localhost/rita', function (e, r, b) {
        // we should still get the first reply as its cached
        assert.strictEqual(b, 'rita1')
        request('http://localhost/bob', function (e, r, b) {
          assert.strictEqual(b, 'bob1')
          request('http://localhost/bob', function (e, r, b) {
            assert.strictEqual(b, 'bob2')
            done()
          })
        })
      })
    })
  })
})
