'use strict'
const axios = require('axios')
const { logger } = require('./logger')
const { user } = require('./../dao/db')
let UrlPattern = require('url-pattern');

// be aware with patttern, see usage with url-pattern docs
const exceptionalUrl = [
	{url:'/api/v1/user/activate',auth:false},
	{url:'/api/v1/user/register',auth:false},
	{url:'/api/v1/transaction/system/cancel/:transReffNumber',auth:true},
	{url:'/api/v1/transaction/system/validate/:transReffNumber',auth:true},
	{url:'/api/v1/wallet/balance/system/client/:clientId',auth:true},
	{url:'/api/v1/transaction/system',auth:true},
	{url:'/api/v1/transaction/system/revalidate/:transReffNumber',auth:true},
	{url:'/api/v1/transaction/async/system',auth:true}
]

const exceptionalUrlAdmin = [
	{url:'/api/v1/transaction/admin/validate/:transReffNumber',auth:false},
	{url:'/api/v1/transaction/revalidate/:transReffNumber',auth:true}
]


const authenticate = (req, res, next) => {
	const filterUrl=matcherUrl(req._parsedUrl.pathname, exceptionalUrl)
	if(filterUrl.length==1){
		if(filterUrl[0].auth){
			const authData=(req.headers['Authorization'])? req.headers['Authorization'] : req.headers['authorization']
			if(!authData){
				res.status(401).send({
					authorized: false,
					message: 'Full Authentication is Required to Access This Resource.'
				})
			}else{
				const authArray=new Buffer(authData.split(" ")[1], 'base64').toString().split(":")
				if(authArray[0]==process.env.BASICAUTH_UNAME && authArray[1]==process.env.BASICAUTH_PASSWD){
					req.user={ id:0, status:'Active', client_id:0 }
					next()
				}else{
					res.status(403).send({
						authorized: false,
						message: 'You Dont Have Access To This Resource. Please Contact Administrator.'
					})
				}
			}
		}else next()
	}else if(filterUrl.length>=2){
		logger.error('Resource Configuration Failed. '+req._parsedUrl.pathname+' | '+JSON.stringify(exceptionalUrl))
		res.status(401).send({
			authorized: false,
			message: 'Resource Configuration Failed.'
		})
	}else if(!req.headers['x-access-token']) {
		res.status(401).send({
			authorized: false,
			message: 'Full Authentication is Required to Access This Resource.'
		})
	}else return axios.get(process.env.OAUTH_URL+'/profile', { headers: {'x-access-token': req.headers['x-access-token']} })
	.then(response => {
		if(response.status==200){
			if(response.data.success!==undefined) {
				req.user = response.data.success.user_data
				return user.getUserByClientId(response.data.success.user_data.id)
				.then(userData=>{
					if(userData){
						const filterUrl2=matcherUrl(req._parsedUrl.pathname, exceptionalUrlAdmin)
						req.user.id = userData.id
						req.user.status = userData.status
						req.user.client_id = userData.client_id
						req.user.token = req.headers['x-access-token']
						if(filterUrl2.length>=1) req.user.isAdminResource = 1
						next()
					}else return res.status(403).send({
						authorized: false,
						message: 'You Dont Have Access To This Resource. Please Contact Administrator'
					})
				})
			}else return res.status(403).send({
				authorized: false,
				message: 'You Dont Have Access To This Resource. Please Contact Administrator'
			})
		}
	}).catch(err => {
		delete err.response.request
		logger.error('Failed To Get Oauth Data. detail: '+JSON.stringify(err.response))
		return res.status(err.response.status).send({
			authorized: false,
			message: 'You Dont Have Access To This Resource. Please Contact Administrator'
		})
	})
}

const matcherUrl = (url, expression) => {
	return expression.filter(urlPattern=>{
		let pattern = new UrlPattern(urlPattern.url)
		return pattern.match(url)
	})
}

module.exports = {
	authenticate
}