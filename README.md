# transom-openapi
Add OpenApi support to server-side Transom APIs.

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

transom.configure(transomOpenApi, {});
```
