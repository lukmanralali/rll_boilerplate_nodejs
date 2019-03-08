'use strict'
const axios = require('axios')
const { logger } = require('../helper/logger')
const { user } = require('../dao/db')

const activate = (token) => {
	return axios.get(process.env.OAUTH_URL+'/profile', { headers: {'x-access-token': token} })
	.then(response => {
		if(response.data.success!==undefined) {
			return user.getUserByClientId(response.data.success.user_data.id)
			.then(userData=>{
				if(userData){
					if(userData.status=='Pending'){
						user.updateUser({status: 'Active'}, userData.id)
						return { status: 201 ,info: response.data.success.user_data }
					}
					else return { status: 422 ,info: 'User Already Active' }
				} 
				else{
					user.saveUser({
    					client_id: response.data.success.user_data.id,
    					status: 'Active'
					})
					return { status: 201 ,info: response.data.success.user_data }	
				}
			})
		}else return { status: 201, info: 'User Not Found' }
	}).catch(err => {
		console.log(err)
		delete err.response.request
		logger.error(err)
		return { status: err.response.status, info: 'Something Wrong. Cant Get Information User' }
	})
} 

const register = (token) => {
	return axios.get(process.env.OAUTH_URL+'/profile', { headers: {'x-access-token': token} })
	.then(response => {
		if(response.data.success!==undefined) {
			return user.getUserByClientId(response.data.success.user_data.id)
			.then(userData=>{
				if(!userData){
					user.saveUser({
    					client_id: response.data.success.user_data.id,
    					status: 'Pending'
					})
					return { status: 201 ,info: response.data.success.user_data }
				} 
				else return { status: 422 ,info: 'User Already Registered' }
			})
		}else return { status: 201, info: 'User Not Found' }
	}).catch(err => {
		delete err.response.request
		logger.error(err)
		return { status: err.response.status, info: 'Something Wrong. Cant Get Information User' }
	})
}


const getIDUserActiveByClientIdList = (id) => user.getIDUserActiveByClientIdList(id)
const getIDUserActiveByClientId = (id) => user.getUserActiveByClientId(id)
const getIDUserActiveByUserId = (id) => user.getUserActiveById(id)

module.exports = {
	activate,
	register,
	getIDUserActiveByUserId,
	getIDUserActiveByClientId,
	getIDUserActiveByClientIdList
}