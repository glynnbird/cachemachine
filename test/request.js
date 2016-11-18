var assert = require('assert'),
  stream = require('stream'),
  nock = require('nock');

describe('cachemachine', function() {

  it('should be a function', function() {
    var request = require('../app.js')();
    assert.equal(typeof request, 'function');
  });

  it('should return a stream for cache hits', function() {
    var request = require('../app.js')();
    var mocks = nock('http://localhost')      
      .get('/abc').reply(200, 'Hello world');
    var req = request('http://localhost/abc', function(e, r, b) {
      assert.equal(b, 'Hello world');
      assert.equal(req instanceof stream.PassThrough, true);
    });
  });

  it('should return a stream for cache misses', function() {
    var request = require('../app.js')({ paths: [{ path:'/rita', ttl:60}]});
    var mocks = nock('http://localhost')      
      .get('/abc').reply(200, 'Hello world');
    var req = request('http://localhost/abc', function(e, r, b) {
      assert.equal(b, 'Hello world');
      assert.equal(req instanceof stream.PassThrough, true);
    });
  });

  it('should return a stream for non-GET requests', function() {
    var request = require('../app.js')();
    var mocks = nock('http://localhost')      
      .put('/abc').reply(200, 'Hello world');
    var req = request.put('http://localhost/abc', function(e, r, b) {
      assert.equal(b, 'Hello world');
      assert.equal(req instanceof stream.PassThrough, true);
    });
  });

  it('should expose the correct functions', function() {
    var request = require('../app.js')();
    assert.equal(typeof request.get, 'function');
    assert.equal(typeof request.head, 'function');
    assert.equal(typeof request.post, 'function');
    assert.equal(typeof request.put, 'function');
    assert.equal(typeof request.patch, 'function');
    assert.equal(typeof request.del, 'function');
    assert.equal(typeof request['delete'], 'function');
  });

  it('should make http requests and cache them', function(done) {
    var request = require('../app.js')();
    var mocks = nock('http://localhost')
      .get('/abc').reply(200, 'Hello world')
      .get('/abc').reply(200, 'Hello world2');;

    request('http://localhost/abc', function(e, r, b) {
      assert.equal(b, 'Hello world');
      request('http://localhost/abc', function(e, r, b) {
        // we should still get the first reply as its cached
        assert.equal(b, 'Hello world');
        done();
      });
    });
  });

  it('should only cache the requests you specify', function(done) {
    var opts = {
      paths: [
        { path: '^/rita$', ttl: 60}
      ]
    };
    var request = require('../app.js')(opts);
    var mocks = nock('http://localhost')
      .get('/rita').reply(200, 'rita1')
      .get('/rita').reply(200, 'rita2')
      .get('/bob').reply(200, 'bob1')
      .get('/bob').reply(200, 'bob2');

    request('http://localhost/rita', function(e, r, b) {
      assert.equal(b, 'rita1');
      request('http://localhost/rita', function(e, r, b) {
        // we should still get the first reply as its cached
        assert.equal(b, 'rita1');
        request('http://localhost/bob', function(e, r, b) {
          assert.equal(b, 'bob1');
          request('http://localhost/bob', function(e, r, b) {
            assert.equal(b, 'bob2');
            done();
          });
        });
      });
    });
  });

});