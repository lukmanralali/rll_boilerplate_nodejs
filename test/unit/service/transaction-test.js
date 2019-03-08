'use strict'

require('dotenv').load()
var proxyquire =  require('proxyquire')
var assert = require('assert')
const Promise = require('bluebird')


describe('[TDD] Transaction Test', (done) => {
  it('should return value from DB and converted. List transaction', () => {
    const data = {}
    var transactionStub   =  { }
    var transactionService = proxyquire('./../../../src/controller/transaction', { '../dao/db': transactionStub });
    transactionStub.transaction.getListTransaction = (data, id) => new Promise(function(resolve, reject) {
      resolve([{
        trans_reff_number:'12345-12345-12334',
        type:'Order',
        trans_date:'2018-04-04 09:09:09',
        status:'Completed',
        obligor:{
          id: 2,
          name: 'Lukmin',
          client_id: 2,
          email: 'lukmin@mail.com'
        },
        beneficiary: {
          id: 1,
          client_id: 1,
          name: 'Lukman',
          email: 'lukman@mail.com'
        },
        amount:20000,
        currency:{
          name: 'IDR',
          desc: 'Indonesia Rupiah'
        },
        info_1:'ORD/123/12/12/2018',
        info_2:'refund order',
        created_at:'2018-04-04 09:09:09',
        updated_at:'2018-04-04 09:09:09',
      },
      {
        trans_reff_number:'12345-12345-12335',
        type:'Order',
        trans_date:'2018-04-04 09:09:09',
        status:'Completed',
        obligor: {
          id: 1,
          client_id: 1,
          name: 'Lukman',
          email: 'lukman@mail.com'
        },
        beneficiary:{
          id: 2,
          client_id: 2,
          name: 'Lukmin',
          email: 'lukmin@mail.com'
        },
        amount:20000,
        currency:{
          name: 'IDR',
          desc: 'Indonesia Rupiah'
        },
        info_1:'ORD/123/12/12/2018',
        info_2:'refund order',
        created_at:'2018-04-04 09:09:09',
        updated_at:'2018-04-04 09:09:09',
      }]);
    })
    
    return transactionService.historyTransaction(data, 2)
    .then(result=>{
      assert.equal('Credit', result.data[0].deal_reff)
      assert.equal('Debit', result.data[1].deal_reff)
    }).finally(done)
  })

})