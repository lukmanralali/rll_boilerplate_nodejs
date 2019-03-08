'use strict'

require('dotenv').load()
const assert = require('assert')
const transaction = require('./../../../src/controller/transaction')

describe('[TDD] Curency Test', () => {
  const mockDataCurrencyIDRtoUSD = (data) => new Promise(function(resolve, reject) {
    resolve({
      value: 0.0000725896
    });
  })
  it('should return valid value from multiply-ing value currency IDR to USD', done => {
    const data = {
      currency: 'USD',
      amount: 4525123
    }
    transaction.translateCurrencyToIDR(data, mockDataCurrencyIDRtoUSD)
    .then(result=>{
      assert.equal(328.4768685208, result)
      done()
    })
  })

  const mockDataCurrencyUSDtoIDR = (data) => new Promise(function(resolve, reject) {
    resolve({
      value: 0.0000725896
    });
  })
  it('should return valid value from multiply-ing value currency USD to IDR', done => {
    const data = {
      currency: 'USD',
      amount: 328.4768685208
    }
    transaction.translateCurrencyToCurency(data, mockDataCurrencyUSDtoIDR)
    .then(result=>{
      assert.equal(4525123, result)
      done()
    })
  })

  const mockDataCurrencyIDRtoCNY = (data) => new Promise(function(resolve, reject) {
    resolve({
      value: 0.000458215
    });
  })
  it('should return valid value from multiply-ing value currency IDR to CNY', done => {
    const data = {
      currency: 'CNY',
      amount: 4525123
    }
    transaction.translateCurrencyToIDR(data, mockDataCurrencyIDRtoCNY)
    .then(result=>{
      assert.equal(2073.4792354450, result)
      done()
    })
  })

  const mockDataCurrencyCNYtoIDR = (data) => new Promise(function(resolve, reject) {
    resolve({
      value: 0.000458215
    });
  })
  it('should return valid value from multiply-ing value currency USD to IDR', done => {
    const data = {
      currency: 'CNY',
      amount: 2073.4792354450
    }
    transaction.translateCurrencyToCurency(data, mockDataCurrencyCNYtoIDR)
    .then(result=>{
      assert.equal(4525123, result)
      done()
    })
  })
})