var assert = require('assert'),
	nock = require('nock'),
	rewire = require('rewire'),
	should = require('should'),
	sinon = require('sinon'),
	request = require('superagent');

nock.disableNetConnect();

var auth = rewire('../');

describe('superagent-auth', function() {
	var getJwt;
	beforeEach(function () {
		getJwt = sinon.stub();
		getJwt.returns(Promise.resolve('foo'));
		auth.__set__('getJwt', getJwt);
	});

	it('adds app id (legacy)', function(done) {
		var endpoint = nock('http://localhost')
			.matchHeader('X-D2L-App-Id', 'deprecated')
			.get('/api')
			.reply(200);

		request
			.get('/api')
			.use(auth)
			.end(function() {
				endpoint.done();
				done();
			});
	});

	[
		['', true],
		['https://foo.api.brightspace.com', true],
		['https://api.brightspace.com', true],
		['http://foo.api.brightspace.com', false],
		['http://api.brightspace.com', false],
		['https://notapi.brightspace.com', false],
		['https://api.brightspace.com.evil.com', false],
		['https://bad.api.brightspace.com.evil.com', false],
		['https://localhost', false]
	].forEach(function (test) {
		var host = test[0],
			shouldAdd = test[1];

		it('should ' + (shouldAdd ? '' : 'NOT ') + 'add jwt token to Authorization header for host "' + host + '"', function (done) {
			var expectedToken = 'token';
			getJwt.returns(Promise.resolve(expectedToken));

			var req;
			if (shouldAdd) {
				req = nock(host || 'http://localhost')
					.matchHeader('Authorization', 'Bearer ' + expectedToken)
					.get('/api')
					.reply(200);
			} else {
				req = nock(host || 'http://localhost')
					.get('/api')
					.reply(200);
			}

			request
				.get(host + '/api')
				.use(auth)
				.end(function (_, res) {
					req.done();

					if (shouldAdd) {
						sinon.assert.called(getJwt);
						assert(res.req._headers.authorization === 'Bearer ' + expectedToken);
					} else {
						sinon.assert.notCalled(getJwt);
						assert(res.req._headers.authorization === undefined);
					}

					done();
				});
		});
	});

	it('doesn\'t block request on preflight failure', function(done) {
		getJwt.returns(Promise.reject(new Error()));

		var req = nock('http://localhost')
			.get('/api')
			.reply(200);

		request
			.get('/api')
			.use(auth)
			.end(function (_, res) {
				req.done();

				sinon.assert.called(getJwt);
				assert(res.req._headers.authorization === undefined);

				done();
			});
	});

	it('should return something from "end" when endpoint is allowed', function() {
		var req = request
			.get('/api')
			.use(auth)
			.end(function() {});

		should.exist(req);
	});

	it('should return something from "end" when endpoint is not allowed', function() {
		var req = request
			.get('http://localhost/api')
			.use(auth)
			.end(function() {});

		should.exist(req);
	});

});
