var opts = {
  paths: [
    { path: '/.*', ttl: 3600 }
  ],
  redis: true,
  cert: "L************=",   // connection.rediss.certificate.certificate_base64
  connectionString: "rediss://admin:cf8db6e66bbb6c1f2fe5199fb34a24f85736723ab18d1e46bac979455cd3a4b0@be899aee-eb11-4935-8048-99972d515e25.659dc287bad647f9b4fe17c4e4c38dcc.databases.appdomain.cloud:31962/0" // connection.rediss.composed[0]
}; 

// to be replaced 
var myPath = 'https://dng-watson-service.mybluemix.net/';

var request = require('./app.js')(opts);

request({method: 'get', url: myPath, qs: {limit:20}}, function(e, h, b) {
  console.log(b);

  request({method: 'get', url: myPath, qs: {limit:20}}, function(e, h, b) {
    console.log(b);

    request({method: 'invalidate', url: myPath, qs: {limit:20}}, function(e, h, b) {
      console.log(b);

      request({method: 'get', url: myPath, qs: {limit:20}}, function(e, h, b) {
        console.log(b);

        console.log('DONE');
      });

    });

  });
});
