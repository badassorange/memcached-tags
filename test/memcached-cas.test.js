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
 * Expresso test suite for all `get` related
 * memcached commands
 */
describe('Memcached CAS (promisify/tags)', () => {
  /**
   * For a proper CAS update in memcached you will need to know the CAS value
   * of a given key, this is done by the `gets` command. So we will need to make
   * sure that a `cas` key is given.
   */
  it('set and gets for cas result', async () => {

    const memcached = tags(new Memcached(common.servers.single))
        , message = common.alphabet(256)
        , testnr = ++global.testnumbers;

    const setAnswr = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setAnswr).is.equal(true);
    const answer = await memcached.gets(`test:${testnr}`);

    expect(answer).to.be.a('object');
    expect(!!answer.cas).to.be.equal(true);
    expect(answer[`test:${testnr}`]).to.be.equal(message);

    memcached.end(); // close connections
  });

  /**
   * Create a successful cas update, so we are sure we send a cas request correctly.
   */
  it('successful cas update', async () => {
    const memcached = tags(new Memcached(common.servers.single))
        , message = common.alphabet(256)
        , testnr = ++global.testnumbers;

    const setAnswr = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setAnswr).is.equal(true);

    const getsAnswr = await memcached.gets(`test:${testnr}`);
    expect(!!getsAnswr.cas).is.equal(true);

    // generate new message for the cas update
    const messageCas = common.alphabet(256);
    const casAnswr = await memcached.cas(`test:${testnr}`, messageCas, getsAnswr.cas, 1000);
    expect(!!casAnswr).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).is.equal(messageCas);

    memcached.end(); // close connections
  });

  /**
   * Create a unsuccessful cas update, which would indicate that the server has changed
   * while we where doing nothing.
   */
  it('unsuccessful cas update', async () => {

    const memcached = tags(new Memcached(common.servers.single))
        , message = common.alphabet(256)
        , testnr = ++global.testnumbers;

    expect(
      await memcached.set('test:' + testnr, message, 1000)
    ).is.equal(true);
    
    const getsAnswr = await memcached.gets(`test:${testnr}`);
    expect(!!getsAnswr.cas).is.equal(true);

    // generate new message
    const messageCas = common.alphabet(256);
    expect(
      await memcached.set('test:' + testnr, messageCas, 1000)
    ).is.equal(true);

    expect(
      await memcached.cas(`test:${testnr}`, message, getsAnswr.cas, 1000)
    ).is.equal(false);

    expect(
      await memcached.get(`test:${testnr}`)
    ).is.equal(messageCas);

  });
});
