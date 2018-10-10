# transom-openapi
Add live documentation to your server-side Transomjs APIs with swagger.json and the Swagger UI.

[![Build Status](https://travis-ci.org/transomjs/transom-openapi.svg?branch=master)](https://travis-ci.org/transomjs/transom-openapi)


## Installation

```bash
$ npm install transom-openapi
```

## Usage
```javascript
const Transom = require('@transomjs/transom-core');
const transomOpenApi = require('@transomjs/transom-openapi');

const transom = new Transom();

// Configuration is completely optional
transom.configure(transomOpenApi, {});
```
