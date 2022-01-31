const promisify = require('util').promisify;

module.exports = (client) => {
  client.set = promisify(client.set).bind(client);
  client.get = promisify(client.get).bind(client);
  client.del = promisify(client.del).bind(client);
  client.touch = promisify(client.touch).bind(client);
  client.gets = promisify(client.gets).bind(client);
  client.getMulti = promisify(client.getMulti).bind(client);
  client.replace = promisify(client.replace).bind(client);
  client.add = promisify(client.add).bind(client);
  client.cas = promisify(client.cas).bind(client);
  client.append = promisify(client.append).bind(client);
  client.prepend = promisify(client.prepend).bind(client);
  client.incr = promisify(client.incr).bind(client);
  client.decr = promisify(client.decr).bind(client);

  return client;
};
