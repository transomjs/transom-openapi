"use strict";
const expect = require('chai').expect;
const sinon = require('sinon');
const TransomOpenApi = require('../index');

describe('TransomOpenApi', function () {

    beforeEach(function () {
    });

    afterEach(function () {
    });
    
    it('looks like a Transom plugin', function (done) {
        expect(TransomOpenApi).to.be.an.instanceOf(Object);
        expect(TransomOpenApi.initialize).to.be.an.instanceOf(Function);
        done();
    });

    it('needs tests', function (done) {
        done();
    });

});