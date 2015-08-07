'use strict';

var storage = require('./storage');

module.exports = function(superagent) {
	return require('./preflightify')(function(req, accept) {
		function finish(token) {
			req.set('X-Csrf-Token', token);
			accept();
		}

		var token = storage.get('XSRF.Token');

		if(token !== null) {
			return finish(token);
		}

		superagent
			.get('/d2l/lp/auth/xsrf-tokens')
			.end(function(err, res) {
				if(err || !res.ok) {
					// TODO: log something
					return;
				}

				var token = res.body.referrerToken;
				storage.set('XSRF.Token', token);
				finish(token);
			});
		});
};
