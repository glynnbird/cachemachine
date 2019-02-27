var hash = require('../lib/hash.js')

var assert = require('assert')

describe('Hash', function () {
  it('should be an object', function () {
    assert.strictEqual(typeof hash, 'object')
  })

  it('should expose the correct functions', function () {
    assert.strictEqual(typeof hash.calculate, 'function')
  })

  it('should calculate hashes with querystring', function () {
    var h = hash.calculate('http://www.google.com', { a: 1, b: 2 })
    assert.strictEqual(h, 'e312315a4bf2e5fb10b7d9845ccc9873915fadb7')
  })

  it('should calculate hashes without querystring', function () {
    var h = hash.calculate('http://www.google.com', null)
    assert.strictEqual(h, 'ab2448e361007fd874b290c810c29aef454c2970')
  })
})
