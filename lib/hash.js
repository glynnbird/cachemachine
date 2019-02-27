const crypto = require('crypto')

// calculate sha1 of string
const sha1 = function (string) {
  return crypto.createHash('sha1').update(string).digest('hex')
}

// calculate hash of url and querystring
const calculate = function (u, qs) {
  const str = qs ? JSON.stringify(qs) : ''
  return sha1(u + '?' + str)
}

module.exports = {
  calculate: calculate
}
