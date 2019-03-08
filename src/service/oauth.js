'use strict'
const oauth = require('../model')
const { logger } = require('../helper/logger')

const getAccessToken = (access_token) => {
	return oauth.oauth_tokens.findOne({
		where : {
			access_token
		}
	}).then(result=>{
		return {
			accessToken: result.access_token,
	        client: { id: result.client_id },
	        expires: result.expires,
	        user: { id: result.userId }	
		}
	}).catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const getClient = (client_id, client_secret)=>{
	return oauth.oauth_clients.findOne({
		where : {
			client_id, client_secret
		}
	}).then(result=>{
		return (!result)? false : {
			clientId: result.client_id,
			clientSecret: result.client_secret,
			grants: ['password']
		}
	}).catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const getRefreshToken = (refresh_token) => {
	return oauth.oauth_tokens.findOne({
		where : {
			refresh_token
		}
	}).then(result=>{
		return (!result)? false : {
			access_token: result.access_token,
			access_token_expires_on: result.access_token_expires_on,
			client_id: result.client_id,
			refresh_token: result.refresh_token,
			refresh_token_expires_on: result.refresh_token_expires_on,
			user_id: result.user_id
		}
	}).catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const getUser = (username, password) => {
	return oauth.users.findOne({
		where : {
			username, password
		}
	}).then(result=>{
		return (!result)? false : {
			id: result.id
		}
	}).catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const saveToken = (token, client, user) => {
	return oauth.oauth_tokens.build({
		access_token : token.accessToken,
	    access_token_expires_on: token.accessTokenExpiresOn,
	    client_id: client.id,
	    refresh_token: token.refreshToken,
	    refresh_token_expires_on: token.refreshTokenExpiresOn,
	    user_id: user.id
	}).save()
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
};

const saveAuthorizationCode = (code, client, user) => {

}

module.exports = {
	getAccessToken,
	getClient,
	getRefreshToken,
	getUser,
	saveToken,
	saveAuthorizationCode
}