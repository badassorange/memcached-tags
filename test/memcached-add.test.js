'use strict';
/**
 * Test dependencies
 */

const chai = require('chai');
const common = require('./common');
const Memcached = require('memcached');
const tags = require('../');

const expect = chai.expect;
chai.use(require('chai-as-promised'));

global.testnumbers = global.testnumbers || +(Math.random(10) * 1000000).toFixed();

/**
 * Expresso test suite for all `add` related
 * memcached commands
 */
describe('Memcached ADD (promisify/tags)', () => {
  /**
   * Make sure that adding a key which already exists returns an error.
   */
  it('fail to add an already existing key', async () => {
    const memcached = tags(new Memcached(common.servers.single))
      , message = common.alphabet(256)
      , testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    await expect(
      memcached.add(`test:${testnr}`, message, 1000)
    ).to.be.rejectedWith('Item is not stored')

    memcached.end(); // close connections
  });
});

