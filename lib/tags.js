const MAP_LIFETIME = 2592000; // 30 days

module.exports = (client, mapLifeTime) => {
  const mlt = mapLifeTime || MAP_LIFETIME;

  const set = client.set;
  const get = client.get;

  const map = async (map) => {
    if (!map) return JSON.parse(await get('__map') || '[]');
    await set('__map', JSON.stringify(map), mlt);
  };

  const delByTag = async (tag) => {
    const m = await map();
    for (const [i, [key, tags = []]] of m.entries()) {
      if (!tags || !tags.includes(tag)) continue;
      m.splice(i, 1);
      await del(key);
    }
    await map(m);
  };


  client.set = async (key, val, lt, tags = []) => {
    const m = await map();
    const i = m.findIndex(([k]) =>k===key);
    if (i>=0) m[i] = [key, tags]; else m.push([key, tags]);
    await map(m);
    return set(key, val, lt);
  };

  client.del = async (key) => {
    const m = await map();
    const i = m.findIndex(([k]) =>k===key);
    if (i>=0) m.splice(i, 1);
    await map(m);
    return del(key);
  };

  client.delByTag = delByTag;

  client.map = map;

  return client;
};
