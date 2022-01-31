/**
 * Test dependencies
 */
/*
var assert = require('chai').assert
  , should = require('chai').should()
  , fs = require('fs')
  , common = require('./common')
  , Memcached = require('memcached');
*/

const fs = require('fs');
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
describe("Memcached GET SET (promisify/tags)", () => {
  /**
   * Make sure that the string that we send to the server is correctly
   * stored and retrieved. We will be storing random strings to ensure
   * that we are not retrieving old data.
   */
  it("set and get a regular string", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = common.alphabet(256);
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`)
    expect(answer).to.be.equal(message);

    memcached.end(); // close connections
  });

  it("set and get an empty string", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, '', 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).to.be.equal('');

    memcached.end(); // close connections
  });

  /**
   * Set a stringified JSON object, and make sure we only return a string
   * this should not be flagged as JSON object
   */
  it("set and get a JSON.stringify string", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = JSON.stringify({
      numbers: common.numbers(256),
      alphabet: common.alphabet(256),
      dates: new Date(),
      arrays: [1, 2, 3, 'foo', 'bar'],
    });
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).to.be.equal(message);

    memcached.end(); // close connections
  });

  /**
   * Setting and getting a unicode value should just work, we need to make sure
   * that we send the correct byteLength because utf8 chars can contain more bytes
   * than "str".length would show, causing the memcached server to complain.
   */
  it("set and get a regular string", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = 'привет мир, Memcached и nodejs для победы';
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).to.be.equal(message);
    memcached.end(); // close connections
  });

  /**
   * A common action when working with memcached servers, getting a key
   * that does not exist anymore.
   */
  it("get a non existing key", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const testnr = ++global.testnumbers;

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).to.be.equal(undefined);

    memcached.end(); // close connections
  });

  /**
   * Make sure that Numbers are correctly send and stored on the server
   * retrieval of the number based values can be tricky as the client might
   * think that it was a INCR and not a SET operation.. So just to make sure..
   */
  it("set and get a regular number", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = common.numbers(256);
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).to.be.equal(message);

    memcached.end(); // close connections
  });

  /**
   * Objects should be converted to a JSON string, send to the server
   * and be automagically JSON.parsed when they are retrieved.
   */
  it("set and get a object", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = {
      numbers: common.numbers(256),
      alphabet: common.alphabet(256),
      dates: new Date(),
      arrays: [1, 2, 3, 'foo', 'bar'],
    };
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).to.be.an('object');
    expect(JSON.stringify(answer)).to.be.equal(JSON.stringify(message));

    memcached.end(); // close connections
  });

  /**
   * Arrays should be converted to a JSON string, send to the server
   * and be automagically JSON.parsed when they are retrieved.
   */
  it("set and get a array", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = [{
      numbers: common.numbers(256)
      , alphabet: common.alphabet(256)
      , dates: new Date()
      , arrays: [1,2,3, 'foo', 'bar']
    }, {
      numbers: common.numbers(256)
      , alphabet: common.alphabet(256)
      , dates: new Date()
      , arrays: [1,2,3, 'foo', 'bar']
    }];
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).to.be.an('array');
    expect(JSON.stringify(answer)).to.be.equal(JSON.stringify(message));

    memcached.end(); // close connections
  });

  /**
   * Buffers are commonly used for binary transports So we need to make sure
   * we support them properly. But please note, that we need to compare the
   * strings on a "binary" level, because that is the encoding the Memcached
   * client will be using, as there is no indication of what encoding the
   * buffer is in.
   */
  it("set and get <buffers> with a binary image", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = fs.readFileSync(`${__dirname}/fixtures/hotchicks.jpg`);
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    // TODO: add chai-bytes extends
    // expect(answer).to.equalBytes(message);
    expect(answer.toString('binary')).to.be.equal(message.toString('binary'));

    memcached.end(); // close connections
  });

  /**
   * Get binary of the lipsum.txt, send it over the connection and see
   * if after we retrieved it, it's still the same when we compare the
   * original with the memcached based version.
   *
   * A use case for this would be storing <buffers> with HTML data in
   * memcached as a single cache pool..
   */
  it("set and get <buffers> with a binary text file", async () => {
    const memcached = tags(new Memcached(common.servers.single));

    const message = fs.readFileSync(`${__dirname}/fixtures/lipsum.txt`);
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    // TODO: add chai-bytes extends
    // expect(answer).to.equalBytes(message);
    expect(answer.toString('utf8')).to.be.equal(message.toString('utf8'));
    expect(answer.toString('ascii')).to.be.equal(message.toString('ascii'));

    memcached.end(); // close connections
  });

  /**
   * Set maximum amount of data (1MB), should trigger error, not crash.
   */
  it("set maximum data and check for correct error handling", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = fs.readFileSync(`${__dirname}/fixtures/lipsum.txt`).toString();
    const testnr = ++global.testnumbers;

    await expect(
      memcached.set(`test:${testnr}`, new Array(100).join(message), 1000)
    ).to.be.rejectedWith('The length of the value is greater than 1048576')

    memcached.end(); // close connections
  });

  /**
   * Not only small strings, but also large strings should be processed
   * without any issues.
   */
  it("set and get large text files", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = fs.readFileSync(`${__dirname}/fixtures/lipsum.txt`, 'utf8');
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).to.be.an('string');
    expect(answer).to.be.equal(message);

    memcached.end(); // close connections
  });

  /**
   * A multi get on a single server is different than a multi server multi get
   * as a multi server multi get will need to do a multi get over multiple servers
   * yes, that's allot of multi's in one single sentence thanks for noticing
   */
  it("multi get single server", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = common.alphabet(256);
    const message2 = common.alphabet(256);
    const testnr = ++global.testnumbers

    const setRes1 = await memcached.set(`test1:${testnr}`, message, 1000);
    expect(setRes1).is.equal(true);

    const setRes2 = await memcached.set(`test2:${testnr}`, message2, 1000);
    expect(setRes2).is.equal(true);

    const answer = await memcached.get([`test1:${testnr}`, `test2:${testnr}`]);
    expect(answer).to.be.an('object');
    expect(answer[`test1:${testnr}`]).to.be.equal(message);
    expect(answer[`test2:${testnr}`]).to.be.equal(message2);

    memcached.end(); // close connections
  });

  /**
   * A multi get on a single server is different than a multi server multi get
   * as a multi server multi get will need to do a multi get over multiple servers
   * yes, that's allot of multi's in one single sentence thanks for noticing
   */
  it("multi get multi server", async () => {
    const memcached = tags(new Memcached(common.servers.multi));
    const message = common.alphabet(256);
    const message2 = common.alphabet(256);
    const testnr = ++global.testnumbers;

    const setRes1 = await memcached.set(`test1:${testnr}`, message, 1000);
    expect(setRes1).is.equal(true);

    const setRes2 = await memcached.set(`test2:${testnr}`, message2, 1000);
    expect(setRes2).is.equal(true);

    const answer = await memcached.get([`test1:${testnr}`, `test2:${testnr}`]);
    expect(answer).to.be.an('object');
    expect(answer[`test1:${testnr}`]).to.be.equal(message);
    expect(answer[`test2:${testnr}`]).to.be.equal(message2);

    memcached.end(); // close connections
  });

  /**
   * Make sure that a string beginning with OK is not interpreted as
   * a command response.
   */
  it("set and get a string beginning with OK", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = 'OK123456';
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).to.be.an('string');
    expect(answer).to.be.equal(message);
    memcached.end(); // close connections
  });

  /**
   * Make sure that a string beginning with OK is not interpreted as
   * a command response.
   */
  it("set and get a string beginning with VALUE", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = 'VALUE hello, I\'m not really a value.';
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).to.be.an('string');
    expect(answer).to.be.equal(message);
    memcached.end(); // close connections
  });

  /**
   * Make sure that a string containing line breaks are escaped and
   * unescaped correctly.
   */
  it("set and get a string with line breaks", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = '1\n2\r\n3\n\r4\\n5\\r\\n6\\n\\r7';
    const testnr = ++global.testnumbers;

    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).to.be.an('string');
    expect(answer).to.be.equal(message);
    memcached.end(); // close connections
  });

  /**
   * Make sure long keys are hashed
   */
  it("make sure you can get really long strings", async () => {
    const memcached = tags(new Memcached(common.servers.single));
    const message = 'VALUE hello, I\'m not really a value.';
    const testnr = "01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789"+(++global.testnumbers);


    const setRes = await memcached.set(`test:${testnr}`, message, 1000);
    expect(setRes).is.equal(true);

    const answer = await memcached.get(`test:${testnr}`);
    expect(answer).to.be.an('string');
    expect(answer).to.be.equal(message);
    memcached.end(); // close connections
  });

  /**
   * Make sure keys with spaces return an error
   */
  it("errors on spaces in strings", async () => {
    return;
    var memcached = new Memcached(common.servers.single)
      , message = 'VALUE hello, I\'m not really a value.'
      , testnr = " "+(++global.testnumbers)
      , callbacks = 0;

    memcached.set("test:" + testnr, message, 1000, function(error, ok){
      ++callbacks;

      assert.ok(error);
      assert.ok(error.message === 'The key should not contain any whitespace or new lines');

      done();
    });
  });

  /*
    Make sure that getMulti calls work for very long keys.
    If the keys aren't hashed because they are too long, memcached will throw exceptions, so we need to make sure that exceptions aren't thrown.
  */
  it("make sure you can getMulti really long keys", function(done) {
    var memcached = new Memcached(common.servers.single)
      , message = 'My value is not relevant'
      , testnr1 = "01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789"+(++global.testnumbers)
      , testnr2 = "01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789"+(global.testnumbers)+"a"
      , callbacks = 0;

    memcached.getMulti([ testnr1, testnr2 ], function(error, ok) {
      ++callbacks;

      assert.ok(!error);
      memcached.end();
      assert.equal(callbacks, 1);
      done();
    });
  });
});
