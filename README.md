# cachemachine

[![Build Status](https://travis-ci.org/glynnbird/cachemachine.svg?branch=master)](https://travis-ci.org/sedgewickmm18/cachemachine)

*cachemachine* is a simple caching engine for HTTP GET requests that your Node.js applications make. It is designed to be run with Redis 
as the cache data-store but can be used without it in a single-node configuration during development.

Normally, to create an HTTP request, you would use the [request](https://www.npmjs.com/package/request) library like so: 

```js
  var request = require('request');
  request('http://www.google.com/', function(e, r, b) {

  });
```

If you use *cachemachine* instead you can do this:

```js
// startup cachemachine (default = cache every GET request for 1 hour)
var request = require('cachemachine')();
// make a request
request('http://www.google.com/', function(e, r, b) {
  // at this point, the request has completed and has been cached too
  console.log(b);
});
```

And subsequent requests for the same content will be returned from an in-memory cache without making the same request again.

## Installation

Install *cachemachine* into your Node.js app with

```sh
npm install --save cachemachine
```

## Setup

Set up *cachemachine* in your own app with the default cache store:

```js
var cachemachine = require('cachemachine')();
```

or with Redis (localhost:6379)

```js
var cachemachine = require('cachemachine')({redis: true});
```

or with a remote Redis server: 

```js
var opts = {
  redis: true,
  hostname: 'myredisserver.com',
  port: 8000,
  password: 'mysecretpassword'
};
var request = require('cachemachine')(opts);
```

## Configure paths to cache

To specify which paths you'd like to be cached by *cachemachine*, then supply a `paths` parameter containing an array of objects e.g.:

```js
var opts = {
  paths: [
    { path: '/api/v1/.*', ttl: 3600 }
  ]
};
var request = require('cachemachine')(opts);
```

The objects that you pass in should contain:

- path - a string or RegExp that defines the path you wish to match
- ttl - the time-to-live of the cache key in seconds

### Make requests

Simply use the request object as normal:

```js
request({method: 'get', url: 'http://mydomain.com/api/v1/books/123', qs: {limit:20}}, function(e, h, b) {
  console.log(b);
});
``` 

Note that cachemachine's request object supports being called with a single 'object' or string parameter or using the get/head/post/put/patch/del helper functions. It also supports Node.js streaming.


```js
request.get('http://mydomain.com/api/v1/books/123').pipe(process.stdout);
``` 

### How does it work?

When an outgoing request is made through *cachemachine* where the path matches one of your regular expressions, the url and query string 
are formed into a hash. This becomes the cache key for the cache data store. If the request can be retrieved from cache, it is 
fetched and the callback called. If the item is not in cache, it is fetched using a real 'request' object, cached and then returned to you.

### Why cachemachine?

If you're using `request` already and don't want to change your code, then you can use *cachemachine* as a drop-in replacement and decide which
HTTP calls to cache and for how long. This can take the load of over-burdened API servers and speed up your service.

## Using cachemachine to cache CouchDB/Cloudant databases

CouchDB & Cloudant have an HTTP API and you may wish to cache certain GET requests, such as queries on views. The Cloudant Node.js library allows
a custom request object to be passed in so we can pass in a pre-configured *cachemachine* object e.g.:

```js
var paths = [ { path: '^/mydb/_design/.*', ttl: 60*60 }];
var cachemachine = require('cachemachine')({paths: paths});
var cloudant = require('cloudant')({ url: myurl, plugin: cachemachine });
```

Then requests that match cachemachine's paths will be cached:

```
var db = cloudant.db.use('mydb');
db.view('clicks', 'byday', {group: true}, function(err, data) {
  // data is returned and cached transparently
  console.log(data);
});
```

### Using with IBM Redis cloud service

Furthermore I want to use it with IBM Redis service that makes use of explicit TLS certificates.

For an example how to use it with IBM Cloud Redis please see `example.js`. Instead of defining hostname, password and port

```js
var opts = {
  redis: true,
  connectionString: "rediss://admin:cf8db6e66bbb6c1f2fe5199fb34a24f85736723ab18d1e46bac979455cd3a4b0@be899aee-eb11-4935-8048-99972d515e25.659dc287bad647f9b4fe17c4e4c38dcc.databases.appdomain.cloud:31962/0"
  cert: "L***********************************o="
};
```
with connectionString copied from the redis credential entry `connection.redis.composed[0]` and the certificate from `connection.rediss.certificate.certificate_base64`.


