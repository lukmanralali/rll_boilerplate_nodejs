'use strict'

const assert = require('assert')
const generator = require('./../../../src/helper/util')

describe('[TDD] Helper Test', () => {
 
  it('should return valid string value in char count', done => {
    const sample = generator.getRandomStringUUID()
    assert.equal(64, sample.length)
    done()
   
  })
})