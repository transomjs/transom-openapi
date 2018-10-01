'use strict';
const debug = require('debug')('transom:openapi');

function TransomOpenApi() {

	this.initialize = function (server, options) {
		return new Promise(function (resolve, reject) {
			debug('initializing transomOpenApi');
			options = options || {};

			resolve();
		});
	}
}

module.exports = new TransomOpenApi();