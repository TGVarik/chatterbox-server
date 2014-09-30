var request = require('request');
var expect = require('../../node_modules/chai/chai').expect;
var basicServer = require('../basic-server').server;
var _ = require('underscore');

var options = {
  headers: {
    'X-Purse-Application-Id': '12345',
    'X-Purse-REST-API-Key'  : 'abcde'
  }
};

describe('Live Node Chat Server', function() {
  it('Should respond to GET requests for /log with a 200 status code', function(done) {
    request(_.extend({uri: 'http://127.0.0.1:3000/classes/messages'}, options), function(error, response, body) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('Should send back parsable stringified JSON', function(done) {
    request(_.extend({uri: 'http://127.0.0.1:3000/classes/messages'}, options), function(error, response, body) {
      expect(JSON.parse.bind(this, body)).to.not.throw();
      done();
    });
  });

  it('Should send back an object', function(done) {
    request(_.extend({uri: 'http://127.0.0.1:3000/classes/messages'}, options), function(error, response, body) {
      parsedBody = JSON.parse(body);
      expect(parsedBody).to.be.an('object');
      done();
    });
  });

  it('Should send an object containing a `results` array', function(done) {
    request(_.extend({uri: 'http://127.0.0.1:3000/classes/messages'}, options), function(error, response, body) {
      parsedBody = JSON.parse(body);
      expect(parsedBody).to.be.an('object');
      expect(parsedBody.results).to.be.an('array');
      done();
    });
  });

  it('Should accept POST requests to /send', function(done) {
    var requestParams = {method: 'POST',
      uri: 'http://127.0.0.1:3000/classes/messages',
      headers: {'content-type': 'application/json'},
      json: {
        username: 'Jono',
        message: 'Do my bidding!'}
    };
    _.extend(requestParams, options);

    request(requestParams, function(error, response, body) {
      expect(response.statusCode).to.equal(201);
      done();
    });
  });

  it('Should respond with messages that were previously posted', function(done) {
    var requestParams = {method: 'POST',
      uri: 'http://127.0.0.1:3000/classes/messages',
      headers: {'content-type': 'application/json'},
      json: {
        username: 'Jono',
        message: 'Do my bidding!'}
    };
    _.extend(requestParams, options);

    request(requestParams, function(error, response, body) {
      // Now if we request the log, that message we posted should be there:
      request(_.extend({uri: 'http://127.0.0.1:3000/classes/messages'}, options), function(error, response, body) {
          var messages = JSON.parse(body).results;
          expect(messages[0].username).to.equal('Jono');
          expect(messages[0].message).to.equal('Do my bidding!');
          done();
        });
    });
  });

  it('Should 404 when asked for a nonexistent file', function(done) {
    request(_.extend({uri: 'http://127.0.0.1:3000/arglebargle'}, options), function(error, response, body) {
      expect(response.statusCode).to.equal(404);
      done();
    });
  });


});
