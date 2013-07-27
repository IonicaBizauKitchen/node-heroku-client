module.exports = apps;

function apps(id, callback) {
  if (typeof id === 'string') {
    return this.request('/apps/' + id, callback);
  } else {
    return this.request('/apps', id, callback);
  }
};

apps.create = function create(app, callback) {
  var options = {
    method: 'POST',
    body: app
  };

  return this.request('/apps', options, callback);
};

apps.update = function update(id, app, callback) {
  var options = {
    method: 'PATCH',
    body: app
  };

  return this.request('/apps/' + id, options, callback);
};

apps.delete = function _delete(id, callback) {
  var options = {
    method: 'DELETE'
  };

  return this.request('/apps/' + id, options, callback);
};

apps.ps = function ps(id, callback) {
  var options = {
    headers: { 'Accept': 'application/vnd.heroku+json; version=2' }
  };

  return this.request('/apps/' + id + '/ps', options, callback);
};

apps.collaborators = function collaborators(id, callback) {
  return this.request('/apps/' + id + '/collaborators', callback);
};

apps.addons = function addons(appId, addonId, callback) {
  if (typeof addonId === 'string') {
    return this.request('/apps/' + appId + '/addons/' + addonId, callback);
  } else {
    callback = addonId;
    return this.request('/apps/' + appId + '/addons', callback);
  }
};
