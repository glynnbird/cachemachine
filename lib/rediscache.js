var debug = require('debug')('cachemachine');

module.exports = function(credentials) {

  var password = credentials.password || null,
    hostname = credentials.hostname || 'localhost',
    port = credentials.port || 6379;
  
  // setup Redis client
  debug('Connecting to Redis on', hostname, ':', port);
  var client = require("redis").createClient(port, hostname, { auth_pass: password});
      
  var retval =  {
        
    put: function(key, value, ttl, callback) {
      
      client.setex(key, ttl, JSON.stringify(value), function(err, data) {
        if (!err) {
          debug(`Setting ${key} in Redis`)
        }
        return callback(err, data)

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
        return callback( (err || rep==null) , rep);
      });
    },
    
    remove: function(key, callback) {
      client.del(key, callback)
    },
    
    clearAll: function() {
      client.flushall(function(err,data) {
        
      });
    },
    
    info: function(callback) {
      client.info(function(err, data) {

        var mem = data.match(/used_memory_human:[0-9A-Z\.]{1,}/i)
        if (mem !== null) {
          mem = mem[0].split(":")[1]
        } else {
          mem = "0K";
        }

        var keys = data.match(/keys=[0-9]{1,}/)
        if (keys !== null) {
          keys = keys[0].split("=")[1]
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