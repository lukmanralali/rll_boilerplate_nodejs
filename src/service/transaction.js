'use strict'
const { currency, transaction } = require('../dao/db')
const userDB = require('../dao/db/user-dao')
const userSuspendHelper = require('../helper/suspend_user_helper')
const awsSQSHelper = require('../helper/aws_sqs_helper')
const { user } = require('../dao/api')
const { logger } = require('../helper/logger')
const math = require('mathjs')
const uuidv1 = require('uuid/v1')
const moment = require('moment')
const Promise = require('bluebird')

const createTransaction = (data, userCredential) => {
	if (data.amount <= 0) {
		return new Promise((resolve, reject) => {
			resolve({
				status: 422,
				message: 'Invalid Amount'
			});
		})
	} else return validateTransactionPayload(data, userCredential)
		.then(validPayload => ((validPayload.status == 200) ? createValidTransaction(validPayload.transactionTypes, data, validPayload.dataValidUser, userCredential) : validPayload))
}

const validateTransactionPayload = (data, userCredential) => {
	let additionalData
	const transType = transaction.listAvailableTransactionType(data.type, data.subType)
	const validUser = userDB.getIDUserActiveByClientIdList(data.user_id)
	return Promise.all([transType, validUser])
		.then(dataPromise => {
			if (!dataPromise[0]) {
				logger.warn('Transaction Type Value Currently Not Available or Not Valid. payload: ' + JSON.stringify(data))
				return {
					status: 422,
					message: "Transaction Type Value Currently Not Available or Not Valid"
				}
			} else if ((dataPromise[0].need_active_account) && userCredential.status == 'Pending') {
				logger.warn('Transaction Need Active Account. userInfo: ' + JSON.stringify(userCredential))
				return {
					status: 422,
					message: "Failed Validate Transaction. Transaction Need Active Account."
				}
			}
			else if (dataPromise[0].beneficiary_used == 2) {
				const returnErrorThisField = {
					status: 422,
					message: "Failed Validate Transaction. User Transaction Issue."
				}
				if (data.user_id == undefined) {
					logger.warn('User ID Not Found Error. transtype: ' + JSON.stringify(dataPromise[0]) + 'userCredential: ' + JSON.stringify(userCredential))
					return returnErrorThisField
				} else if (dataPromise[1].length <= 0) {
					logger.warn('User ID Not Found Error. transtype: ' + JSON.stringify(dataPromise[0]) + 'userCredential: ' + JSON.stringify(userCredential))
					return returnErrorThisField
				}
			} else if (dataPromise[0].beneficiary_used == 1) {
				if (data.user_id !== undefined && dataPromise[1].length <= 0) {
					logger.warn('User ID Not Found Error or InActive. transtype: ' + JSON.stringify(dataPromise[0]) + 'userCredential: ' + JSON.stringify(userCredential))
					return {
						status: 422,
						message: "Failed Validate Transaction. User Transaction Issue."
					}
				}
			}
			return { status: 200, dataValidUser: dataPromise[1], transactionTypes: dataPromise[0] }
		}).catch(err => {
			logger.error('Failed Validate Transaction. ' + JSON.stringify(data))
			logger.error(err)
			return {
				status: 422,
				message: "Failed Validate"
			}
		})
}

const createValidTransaction = (transType, data, dataValidUser, userCredential) => {
	const dataCurency = currency.getCurrencyByTerm(data.curency)
	const ballance = transaction.getBallanceByUserId((transType.default_obligor_id == null) ? userCredential.id : transType.default_obligor_id)
	const is_suspended = userSuspendHelper.checkUserIsSuspended(userCredential.client_id)
	return Promise.all([dataCurency, ballance, is_suspended])
		.then(dataPromise => {
			const dateNow = moment().format('YYYY-MM-DD HH:mm:ss')
			if (!dataPromise[0]) return { status: 422, message: 'Currency Not Found.' }
			else if (dataPromise[2]) return { status: 422, message: 'Your Account is Suspended' }
			else if (data.type !== 'TopUp' && dataPromise[1].balance < data.amount) return { status: 422, message: 'Insufficient Balance.' }
			else return transaction.saveTransaction(revalidateDataUserTransaction({
				trans_reff_number: uuidv1(),
				type: data.type,
				trans_date: (moment(data.trans_date, 'YYYY-MM-DD HH:mm:ss').isAfter(dateNow)) ? data.trans_date : dateNow,
				status: (transType.need_verify) ? 'Pending' : 'Completed',
				amount: data.amount,
				currency_id: dataPromise[0].id,
				remark_1: data.remark_1,
				remark_2: data.remark_2,
				created_at: dateNow,
				updated_at: dateNow
			}, userCredential, transType, dataValidUser), userCredential).then(result => {
				if (!result) return result
				else {
					const listUserId = result.reduce((arrayData, dataObj) => {
						if (arrayData.indexOf(dataObj.obligor.client_id) === -1)
							arrayData.push(dataObj.obligor.client_id)
						if (arrayData.indexOf(dataObj.beneficiary.client_id) === -1)
							arrayData.push(dataObj.beneficiary.client_id)
						return arrayData
					}, [])
					return user.getListUserInfo(userCredential.token, listUserId)
						.then(users => reduceFinalListDetailTransaction(result, users))
						.then(finalResult => ({ status: 201, data: finalResult[0] }))
				}
			})
		}).catch(err => {
			logger.error('Failed Save Transaction. ' + JSON.stringify(data))
			logger.error(err)
			return false
		})
}

const revalidateDataUserTransaction = (data, userCredential, transType, dataValidUser) => {
	data.obligor_id = (transType.default_obligor_id == null) ? userCredential.id : transType.default_obligor_id
	data.beneficiary_id = (transType.default_beneficiary_id == null) ? userCredential.id : transType.default_beneficiary_id
	if (transType.default_beneficiary_id == null) {
		if (transType.beneficiary_used == 1) {
			if (dataValidUser.length >= 1) data.beneficiary_id = dataValidUser[0]
		}
		if (transType.beneficiary_used == 2) data.beneficiary_id = dataValidUser[0]
	}
	return data
}

const validateTransaction = (trans_reff_id, status, userCredential) => {
	return transaction.getTransactionDetailByReffId(trans_reff_id)
		.then(dataList => {
			if (dataList.length !== 0) {
				if (dataList[0].status !== 'Pending')
					return { status: 501, message: 'Transaction Already Validated.' }
				if (userCredential.isAdminResource == 1)
					return transaction.updateStatusTransaction(status, dataList[0].id, userCredential)
						.then(result => detailTransactionById(dataList[0].id, userCredential))
				else if (dataList[0].obligor.id !== userCredential.id && dataList[0].beneficiary.id !== userCredential.id && userCredential.id !== 0)
					return { status: 501, message: 'You Dont Have Permission To Validate This Transaction.' }
				else return transaction.updateStatusTransaction(status, dataList[0].id, userCredential)
					.then(result => detailTransactionById(dataList[0].id, userCredential))
			} else return { status: 204, message: 'Data That Youre Looking Not Found.' }
		}).catch(err => {
			logger.error(err)
			return false
		})
}

const translateCurrencyToIDR = (data, curencyFromDb) => {
	return curencyFromDb(data.currency)
		.then(currency => (!currency) ? false : math.chain(currency.value).multiply(data.amount).done())
		.catch(err => {
			logger.error('Failed Get Currency. ' + JSON.stringify(data))
			return false
		})
}

const translateCurrencyToCurency = (data, curencyFromDb) => {
	return curencyFromDb(data.currency)
		.then(currency => (!currency) ? false : math.chain(data.amount).divide(currency.value).done())
		.catch(err => {
			logger.error('Failed Get Currency. ' + JSON.stringify(data))
			return false
		})
}

const listTransaction = (data, id, token) => {
	return transaction.getListTransaction(data, id)
		.then(dataList => reduceListTransaction(dataList, id))
		.then(dataList => {
			const listUserId = dataList.reduce((arrayData, dataObj) => {
				if (arrayData.indexOf(dataObj.user.client_id) === -1)
					arrayData.push(dataObj.user.client_id)
				return arrayData
			}, [])
			return user.getListUserInfo(token, listUserId)
				.then(users => reduceFinalListTransaction(dataList, users))
		})
}

const listTransactionSpecial = (data, id, token) => {
	return transaction.getListTransactionSpecial(data, id)
		.then(dataList => reduceListTransaction(dataList, id))
		.then(dataList => {
			const listUserId = dataList.reduce((arrayData, dataObj) => {
				if (arrayData.indexOf(dataObj.user.client_id) === -1)
					arrayData.push(dataObj.user.client_id)
				return arrayData
			}, [])
			return user.getListUserInfo(token, listUserId)
				.then(users => reduceFinalListTransaction(dataList, users))
		})
}

const detailTransactionByTransId = (trans_id, userCredential) => {
	return transaction.getTransactionDetailByReffId(trans_id)
		.then(dataList => {
			if (dataList.length !== 0)
				if (dataList[0].obligor.id !== userCredential.id && dataList[0].beneficiary.id !== userCredential.id)
					return []
			return dataList
		})
		.then(dataList => reduceListTransaction(dataList, userCredential.id))
		.then(dataList => {
			const listUserId = dataList.reduce((arrayData, dataObj) => {
				if (arrayData.indexOf(dataObj.user.client_id) === -1)
					arrayData.push(dataObj.user.client_id)
				return arrayData
			}, [])
			return user.getListUserInfo(userCredential.token, listUserId)
				.then(users => reduceFinalListTransaction(dataList, users))
		}).then(result => (result.length >= 1) ? result[0] : false)
		.catch(err => {
			logger.error(err)
			return false
		})
}

const detailTransactionById = (id, userCredential) => {
	return transaction.getTransactionDetailById(id)
		.then(result => {
			if (!result) return result
			else {
				const listUserId = result.reduce((arrayData, dataObj) => {
					if (arrayData.indexOf(dataObj.obligor.client_id) === -1)
						arrayData.push(dataObj.obligor.client_id)
					if (arrayData.indexOf(dataObj.beneficiary.client_id) === -1)
						arrayData.push(dataObj.beneficiary.client_id)
					dataObj.history.forEach(element => {
						if (arrayData.indexOf(element.user_log.client_id) === -1)
							arrayData.push(element.user_log.client_id)
					})
					return arrayData
				}, [])
				return user.getListUserInfo(userCredential.token, listUserId)
					.then(users => reduceFinalListDetailTransaction(result, users))
					.then(finalResult => ({ status: 200, data: finalResult[0] }))
			}
		}).catch(err => {
			logger.error(err)
			return false
		})
}

const historyTransactionSpecialUser = (data, id, token) => {
	if (data.deal_reff !== undefined) {
		if (!['Debit', 'Credit'].indexOf(data.deal_reff) <= -1) data.deal_reff = 'All'
	}
	else data.deal_reff = 'All'
	return userDB.getIDUserActiveByClientIdList(data.client_id)
		.then(ids => {
			data.user_id = ids
			const listTrans = listTransactionSpecial(data, id, token)
			const countData = transaction.getCountTransactionSpecial(data, id)
			return Promise.all([listTrans, countData])
		})
		.then(values => ({
			count: {
				rows: values[1][0].rows,
				page: Math.ceil(values[1][0].rows / data.limit)
			},
			data: values[0]
		})).catch(err => {
			logger.error(err)
			return {}
		})
}


const historyTransaction = (data, id, token, user_id) => {
	if (data.deal_reff !== undefined) {
		if (!['Debit', 'Credit'].indexOf(data.deal_reff) <= -1) data.deal_reff = 'All'
	}
	else data.deal_reff = 'All'
	return userDB.getIDUserActiveByClientIdList(data.client_id)
		.then(ids => {
			data.user_id = ids
			const listTrans = listTransaction(data, id, token)
			const countData = transaction.getCountTransaction(data, id)
			return Promise.all([listTrans, countData])
		})
		.then(values => {
			return userSuspendHelper.checkUserIsSuspended(user_id)
				.then(is_suspended => {
					if (is_suspended) {
						let err = {}
						err.status = 200
						err.message = 'Your Account is Suspended'
						err.is_suspended = true
						return err
					}
					return {
						count: {
							rows: values[1][0].rows,
							page: Math.ceil(values[1][0].rows / data.limit)
						},
						data: values[0]
					}
				})
		}).catch(err => {
			logger.error(err)
			return {}
		})
}


const listTransactionDetail = (data, id, token) => {
	return transaction.getListTransactionDetail(data, id)
		.then(dataList => {
			const listUserId = dataList.reduce((arrayData, dataObj) => {
				if (arrayData.indexOf(dataObj.obligor.client_id) === -1)
					arrayData.push(dataObj.obligor.client_id)
				if (arrayData.indexOf(dataObj.beneficiary.client_id) === -1)
					arrayData.push(dataObj.beneficiary.client_id)
				return arrayData
			}, [])
			return user.getListUserInfo(token, listUserId)
				.then(users => reduceFinalListDetailTransaction(dataList, users))
		}).catch(err => {
			logger.error(err)
			return {}
		})
}

const historyTransactionDetail = (data, id, token) => {
	return userDB.getIDUserActiveByClientIdList(id)
		.then(ids => {
			const listTrans = listTransactionDetail(data, ids, token)
			const countData = transaction.getCountTransaction(data, ids)
			return Promise.all([listTrans, countData])
		})
		.then(values => ({
			count: {
				rows: values[1][0].rows,
				page: Math.ceil(values[1][0].rows / data.limit)
			},
			data: values[0]
		}))
		.catch(err => {
			logger.error(err)
			return {}
		})
}

const reduceListTransaction = (dataList, id) => {
	return dataList.reduce((arrayData, dataObj) => {
		arrayData.push({
			id: dataObj.id,
			trans_reff_number: dataObj.trans_reff_number,
			type: dataObj.type,
			trans_date: dataObj.trans_date,
			status: dataObj.status,
			user: (dataObj.beneficiary.id == id) ? dataObj.obligor : dataObj.beneficiary,
			linked_trans_id: dataObj.linked_trans_id,
			deal_reff: (dataObj.beneficiary.id == id) ? 'Debit' : 'Credit',
			amount: dataObj.amount,
			curency: dataObj.currency,
			remark_1: dataObj.remark_1,
			remark_2: dataObj.remark_2,
			created_at: dataObj.created_at,
			updated_at: dataObj.updated_at,
		})
		return arrayData
	}, [])
}

const reduceFinalListTransaction = (dataList, dataUser) => {
	return dataList.reduce((arrayData, dataObj) => {
		arrayData.push({
			id: dataObj.id,
			trans_reff_number: dataObj.trans_reff_number,
			type: dataObj.type,
			trans_date: dataObj.trans_date,
			status: dataObj.status,
			user: dataUser[dataObj.user.client_id],
			linked_trans_id: dataObj.linked_trans_id,
			deal_reff: dataObj.deal_reff,
			amount: dataObj.amount,
			curency: dataObj.currency,
			remark_1: dataObj.remark_1,
			remark_2: dataObj.remark_2,
			created_at: dataObj.created_at,
			updated_at: dataObj.updated_at,
		})
		return arrayData
	}, [])
}

const reduceFinalListDetailTransaction = (dataList, dataUser) => {
	return dataList.reduce((arrayData, dataObj) => {
		dataObj.obligor = dataUser[dataObj.obligor.client_id]
		dataObj.beneficiary = dataUser[dataObj.beneficiary.client_id]
		dataObj.dealing = dataObj.dealing.reduce((dealings, dealing) => {
			dealing.user = dataUser[dealing.user.client_id]
			dealings.push(dealing)
			return dealings
		}, [])
		dataObj.history = dataObj.history.reduce((historys, history) => {
			history.user = dataUser[history.user_log.client_id]
			delete history.user_log
			historys.push(history)
			return historys
		}, [])
		arrayData.push(dataObj)
		return arrayData
	}, [])
}

const balanceSumary = client_id => {
	return userDB.getUserActiveByClientId(client_id)
		.then(data => (!data) ? false : transaction.getBallanceByUserId(data.id))
		.then(data => {
			return userSuspendHelper.checkUserIsSuspended(client_id)
				.then(suspend => {
					if (suspend) {
						data.is_suspended = true
						data.balance = 0
					}
					return data
				})
		})
		.catch(ex => {
			logger.error(ex)
			return false;
		})
}

const balanceSystemSumary = () => {
	return transaction.getBallanceSystem()
		.catch(ex => {
			logger.error(ex)
			return false;
		})
}
const userSuspendFraud = (dataList,id,token) => {
	return transaction.getListTransactionFraud(dataList)	
	.then(list => { 
		const listUserId = list.reduce((arrayData, dataObj) => {
			if (arrayData.indexOf(dataObj.client_id) === -1)
				arrayData.push(dataObj.client_id)
			return arrayData
		}, [])
		return user.getListUserInfo(token, listUserId)
		.then(users=>{
			const data = reduceListUsersFinal(list,users)
			const countData = transaction.getCountTransactionUserSuspend(dataList)
			return Promise.all([countData, data])	
			.then(values => ({
				count:{
					total_user:values[0].total_user.total,
					row:values[1].length,
					page: Math.ceil(values[0].row.row / dataList.limit)
				},
				data: values[1]
			}))
		})
	})
	.catch(err => {
		logger.error(err)
		return {}
	})
}

const reduceListUsersFinal = (dataList, dataUsers) => {	
	return dataList.reduce((arrayData, dataObj) => {		
			dataObj.email = dataUsers[dataObj.client_id].email
			dataObj.name = dataUsers[dataObj.client_id].name
			dataObj.handphone = dataUsers[dataObj.client_id].handphone
		arrayData.push(dataObj)
		return arrayData
	}, [])
}
const summaryFraud = (token) => {
	return transaction.getSummaryFraud()
	.catch(ex => {
		logger.error(ex)
		return false;
	})
}
const depositTransactionsFraud = (dataDeposit) =>{
	let data = transaction.getOrderTransactionFraud(dataDeposit)
	let countData = transaction.getCountOrderTransactionFraud(dataDeposit)
	return Promise.all([countData, data])	
	.then(values => ({
		count: {
			total_orders: values[0][0].total,
			page: Math.ceil(values[0][0].total / dataDeposit.limit)
		},
		data: values[1]
		
	}))
	.catch(ex => {
		logger.error(ex)
		return false;
	})
}

const reValidateTransaction = (trans_reff_id, status, userCredential) => {
	return transaction.getTransactionDetailByReffIdCanceled(trans_reff_id)
		.then(dataList => {
			if (dataList.length !== 0) {
				return balanceSumary(dataList[0].obligor.client_id)
				.then(userBalance => {
					if(userBalance.balance >= math.round(dataList[0].amount)){
						if (userCredential.isAdminResource == 1)
							return transaction.updateStatusTransaction(status, dataList[0].id, userCredential)
							.then(result => detailTransactionById(dataList[0].id, userCredential))
						else return transaction.updateStatusTransaction(status, dataList[0].id, userCredential)
							.then(result => detailTransactionById(dataList[0].id, userCredential))
					}
				})
			} else return { status: 201, message: 'Data That Youre Looking Not Found.' }
			
		}).catch(err => {
			logger.error(err)
			return false
		})
}

const asyncCrateTransaction = (params,user) => {
	return awsSQSHelper.sendMessage(params,user,'create');
}
module.exports = {
	createTransaction,
	validateTransaction,
	translateCurrencyToIDR,
	translateCurrencyToCurency,
	historyTransaction,
	historyTransactionDetail,
	detailTransactionByTransId,
	detailTransactionById,
	balanceSumary,
	balanceSystemSumary,
	historyTransactionSpecialUser,
	userSuspendFraud,
	summaryFraud,
	depositTransactionsFraud,
	reValidateTransaction,
	asyncCrateTransaction
}