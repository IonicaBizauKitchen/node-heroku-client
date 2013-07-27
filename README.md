# node-heroku

node-heroku provides a wrapper around the Heroku API

## Usage

### Single requests

```javascript
var heroku = require('heroku');

var opts = {
  key: process.env.HEROKU_API_KEY
};

heroku.request('/apps', opts, function(err, apps) {
  console.log(apps);
});
```

### Multiple requests with shared options

```javascript
var Heroku = require('heroku').Heroku;
var heroku = new Heroku({ key: process.env.HEROKU_API_KEY });

heroku.request('/apps', function(err, apps) {
  console.log(apps);
});

heroku.request('/apps/my-app', function(err, app) {
  console.log(app);
});

// One-off override (options merged into shared options)
heroku.request('/apps', { expectedResponse: 422 }, function(err, body) {
  console.log(err.message);
});
```

### Heroku resources

```javascript
var Heroku = require('heroku').Heroku;
var heroku = new Heroku({ key: process.env.HEROKU_API_KEY });

// Apps
heroku.apps(function(err, apps) {
  console.log(apps);
});

heroku.apps('my-app', function(err, app) {
  console.log(app);
});

heroku.apps.create({ name: 'my-new-app' }, function(err, app) {
  console.log(app);
});

heroku.apps.update('my-new-app', { name: 'my-new-app-renamed' }, function(err, app) {
  console.log(app);
});

// Processes
heroku.apps.ps('my-app', function(err, processes) {
  console.log(processes);
});

// Collaborators
heroku.apps.collaborators('my-app', function(err, collaborators) {
  console.log(collaborators);
});

// Addons
heroku.addons(function(err, addons) {
  console.log(addons);
});

heroku.addons('papertrail:fixa', function(err, addon) {
  console.log(addon);
});

heroku.apps.addons('my-app', function(err, addons) {
  console.log(addons);
});

heroku.apps.addons('my-app', 'papertrail', function(err, addon) {
  console.log(addon);
});

// Account
heroku.account(function(err, account) {
  console.log(account);
});
```

### Promises

node-heroku's `request` function returns promises from the [q library](https://github.com/kriskowal/q), making the following code possible:

```javascript
var Heroku = require('heroku').Heroku,
    q      = require('q');

var heroku = new Heroku({ key: process.env.HEROKU_API_KEY });

// Fetch processes for all of my apps
heroku.apps().then(function(apps) {

  return q.all(apps.map(function(app) {
    return heroku.apps.ps(app.name);
  }));

}).then(function(processes) {

  console.log(processes);

});
```

## Caching

When `NODE_ENV` is set to "production", node-heroku will create a memcached client using [memjs](https://github.com/alevy/memjs). See the memjs repo for configuration instructions.

For local development with caching, it's enough to start a memcached server and set `MEMCACHIER_SERVERS` to `0.0.0.0:11211` in your `.env` file.

## Contributing

### Defining new resources

Let's say we have a resource called `foo` with some API routes like the following:

* `/foo`
* `/foo/:id`
* `/foo/:id/bar`

In `lib/heroku/resources/foo.js`, we would create a file roughly like the following:

```javascript
module.exports = foo;

// `foo` will handle both /foo and /foo/:id
// It will also have our additional `bar` function
// as a property.
function foo(id, callback) {
  if (typeof id === 'string') {
    return this.request('/apps/' + id, callback);
  } else {
    callback = id;
    return this.request('/apps', callback);
  }
}

// Define our additional `bar` function
foo.bar = function(id, callback) {
  return this.request('/foo/' + id + '/bar', callback);
};
```

Then, add `foo` to the list of resources in `lib/heroku/heroku.js`:

```javascript
  // ...
  var resources = {
    account:  require('./resources/account'),
    apps:     require('./resources/apps'),
    foo:      require('./resources/foo')
  };
  // ...
```
