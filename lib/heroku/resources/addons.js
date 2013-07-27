module.exports = addons;

function addons(id, callback) {
  var options = {
    headers: { 'Accept': 'application/vnd.heroku+json; version=2' }
  }

  if (typeof id === 'string') {

    return this.request('/addons/' + id, options, callback);

  } else {

    callback = id;
    return this.request('/addons', options, callback);

  }
};
