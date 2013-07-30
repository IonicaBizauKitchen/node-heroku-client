var https = require('https'),
    memjs = require('memjs'),
    q     = require('q'),
    _     = require('underscore');

if (process.env.NODE_ENV === 'production') {
  var cache = memjs.Client.create();
}

module.exports = function request(path, options, callback) {
  var deferred = q.defer();

  options || (options = {});

  getCache(options.cacheKeyPostfix, path, function(cachedResponse) {
    var headers = _.extend({
      'Accept': 'application/vnd.heroku+json; version=3',
      'If-None-Match': cachedResponse ? cachedResponse.etag : ''
    }, options.headers || {});

    var requestOptions = {
      hostname: 'api.heroku.com',
      port:     443,
      path:     path,
      query:    options.query || {},
      auth:     ':' + options.key,
      method:   options.method || 'GET',
      headers:  headers
    };

    var req = https.request(requestOptions, function(res) {
      if (res.statusCode === 304 && cachedResponse) {
        deferred.resolve(cachedResponse.body);
        callback(null, cachedResponse.body);
      } else {
        var buffer = '';

        res.on('data', function(data) {
          buffer += data;
        });

        res.on('end', function() {
          if (expectedResponse(res, options)) {
            handleSuccess(res, buffer, options, deferred, callback);
          } else {
            handleFailure(res, buffer, options, deferred, callback);
          }
        });
      }
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.on('error', function(err) {
      deferred.reject(err);
      callback(err);
    });

    if (options.timeout && options.timeout > 0) {
      req.on('socket', function(socket) {
        socket.setTimeout(options.timeout);
        socket.on('timeout', function() {
          req.abort();
          callback(new Error('Request took longer than ' + options.timeout + 'ms to complete.'));
        });
      });
    }

    req.end();
  });

  return deferred.promise;
}

function expectedResponse(res, options) {
  return (options.expectedResponse && (res.statusCode === options.expectedResponse)) ||
    (!options.expectedResponse && res.statusCode.toString().match(/^2\d{2}$/))
}

function handleFailure(res, buffer, options, deferred, callback) {
  var message;

  if (options.expectedResponse) {
    message = 'Expected response ' + options.expectedResponse + ', got ' + res.statusCode
  } else {
    message = 'Expected response to be successful, got ' + res.statusCode
  }

  var err = new Error(message);
  err.statusCode = res.statusCode;
  err.body = JSON.parse(buffer);

  deferred.reject(err);
  callback(err);
}

function handleSuccess(res, buffer, options, deferred, callback) {
  var body = JSON.parse(buffer);

  setCache(options.path, options.cacheKeyPostfix, res, body);

  deferred.resolve(body);
  callback(null, body);
}

function getCache(path, postfix, callback) {
  if (!(process.env.NODE_ENV === 'production')) return callback(null);

  var key = path + '-' + cacheKeyPostfix;

  cache.get(key, function(err, res) {
    callback(JSON.parse(res));
  });
}

function setCache(path, cacheKeyPostfix, res, body) {
  if (!(process.env.NODE_ENV === 'production') || !(res.headers.etag)) return;

  var key = path + '-' + cacheKeyPostfix;
  var value = JSON.stringify({
    body: body,
    etag: res.headers.etag,
    statusCode: res.statusCode
  });

  cache.set(key, value);
}
