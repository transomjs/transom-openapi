'use strict';
const debug = require('debug')('transom:openapi');

function TransomOpenApi() {
	let regKey;
	const routes = [];
	const schemas = {};

	this.buildComponents = function (openApiData) {
		openApiData.components = openApiData.components || {};
		openApiData.components.schemas = openApiData.components.schemas || {};
		openApiData.components.securitySchemes = openApiData.components.securitySchemes || {
			basicAuth: {
				type: 'http',
				scheme: 'basic'
			},
			bearerAuth: {
				type: 'http',
				scheme: 'bearer'
			}
		};

		// Add Schemas
		Object.keys(schemas).map((key) => {
			// single
			openApiData.components.schemas[key] = schemas[key];
			if (key.indexOf('-single') > -1) {
				// Create the corresponding '-list' schema that is an array of '-single'.
				openApiData.components.schemas[key.replace('-single', '-list')] = {
					type: 'array',
					items: {
						$ref: `#/components/schemas/${key}`
					}
				};
			}
		});

		return openApiData;
	}

	this.buildPaths = function (server, openApiData) {
		routes.map((opts) => {
			if (openApiData.servers.length === 0) {
				openApiData.servers = [{
					url: server.url
				}];
			}

			openApiData.paths = openApiData.paths || {};
			// Replace url parameters with curly brace wrapped parameters!
			opts.path = opts.path.split('/').map(part => part.charAt(0) === ':' ? `{${part}}` : part).join('/');
			openApiData.paths[opts.path] = openApiData.paths[opts.path] || {};
			openApiData.paths[opts.path][opts.method] = {};

			if (opts.meta) {
				const meta = (typeof opts.meta === 'function' ? opts.meta.call(opts) : opts.meta);
				openApiData.paths[opts.path][opts.method].summary = meta.summary;
				openApiData.paths[opts.path][opts.method].description = meta.description;
				openApiData.paths[opts.path][opts.method].operationId = meta.operationId;
				openApiData.paths[opts.path][opts.method].produces = meta.produces || ['application/json'];
				openApiData.paths[opts.path][opts.method].tags = meta.tags; // an array of String

				// Add all the properties of a 'model' as optional parameters
				openApiData.paths[opts.path][opts.method].parameters = [];
				if (meta.parameters) {
					meta.parameters.map((parameter) => {
						openApiData.paths[opts.path][opts.method].parameters.push({
							name: parameter.name || 'Name not provided',
							in: parameter.in || 'query', // query, header, path or cookie
							description: parameter.description || 'Description not provided', // No description
							required: parameter.required || false,
							schema: parameter.schema || {
								type: 'string'
							}
						});
					});
				}
				if (meta.requestBody) {
					openApiData.paths[opts.path][opts.method].requestBody = {};
					openApiData.paths[opts.path][opts.method].requestBody.description = meta.requestBody.description;
					openApiData.paths[opts.path][opts.method].requestBody.required = meta.requestBody.required || true;
					openApiData.paths[opts.path][opts.method].requestBody.content = meta.requestBody.content || {};
				}
				openApiData.paths[opts.path][opts.method].responses = [];
				if (meta.responses) {
					openApiData.paths[opts.path][opts.method].responses = meta.responses;
				}
				if (meta.schemas) {
					Object.keys(meta.schemas).map((key) => {
						schemas[`${key}`] = meta.schemas[key];
					});
				}
				if (meta.security) {
					openApiData.paths[opts.path][opts.method].security = meta.security;
				}
			}
		});
		return openApiData;
	}

	this.createEventListener = function (server, method) {
		return function (props) {
			const opts = (typeof props[0] === 'object' ? props[0] : {
				path: props[0]
			});
			if (opts.meta) {
				// By deleting paths, we force rebuilding the openapi
				// document each time a new route is added.
				delete server.registry.get(regKey)['paths'];
				opts.method = (opts.method || method).toLowerCase();
				routes.push(opts);
			}
		}
	}

	this.initialize = function (server, options) {
		return new Promise((resolve, reject) => {
			options = options || {};
			regKey = options.registryKey || 'transomOpenApi';

			const openapiConfig = server.registry.get('transom-config.definition.openapi', {});
			openapiConfig.info = openapiConfig.info || {};

			const openApiData = {};
			openApiData.openapi = openapiConfig.version || "3.0.0";
			openApiData.info = openapiConfig.info || {};
			openApiData.info.title = openapiConfig.info.title || 'TransomJS';
			openApiData.info.version = openapiConfig.info.version || '0.0.0';
			openApiData.servers = openapiConfig.servers || [];

			debug("Adding TransomOpenApi data to the registry as:", regKey);
			server.registry.set(regKey, openApiData);

			server.on('transom.route.get', this.createEventListener(server, 'get'));
			server.on('transom.route.post', this.createEventListener(server, 'post'));
			server.on('transom.route.put', this.createEventListener(server, 'put'));
			server.on('transom.route.patch', this.createEventListener(server, 'patch'));
			server.on('transom.route.del', this.createEventListener(server, 'delete'));

			resolve();
		});
	}

	this.preStart = function (server, options) {
		const scaffoldHandler = server.registry.get(options.scaffoldRegistryKey || 'transomScaffold', {});
		// Add a GET request to fetch the SwaggerUI at /docs/index.html.
		if (scaffoldHandler.addStaticAssetRoute) {
			const route = (options.staticRoute === false ? false : options.staticRoute) || {
				path: '/docs/',
				defaultAsset: 'index.html',
				folder: '/node_modules/@transomjs/transom-openapi',
				appendRequestPath: false
			};
			if (route) {
				debug(`Adding GET '${route.path}${route.defaultAsset}' route to Swagger UI.`);
				scaffoldHandler.addStaticAssetRoute(server, route);
			}
			const swaggerAssets = {
				path: '/swagger-ui-dist/*',
				folder: '/node_modules',
				appendRequestPath: true
			};
			debug(`Adding GET '${swaggerAssets.folder}${swaggerAssets.path}' route to Swagger UI assets.`);
			scaffoldHandler.addStaticAssetRoute(server, swaggerAssets);
		}

		// Add a 301 redirect to go from /docs to /docs/.
		if (scaffoldHandler.addRedirectRoute) {
			const route = (options.redirectRoute === false ? false : options.redirectRoute) || {
				path: '/docs',
				target: '/docs/'
			};
			if (route) {
				debug(`Adding '${route.path}' redirect to '${route.target}' for the Swagger UI.`);
				scaffoldHandler.addRedirectRoute(server, route);
			}
		}

		// Add a route to fetch the data as JSON.
		const openapiConfig = server.registry.get('transom-config.definition.openapi', {});
		const outputPath = openapiConfig.outputPath || '/swagger.json';
		debug(`Adding GET '${outputPath}' route to the Swagger output file.`);
		server.get({
			path: outputPath
		}, (req, res, next) => {
			let openApiData = server.registry.get(regKey);
			// Only rebuild the openapi document if we've added paths!
			if (!openApiData.paths) {
				openApiData = this.buildPaths(server, openApiData);
				openApiData = this.buildComponents(openApiData);
			}
			res.json(openApiData);
			next();
		});
	}
}

module.exports = new TransomOpenApi();