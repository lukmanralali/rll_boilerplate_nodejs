'use strict'
const axios = require('axios')
const { logger } = require('../../helper/logger')
const Promise = require('bluebird')

const getUserByToken = (tokenString) => {
    return axios.get(process.env.OAUTH_URL+'/profile', { headers: {'x-access-token': tokenString, 'authorization': 'Basic cmFsYWxpYmV0YTpiMmJtYXJrZXRwbGFjZQ=='} })
	.then(response => {
		if(response.status==200)
			if(response.data.success!==undefined) 
				return response.data.success.user_data
		logger.warn('Failed To Fetch User. detail: '+response)
		return false
	}).catch(err => {
		delete err.response.request
		logger.error('Failed To Get Oauth Data. detail: '+JSON.stringify(err.response))
		return false
	})
}

const getUserById = (tokenString,id) => {
	id=(id==0)? 'system' : id
    return axios.get(process.env.OAUTH_URL+'/profile/'+id, { headers: {'x-access-token': tokenString, 'authorization': 'Basic cmFsYWxpYmV0YTpiMmJtYXJrZXRwbGFjZQ=='} })
	.then(response => {
		if(response.status==200)
			if(response.data.success!==undefined) 
				return response.data.success.user_data
		logger.warn('Failed To Fetch User. detail: '+response)
		return false
	}).catch(err => {
		delete err.response.request
		logger.error('Failed To Get Oauth Data. detail: '+JSON.stringify(err.response))
		return false
	})
}

const getListUserInfo = (tokenString, userIdList) => {
	let promises = [];
	userIdList.forEach(id=> promises.push(getUserById(tokenString, id)))
	return Promise.all(promises)
	.then(data=>{
		return data.reduce((map, obj)=>{
			if(obj) map[obj.id] = obj;
		    return map;
		}, {})
	}).catch(err=>{
		logger.error('Failed To Get User Data. detail: '+JSON.stringify(err))
		return false
	});
}

module.exports = {
	getUserByToken,
	getUserById,
	getListUserInfo
}