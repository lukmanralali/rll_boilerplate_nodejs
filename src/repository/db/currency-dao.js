'use strict'
const model = require('../../model')
const { logger } = require('../../helper/logger')


const getCurrencyByTerm = (currency) => {
	return model.currency.findOne({
		where : {
			currency
		}
	}).then(data=> JSON.parse(JSON.stringify(data)))
}

const getCurrencyById = (id) => {
	return model.currency.findOne({
		where : {
			id
		}
	}).then(data=> JSON.parse(JSON.stringify(data)))
}

module.exports = {
	getCurrencyByTerm,
	getCurrencyById
}