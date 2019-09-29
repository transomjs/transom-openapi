# transom-openapi
Add live documentation to your server-side Transomjs APIs with swagger.json and the Swagger UI.

[![Build Status](https://travis-ci.org/transomjs/transom-openapi.svg?branch=master)](https://travis-ci.org/transomjs/transom-openapi)


## Installation

```bash
$ npm install @transomjs/transom-openapi
```

## Usage
```javascript
const Transom = require('@transomjs/transom-core');
const transomOpenApi = require('@transomjs/transom-openapi');

const transom = new Transom();

transom.configure(transomOpenApi); // That's it!
```
