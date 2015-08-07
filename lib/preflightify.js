'use strict';

// This is a superagent plugin generator
module.exports = function(preflight) {
	// This is a superagent plugin
	return function(req) {
		var oldEnd = req.end;

		req.end = function(cb) {
			function accept() {
				req.end = oldEnd;
				req.end(cb);
			}

			preflight(req, accept);
		};

		return req;
	};
};
