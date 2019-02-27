var pathstore = require('../lib/pathstore.js')()

var assert = require('assert')

describe('Pathstore', function () {
  beforeEach(function () {
    pathstore.clear()
  })

  it('should be an object', function () {
    assert.strictEqual(typeof pathstore, 'object')
  })

  it('should expose the correct functions', function () {
    assert.strictEqual(typeof pathstore.add, 'function')
    assert.strictEqual(typeof pathstore.inScope, 'function')
    assert.strictEqual(typeof pathstore.clear, 'function')
  })

  it('should allow a string to be added', function () {
    var added = pathstore.add({ path: '^[a-zA-Z0-9]+$', ttl: 60 })
    assert.strictEqual(added, true)
  })

  it('should allow a regexp to be added', function () {
    var added = pathstore.add({ path: /[a-zA-Z0-9]+$/, ttl: 60 })
    assert.strictEqual(added, true)
  })

  it('should reject bad regular expressions', function () {
    var added = pathstore.add({ path: '[+$', ttl: 60 })
    assert.strictEqual(added, false)
  })

  it('should reject bad parameters', function () {
    var added = pathstore.add({})
    assert.strictEqual(added, false)
  })

  it('should reject missing paths', function () {
    var added = pathstore.add({ ttl: 50 })
    assert.strictEqual(added, false)
  })

  it('should reject missing ttl', function () {
    var added = pathstore.add({ path: '.*' })
    assert.strictEqual(added, false)
  })

  it('should reject negative ttl', function () {
    var added = pathstore.add({ path: '.*', ttl: -1 })
    assert.strictEqual(added, false)
  })

  it('should scope correctly', function () {
    pathstore.add({ path: /^\/bob\/sue[0-9]+$/, ttl: 50 })
    pathstore.add({ path: /^\/bob[0-9]+$/, ttl: 60 })
    assert.strictEqual(pathstore.inScope('/bob1'), 60)
    assert.strictEqual(pathstore.inScope('/bob12'), 60)
    assert.strictEqual(pathstore.inScope('/rita'), false)
    assert.strictEqual(pathstore.inScope('/bob/sue1'), 50)
  })
})
