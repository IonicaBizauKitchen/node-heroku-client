module.exports = function account(callback) {
  return this.request('/account', callback);
};
