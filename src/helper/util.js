'use strict'
const uuidv1 = require('uuid/v1')
const uuidv4 = require('uuid/v4')

const getRandomStringUUID = () => (uuidv4()+uuidv1()).replace(/[^a-zA-Z0-9]/g, '')

const formatPageLimit = (data) => {
	data.offset = (data.page<=1)?0:((data.page-1)*data.count)
	data.limit = data.count 
	return data
}

module.exports = {
	getRandomStringUUID,
	formatPageLimit
}