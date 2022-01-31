const promisify = require('./lib/promisify.js');
const tags = require('./lib/tags.js')

module.exports = (client) => tags(promisify(client));
