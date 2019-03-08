'use strict'
const model = require('../../model')
const { logger } = require('../../helper/logger')

const getUserActiveByClientId = (client_id) => {
	return model.user.findOne({
		where: {
			client_id,
			status: 'Active'
		},
		raw: true
	}).then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const getUserByClientId = (client_id) => {
	return model.user.findOne({
		where: { client_id },
		raw: true
	}).then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const getUserActiveById = (id) => {
	return model.user.findOne({
		where: {
			id,
			status: 'Active'
		},
		raw: true
	}).then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const getIDUserActiveByClientIdList = (idData) => {
	const client_id = Array.isArray(idData) ? {$in : idData} : idData 
	return model.user.findAll({
		where: {
			client_id,
			status: 'Active'
		},
		raw: true
	}).then(data=>{
		let id = []
		const users = JSON.parse(JSON.stringify(data))
		users.forEach(user=>{
			id.push(user.id)
		})
		return id
	}).catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const saveUser = (data) => {
    return model.user.build(data).save()
    .catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const updateUser = (data, id) => {
	return model.user.update(data, {
		  where: { id }
	}).catch(err=>{
		logger.error('failed to update user')
		logger.error(err)
		return false
	})
}

module.exports = {
	getUserActiveByClientId,
	getUserByClientId,
	getUserActiveById,
	getIDUserActiveByClientIdList,
	saveUser,
	updateUser
}