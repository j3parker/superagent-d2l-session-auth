'use strict';

var globalStorage = null;

function useGlobalStorage() {
	globalStorage = {};
	return globalStorage;
}

try {
	localStorage.setItem('test', 'test');
	localStorage.removeItem('test');
} catch(e) {
	useGlobalStorage();
}

module.exports.set = function(key, value) {
	if(globalStorage) {
		globalStorage[key] = value;
	} else {
		localStorage.setItem(key, value);
	}
};

module.exports.get = function(key) {
	if(globalStorage) {
		return globalStorage[key];
	} else {
		return localStorage.getItem(key);
	}
}

module.exports._useGlobalStorage = useGlobalStorage;
