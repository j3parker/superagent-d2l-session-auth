'use strict';

// NOTE: it is tempting to use storage.js to persist expiresAt in a cross-tab
// fashion so that each page doesn't have to pay the cost of doing a preflight.
// However, this could back-fire if logout happens to clear the d2lApi cookie
// before emptying localStorage, etc., so it isn't worth breaking things.
var expiresAt = 0,
    oauth2Enabled = true;

function now() {
	return Date.now()/1000 | 0;
}

function enableOAuth2() {
	oauth2Enabled = true;
}

function disableOAuth2() {
	oauth2Enabled = false;
}

function isOAuth2Enabled() {
	return oauth2Enabled;
}

function accessTokenExpiresAt() {
	return expiresAt;
}

function setAccessTokenExpiresAt(val) {
	expiresAt = val;
}

function processRefreshResponse(err, res) {
	// Prior to OAuth 2 support the refreshcookie route returns 404.
	if(res.status == 404) {
		disableOAuth2();
		return;
	}

	// In the future we should log an error
	if(err || !res.ok) {
		return;
	}

	var cacheControl = res.headers['cache-control'];
	if(!cacheControl) {
		return;
	}

	var directives = cacheControl.split(',');
	var len = directives.length;
	for(var i=0; i<len; i++) {
		if (directives[i].indexOf('max-age') == -1) {
			continue;
		}

		var maxAge = +directives[i].split('=')[1];
		setAccessTokenExpiresAt(now() + maxAge);
		break;
	}
}

module.exports = function(superagent, xsrf) {
	return require('./preflightify')(function(req, accept) {
		if(!isOAuth2Enabled()) {
			return accept();
		}

		if(now() < accessTokenExpiresAt()) {
			return accept();
		}

		superagent
			.post('/d2l/lp/auth/oauth2/refreshcookie')
			.use(xsrf)
			.end(function(err, res) {
				processRefreshResponse(err, res);
				accept();
			});
	});
};

module.exports._accessTokenExpiresAt = accessTokenExpiresAt;
module.exports._setAccessTokenExpiresAt = setAccessTokenExpiresAt;
module.exports._enableOAuth2 = enableOAuth2;
module.exports._disableOAuth2 = disableOAuth2;
module.exports._isOAuth2Enabled = isOAuth2Enabled;
