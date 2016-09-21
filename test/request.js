var assert = require('assert'),
  nock = require('nock');

describe('cachemachine', function() {

  it('should be a function', function() {
    var request = require('../app.js')();
    assert.equal(typeof request, 'function');
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