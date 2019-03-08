'use strict';
const currency = require('./currency-dao')
const transaction = require('./transactions-dao')
const user = require('./user-dao')

module.exports = { 
	currency,
	transaction,
	user
}
