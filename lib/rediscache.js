var debug = require('debug')('cachemachine');

module.exports = function(credentials) {

  var password = (credentials && credentials.password) || null,
    hostname = (credentials && credentials.hostname) || 'localhost',
    port = (credentials && credentials.port) || 6379;
  
  // setup Redis client
  debug('Connecting to Redis on', hostname, ':', port);
  var client = require("redis").createClient(port, hostname, { auth_pass: password});
      
  var retval =  {
        
    put: function(key, value, ttl, callback) {
      var val = JSON.stringify(value);
      client.setex(key, ttl, val, function(err, data) {
        if (!err) {
          debug(`Setting ${key} in Redis`)
        }
        return callback(err, { value: value, _ts: (new Date().getTime()/1000) + ttl });

      });
    },
    
    get: function(key, callback) {
      
      client.get(key, function(err, data) {
        var rep = null;
        if (!err && data !== null) {
          rep = JSON.parse(data);
          debug(`Getting ${key} from Redis`)
        }
        
        if (err || rep==null) {
          debug(`Failed to get ${key} from Redis`)
        }
        return callback( (err || rep == null) ? true : null , rep);
      });
    },
    
    remove: function(key, callback) {
      client.del(key, function(err, data) {
        callback(null, null);
      });
    },
    
    clearAll: function(callback) {
      client.flushall(function(err,data) {
        callback(null, null);
      });
    },
    
    info: function(callback) {
      client.info(function(err, data) {

        var mem = data.match(/used_memory_human:[0-9A-Z\.]{1,}/i)
        if (mem !== null) {
          mem = parseInt(mem[0].split(":")[1]);
        } else {
          mem = "0K";
        }

        var keys = data.match(/keys=[0-9]{1,}/)
        if (keys !== null) {
          keys = parseInt(keys[0].split("=")[1]);
        } else {
          keys = 0;
        }

        return callback(err, {
          keys: keys,
          memory: mem
        })

      });
    }
  
  };
  
  return retval;
  
};