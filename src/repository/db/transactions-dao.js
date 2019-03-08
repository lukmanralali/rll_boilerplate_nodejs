'use strict'
const model = require('../../model')
const { logger } = require('../../helper/logger')
const math = require('mathjs')
const Sequelize = require('sequelize')
const moment = require('moment')
const Promise = require('bluebird')

const listAvailableTransactionType = (type, subType="") => {
	let sub_type = null
	if(type=="TopUp"){
		sub_type = (subType=="" || subType==undefined || subType==null) ? "Marketing" : subType
	}else sub_type=null
	return model.transaction_type.findOne({
		where : {type, sub_type},
		attributes: { 
			exclude: ['updated_at'] 
		}
	}).then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const specialUserId = [0,1,2]


const saveTransaction = (data, userCredential) => {
	return model.sequelize.transaction(trans=> model.transactions.build(data, {transaction: trans}).save()
		.then(dataTrans=>{
			const saveLog = model.transaction_status_log.build({
			    transaction_id: dataTrans.id,
			    status: data.status,
			    created_at: data.created_at,
			    user_id: userCredential.id
			},{transaction: trans}).save()
			const saveDebitDeal = model.transaction_dealing.build({
			    transaction_id: dataTrans.id,
			    deal_reff: 'Debit',
			    created_at: data.created_at,
			    user_deal_reff_id: dataTrans.beneficiary_id 
			},{transaction: trans}).save()
			const saveCreditDeal = model.transaction_dealing.build({
			    transaction_id: dataTrans.id,
			    deal_reff: 'Credit',
			    created_at: data.created_at,
			    user_deal_reff_id: dataTrans.obligor_id 
			},{transaction: trans}).save()
			return Promise.all([saveLog, saveDebitDeal, saveCreditDeal])
			.then(()=> getTransactionDetailById(dataTrans.id))
	})).then(result=> JSON.parse(JSON.stringify(result)))
	.catch(err=>{
		logger.error('transaction database failed. trying to going rollback')
		logger.error(err)
		return false
	})
}

const updateStatusTransaction = (status, transaction_id, userCredential) => {
	const updated_at = moment().format('YYYY-MM-DD hh:mm:ss')
	return model.sequelize.transaction(trans=> 
		model.transactions.update({status,updated_at}, { where: { id:transaction_id }})
		.then(dataUpdate=> model.transaction_status_log.build({
			    transaction_id,
			    status,
			    created_at: updated_at,
			    user_id: userCredential.id
			},{transaction: trans}).save())
		.then(result=> JSON.parse(JSON.stringify(result)))
	).catch(err=>{
		logger.error('transaction database failed. trying to going rollback')
		logger.error(err)
		return false
	})
}

const getListTransactionDetail = (data, id=null, mainId=null) => { 
	return getListTransactionReffNumberDetail(data, id, mainId)
	.then(trans_reff_number=>{
		trans_reff_number = JSON.parse(JSON.stringify(trans_reff_number))
		trans_reff_number = trans_reff_number.map(x => x.trans_reff_number)
		return model.transactions.findAll({
			where: {trans_reff_number},
			include: [{
				model: model.currency,
				required: true,
				as: 'currency',
				attributes: ['currency','desc']
			},{
				model: model.user,
				required: true,
				as: 'obligor'
			},{
				model: model.user,
				required: true,
				as: 'beneficiary'
			},{
				model: model.transaction_dealing,
				required: true,
				as: 'dealing',
				attributes: ['deal_reff'],
				include: [{
					model: model.user,
					required: true,
					as: 'user'
				}]
			},{
				model: model.transaction_status_log,
				required: true,
				as: 'history',
				attributes: { 
					exclude: ['transaction_id','user_id'] 
				},
				include: [{
					model: model.user,
					required: true,
					as: 'user_log',
					attributes: { 
						exclude: ['created_at','status'] 
					}
				}]
			}],
			attributes: { 
				exclude: ['currency_id','beneficiary_id','obligor_id','updated_at'] 
			},
			order: [
				['trans_date', data.order]
			],
			subQuery: false
		})
	})
	.then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
};

const getListTransactionReffNumberDetail = (data, id=null) => { 
	let mainId=data.user_id
	let where = {}
	if(id!==null){
		id = Array.isArray(id) ? ((id.length!==0) ? {$in : id} : null) : id 
		mainId = Array.isArray(mainId) ? ((mainId.length!==0) ? {$in : mainId} : null) : mainId 
		if(data.deal_reff=='Debit') where.beneficiary_id= id
		else if(data.deal_reff=='Credit') where.obligor_id= id
		else {
			if(mainId==null && id!==null) where = { $or: [ { obligor_id: id }, { beneficiary_id: id } ] }
			else if(id!==null){
				where = {
					$or: [
						{ $and: [{ obligor_id: id}, {beneficiary_id: mainId} ]}, 
						{ $and: [{ obligor_id: mainId}, {beneficiary_id: id} ]}, 
					]
				}
			}
		}	
	}
	if(data.trans_reff_number!==undefined)
		where.trans_reff_number= {
			$like: '%'+data.trans_reff_number+'%'
		}
	if(data.start_date!==undefined && data.end_date!==undefined)
	where.trans_date = {
    	$between: [data.start_date, data.end_date]
   	}
   	if(data.remark_1!==undefined)
		where.remark_1= {
			$like: '%'+data.remark_1+'%'
		}
	if(data.remark_2!==undefined)
		where.remark_2= {
			$like: '%'+data.remark_2+'%'
		}
   	data.order = (data.order==undefined)? 'DESC' : data.order
	return model.transactions.findAll({
		where,
		include: [{
			model: model.currency,
			required: true,
			as: 'currency',
			attributes: ['currency','desc']
		},{
			model: model.user,
			required: true,
			as: 'obligor'
		},{
			model: model.user,
			required: true,
			as: 'beneficiary'
		},{
			model: model.transaction_dealing,
			required: true,
			as: 'dealing',
			attributes: ['deal_reff'],
			include: [{
				model: model.user,
				required: true,
				as: 'user'
			}]
		},{
			model: model.transaction_status_log,
			required: true,
			as: 'history',
			attributes: { 
				exclude: ['transaction_id','user_id'] 
			},
			include: [{
				model: model.user,
				required: true,
				as: 'user_log',
				attributes: { 
					exclude: ['created_at','status'] 
				}
			}]
		}],
		attributes: { 
			exclude: ['currency_id','beneficiary_id','obligor_id','updated_at'] 
		},
		group: 'trans_reff_number',
		limit: parseInt(data.limit), 
		offset: parseInt(data.offset),
		subQuery: false
	}).then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
};

const getListTransaction = (data, id=null) => { 
	let mainId=data.user_id
	let where = {}
	if(id!==null){
		id = Array.isArray(id) ? ((id.length!==0) ? {$in : id} : null) : id 
		mainId = Array.isArray(mainId) ? ((mainId.length!==0) ? {$in : mainId} : null) : mainId 
		if(data.deal_reff=='Debit'){
			// where = { beneficiary_id: id,  status : {$ne: 'Pending'} }
			where = { beneficiary_id: id,  status : 'Completed' }
		}
		else if(data.deal_reff=='Credit') where.obligor_id= id
		else {
			if(mainId==null && id!==null){
				where = { $or: [ { obligor_id: id }, { $and: [{ beneficiary_id: id}, { status : {$notIn:['Pending','Cancel'] }} ]} ] }
			}
			else if(id!==null){
				where = {
					$or: [
						{ $and: [{ obligor_id: id}, {beneficiary_id: mainId} ]}, 
						{ $and: [{ obligor_id: mainId}, {beneficiary_id: id} ]}, 
					]
				}
			}
		}	
	}
	if(data.trans_reff_number!==undefined)
		where.trans_reff_number= {
			$like: '%'+data.trans_reff_number+'%'
		}
	if(data.start_date!==undefined && data.end_date!==undefined)
	where.trans_date = {
    	$between: [data.start_date, data.end_date]
   	}
   	data.order = (data.order==undefined)? 'DESC' : data.order
	return model.transactions.findAll({
		where,
		include: [{
			model: model.currency,
			required: true,
			as: 'currency',
			attributes: ['currency','desc']
		},{
			model: model.user,
			required: true,
			as: 'obligor'
		},{
			model: model.user,
			required: true,
			as: 'beneficiary'
		},{
			model: model.transaction_dealing,
			required: true,
			as: 'dealing',
			attributes: ['deal_reff']
		}],
		limit: parseInt(data.limit), 
		offset: parseInt(data.offset),
		order: [
			['trans_date', data.order]
		]
	}).then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
};

const getCountTransaction = (data, id=null) => {
	let mainId=data.user_id
	let where = {}
	if(id!==null){
		id = Array.isArray(id) ? ((id.length!==0) ? {$in : id} : null) : id 
		mainId = Array.isArray(mainId) ? ((mainId.length!==0) ? {$in : mainId} : null) : mainId 
		if(data.deal_reff=='Debit'){
			where = { beneficiary_id: id,  status : {$ne: 'Pending'} }
		}
		else if(data.deal_reff=='Credit') where.obligor_id= id
		else {
			if(mainId==null && id!==null){
				where = { $or: [ { obligor_id: id }, { $and: [{ beneficiary_id: id}, { status : {$notIn:['Pending','Cancel'] }} ]} ] }
			}
			else if(id!==null){
				where = {
					$or: [
						{ $and: [{ obligor_id: id}, {beneficiary_id: mainId} ]}, 
						{ $and: [{ obligor_id: mainId}, {beneficiary_id: id} ]}, 
					]
				}
			}
		}	
	}
	if(data.trans_reff_number!==undefined)
		where.trans_reff_number= {
			$like: '%'+data.trans_reff_number+'%'
		}
	if(data.start_date!==undefined && data.end_date!==undefined)
	where.trans_date = {
    	$between: [data.start_date, data.end_date]
   	}
   	if(data.remark_1!==undefined)
		where.remark_1= {
			$like: '%'+data.remark_1+'%'
		}	
	if(data.remark_2!==undefined)
		where.remark_2= {
			$like: '%'+data.remark_2+'%'
		}
	return model.transactions.findAll({
		where,
		attributes: [[model.sequelize.fn('COUNT', model.sequelize.col('id')), 'rows']]
	}).then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
}


const getListTransactionSpecial = (data, id=null) => { 
	let mainId=data.user_id
	let where = {}
	if(id!==null){
		id = Array.isArray(id) ? ((id.length!==0) ? {$in : id} : null) : id 
		mainId = Array.isArray(mainId) ? ((mainId.length!==0) ? {$in : mainId} : null) : mainId 
		if(data.deal_reff=='Debit'){
			where = { beneficiary_id: id }
		}
		else if(data.deal_reff=='Credit') where.obligor_id= id
		else {
			if(mainId==null && id!==null){
				where = { $or: [ { obligor_id: id }, { $and: [{ beneficiary_id: id}]} ] }
			}
			else if(id!==null){
				where = {
					$or: [
						{ $and: [{ obligor_id: id}, {beneficiary_id: mainId} ]}, 
						{ $and: [{ obligor_id: mainId}, {beneficiary_id: id} ]}, 
					]
				}
			}
		}	
	}
	if(data.trans_reff_number!==undefined)
		where.trans_reff_number= {
			$like: '%'+data.trans_reff_number+'%'
		}
	if(data.start_date!==undefined && data.end_date!==undefined)
	where.trans_date = {
    	$between: [data.start_date, data.end_date]
   	}
   	data.order = (data.order==undefined)? 'DESC' : data.order
	return model.transactions.findAll({
		where,
		include: [{
			model: model.currency,
			required: true,
			as: 'currency',
			attributes: ['currency','desc']
		},{
			model: model.user,
			required: true,
			as: 'obligor'
		},{
			model: model.user,
			required: true,
			as: 'beneficiary'
		},{
			model: model.transaction_dealing,
			required: true,
			as: 'dealing',
			attributes: ['deal_reff']
		}],
		limit: parseInt(data.limit), 
		offset: parseInt(data.offset),
		order: [
			['trans_date', data.order]
		]
	}).then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
};

const getCountTransactionSpecial = (data, id=null) => {
	let mainId=data.user_id
	let where = {}
	if(id!==null){
		id = Array.isArray(id) ? ((id.length!==0) ? {$in : id} : null) : id 
		mainId = Array.isArray(mainId) ? ((mainId.length!==0) ? {$in : mainId} : null) : mainId 
		if(data.deal_reff=='Debit'){
			where = { beneficiary_id: id }
		}
		else if(data.deal_reff=='Credit') where.obligor_id= id
		else {
			if(mainId==null && id!==null){
				where = { $or: [ { obligor_id: id }, { $and: [{ beneficiary_id: id}]} ] }
			}
			else if(id!==null){
				where = {
					$or: [
						{ $and: [{ obligor_id: id}, {beneficiary_id: mainId} ]}, 
						{ $and: [{ obligor_id: mainId}, {beneficiary_id: id} ]}, 
					]
				}
			}
		}	
	}
	if(data.trans_reff_number!==undefined)
		where.trans_reff_number= {
			$like: '%'+data.trans_reff_number+'%'
		}
	if(data.start_date!==undefined && data.end_date!==undefined)
	where.trans_date = {
    	$between: [data.start_date, data.end_date]
   	}

	return model.transactions.findAll({
		where,
		attributes: [[model.sequelize.fn('COUNT', model.sequelize.col('id')), 'rows']]
	}).then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const getTransactionDetailByReffId = (trans_reff_number) => {
	return model.transactions.findAll({
		where: { trans_reff_number },
		include: [{
			model: model.currency,
			required: true,
			as: 'currency',
			attributes: ['currency','desc']
		},{
			model: model.user,
			required: true,
			as: 'obligor'
		},{
			model: model.user,
			required: true,
			as: 'beneficiary'
		},{
			model: model.transaction_dealing,
			required: true,
			as: 'dealing',
			attributes: ['deal_reff'],
			include: [{
				model: model.user,
				required: true,
				as: 'user'
			}]
		},{
			model: model.transaction_status_log,
			required: true,
			as: 'history',
			attributes: { 
				exclude: ['transaction_id','user_id'] 
			},
			include: [{
				model: model.user,
				required: true,
				as: 'user_log',
				attributes: { 
					exclude: ['created_at','status'] 
				}
			}]
		}],
		attributes: { 
			exclude: ['currency_id','beneficiary_id','obligor_id','updated_at'] 
		}
	}).then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const getTransactionDetailById = (id) => {
	const where = {id}
	return model.transactions.findAll({
		where : { id },
		include: [{
			model: model.currency,
			required: true,
			as: 'currency',
			attributes: ['currency','desc']
		},{
			model: model.user,
			required: true,
			as: 'obligor'
		},{
			model: model.user,
			required: true,
			as: 'beneficiary'
		},{
			model: model.transaction_dealing,
			required: true,
			as: 'dealing',
			attributes: ['deal_reff'],
			include: [{
				model: model.user,
				required: true,
				as: 'user'
			}]
		},{
			model: model.transaction_status_log,
			required: true,
			as: 'history',
			attributes: { 
				exclude: ['transaction_id','user_id'] 
			},
			include: [{
				model: model.user,
				required: true,
				as: 'user_log',
				attributes: { 
					exclude: ['created_at','status'] 
				}
			}]
		}],
		attributes: { 
			exclude: ['currency_id','beneficiary_id','obligor_id','updated_at'] 
		}
	}).then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const getBallanceByUserId = id => {
	const queryString = 'select '+
	'(select sum(amount) from transactions where obligor_id='+id+' AND status IN ("Completed","Pending")) AS credit, '+
	'(select count(amount) from transactions where obligor_id='+id+' AND status IN ("Completed","Pending")) AS credit_count, '+
	'(select sum(amount) from transactions where beneficiary_id='+id+' AND status="Completed") AS debit, '+
	'(select count(amount) from transactions where beneficiary_id='+id+' AND status="Completed") AS debit_count'
	const queryAccountingTrans = 'select count(amount) AS count, sum(amount) AS amount from transactions where (obligor_id = '+id+' OR beneficiary_id = '+id+') AND status IN ("Pending")'
	
	const balance0 = model.sequelize.query(queryString, { type: Sequelize.QueryTypes.SELECT})
	const balance1 = model.sequelize.query(queryAccountingTrans, { type: Sequelize.QueryTypes.SELECT})

	return Promise.all([balance0, balance1])
	.then(data=>({
			credit: {
				amount : math.round((data[0][0].credit==null)?0:data[0][0].credit, 2),
				count: (data[0][0].credit_count==null)?0:data[0][0].credit_count
			},
			debit: {
				amount : math.round((data[0][0].debit==null)?0:data[0][0].debit, 2),
				count: (data[0][0].debit_count==null)?0:data[0][0].debit_count
			},
			pending: {
				amount : math.round((data[1][0].amount==null)?0:data[1][0].amount, 2),
				count: (data[1][0].count==null)?0:data[1][0].count
			},
			balance: math.chain((data[0][0].debit==null)?0:data[0][0].debit).subtract((data[0][0].credit==null)?0:data[0][0].credit).done()
	})).catch(ex=>{
		logger.error(ex)
		return false;
	})
}

const getBallanceSystem = () => {
	const querySystemBalance = 'select (select IFNULL(sum(amount), 0) from transactions where beneficiary_id=1 AND status="Completed") - (select IFNULL(sum(amount), 0) from transactions where obligor_id=1 AND status IN ("Completed","Pending")) AS amount'
	const queryUserBalance = 'select (select IFNULL(sum(amount), 0) from transactions where beneficiary_id NOT IN (0,1,2) AND status="Completed") - (select IFNULL(sum(amount), 0) from transactions where obligor_id NOT IN (0,1,2) AND status IN ("Completed","Pending")) AS amount'
	const queryPendingTrans = 'select IFNULL(count(amount), 0) AS count, IFNULL(sum(amount), 0) AS amount from transactions where status IN ("Pending")'
	const queryAccountingTrans = 'select IFNULL(count(amount), 0) AS count, IFNULL(sum(amount), 0) AS amount from transactions where beneficiary_id =2 AND status IN ("Completed")'
	const balance0 = model.sequelize.query(querySystemBalance, { type: Sequelize.QueryTypes.SELECT})
	const balance1 = model.sequelize.query(queryUserBalance, { type: Sequelize.QueryTypes.SELECT})
	const balance2 = model.sequelize.query(queryPendingTrans, { type: Sequelize.QueryTypes.SELECT})
	const balance3 = model.sequelize.query(queryAccountingTrans, { type: Sequelize.QueryTypes.SELECT})
	return Promise.all([balance0, balance1, balance2, balance3])
	.then(values => ({
  		SystemBalance: values[0][0],
  		UserBalance: values[1][0],
  		PendingTrans: values[2][0],
  		AccountingTrans: values[3][0]
  	})).catch(err=>{
		logger.error(err)
		return {}
	})

}
const getListTransactionFraud = data =>{
	let WHERE =''
	if(data.client_id!==undefined){
		WHERE = 'AND user.client_id IN('+data.client_id+') '
	}
	data.order = (data.order==undefined)? 'DESC' : data.order
	data.order_by = (data.order_by == 'date' || data.order_by==undefined) ? 'transactions.created_at': data.order_by
	const queryString = 'select user.id,user.client_id, '+
	'sum(CASE WHEN transactions.`type` = "Deposit" THEN transactions.amount ELSE 0 END ) as debit, '+
	'sum(CASE WHEN transactions.`type` = "Order" THEN transactions.amount ELSE 0 END ) as credit, '+
	'sum(CASE WHEN transactions.`type` = "Deposit" THEN transactions.amount ELSE 0 END )- sum(CASE WHEN transactions.`type` = "Order" THEN transactions.amount ELSE 0 END ) as saldo '+
	'FROM user_suspened left JOIN user on user.client_id = user_suspened.client_id LEFT JOIN transactions on (user.id = transactions.obligor_id OR user.id = transactions.beneficiary_id) '+
	'WHERE transactions.`type` in("Deposit", "Order") AND transactions.created_at > "'+data.start_date+'"'+WHERE+' GROUP BY user.id, user.client_id ORDER BY '+data.order_by+' '+data.order+
	' limit '+data.limit+' offset '+data.offset
	return model.sequelize.query(queryString, { type: Sequelize.QueryTypes.SELECT})
	.then(data=> JSON.parse(JSON.stringify(data)))	
	.catch(err=>{
		logger.error(err)
		return {}
	})
}

const getCountTransactionUserSuspend = data =>{
	let WHERE =''
	if(data.client_id!==undefined){
		WHERE = 'AND user.client_id IN('+data.client_id+') '
	}
	data.order = (data.order==undefined)? 'DESC' : data.order
	data.order_by = (data.order_by = 'date' || data.order_by==undefined) ? 'transactions.created_at': data.order_by
	const queryString1 = 'select count(*) as row from (select user.id,user.client_id, '+
	'sum(CASE WHEN transactions.`type` = "Deposit" THEN transactions.amount ELSE 0 END ) as debit, '+
	'sum(CASE WHEN transactions.`type` = "Order" THEN transactions.amount ELSE 0 END ) as credit, '+
	'sum(CASE WHEN transactions.`type` = "Deposit" THEN transactions.amount ELSE 0 END )- sum(CASE WHEN transactions.`type` = "Order" THEN transactions.amount ELSE 0 END ) as saldo '+
	'FROM user_suspened left JOIN user on user.client_id = user_suspened.client_id LEFT JOIN transactions on (user.id = transactions.obligor_id OR user.id = transactions.beneficiary_id) '+
	'WHERE transactions.`type` in("Deposit", "Order") AND transactions.created_at > "'+data.start_date+'"'+WHERE+' GROUP BY user.id, user.client_id ORDER BY transactions.created_at '+data.order+
	' ) as tb'
	const queryString2 = 'select count(*) as total '+
	'FROM user_suspened WHERE deleted_at is null '

	const balance0 = model.sequelize.query(queryString1, { type: Sequelize.QueryTypes.SELECT})
	const balance1 = model.sequelize.query(queryString2, { type: Sequelize.QueryTypes.SELECT})
	return Promise.all([balance0, balance1])
	.then(values => ({
  		row:values[0][0],
  		total_user: values[1][0]
  	})).catch(err=>{
		logger.error(err)
		return {}
	})
}

const getSummaryFraud =() =>{
	const queryString = 'SELECT sum(debit) as debit, sum(credit) as credit, sum(saldo) as saldo from ( '+ 
	'SELECT user.id, user.client_id, sum( CASE WHEN type = "Deposit" and transactions.`status` = "completed" THEN amount ELSE 0 END ) AS debit, '+
	'sum( CASE WHEN type = "Order" and transactions.`status` = "completed" THEN amount ELSE 0 END ) AS credit, '+
	'(sum( CASE WHEN type = "Deposit" and transactions.`status` = "completed" THEN amount ELSE 0 END )-sum( CASE WHEN type = "Order" and transactions.`status` = "completed" THEN amount ELSE 0 END ) ) as saldo '+
	'FROM (SELECT beneficiary_id as id FROM transactions WHERE type = "Deposit" AND remark_1 IN (select remark_1 from transactions where type = "Deposit" AND transactions.created_at > "2018-12-03 00:00:00" GROUP BY remark_1 having count(*) > 1) '+
	'GROUP BY beneficiary_id ) as user_suspened '+
	'LEFT JOIN `user` ON `user` .id = user_suspened.id LEFT JOIN transactions ON ( transactions.obligor_id = `user`.id OR transactions.beneficiary_id = `user`.id) where transactions.created_at > "2018-12-03 00:00:00" '+
	'and transactions.type IN ("Deposit", "Order") GROUP BY `user`.id, `user`.client_id) as a'
	return model.sequelize.query(queryString, { type: Sequelize.QueryTypes.SELECT})
	.then(data=> JSON.parse(JSON.stringify(data)))
	.catch(err=>{
		logger.error(err)
		return {}
	})
}

const getOrderTransactionFraud = data =>{
	let WHERE =''
	if(data.client_id!==undefined){
		WHERE = 'AND user.client_id='+data.client_id
	}
	data.order = (data.order==undefined)? 'DESC' : data.order
	const queryString = 'SELECT remark_1,remark_2,amount FROM transactions left join user on user.id = transactions.beneficiary_id WHERE remark_1 IN (SELECT remark_1 FROM transactions WHERE transactions.type = "Deposit" GROUP BY transactions.remark_1 HAVING (count(*) > 1) ORDER BY transactions.created_at) AND transactions.type="Deposit" AND transactions.created_at > "'+data.start_date+'"'+WHERE+' ORDER BY transactions.created_at '+data.order+
	' limit '+data.limit+' offset '+data.offset
	return model.sequelize.query(queryString, { type: Sequelize.QueryTypes.SELECT})
	.then(data=> JSON.parse(JSON.stringify(data)))
	.catch(err=>{
		logger.error(err)
		return {}
	})
}

const getCountOrderTransactionFraud = data =>{
	let WHERE =''
	if(data.client_id!==undefined){
		WHERE = 'AND user.client_id='+data.client_id
	}
	const queryString = 'SELECT COUNT(*) AS total from transactions left join user on user.id = transactions.beneficiary_id where remark_1 IN	(SELECT remark_1 FROM transactions WHERE transactions.type = "Deposit" GROUP BY transactions.remark_1 HAVING (count(*) > 1) ORDER BY transactions.created_at) AND transactions.created_at > "'+data.start_date+'"'+WHERE+' ORDER BY transactions.created_at'
	return model.sequelize.query(queryString, { type: Sequelize.QueryTypes.SELECT})
	.then(data=> JSON.parse(JSON.stringify(data)))
	.catch(err=>{
		logger.error(err)
		return {}
	})
}


const getTransactionDetailByReffIdCanceled = (trans_reff_number) => {
	return model.transactions.findAll({
		where: { 
			trans_reff_number:trans_reff_number,
			status:"Cancel"
		},
		include: [{
			model: model.currency,
			required: true,
			as: 'currency',
			attributes: ['currency','desc']
		},{
			model: model.user,
			required: true,
			as: 'obligor'
		},{
			model: model.user,
			required: true,
			as: 'beneficiary'
		},{
			model: model.transaction_dealing,
			required: true,
			as: 'dealing',
			attributes: ['deal_reff'],
			include: [{
				model: model.user,
				required: true,
				as: 'user'
			}]
		},{
			model: model.transaction_status_log,
			required: true,
			as: 'history',
			attributes: { 
				exclude: ['transaction_id','user_id'] 
			},
			include: [{
				model: model.user,
				required: true,
				as: 'user_log',
				attributes: { 
					exclude: ['created_at','status'] 
				}
			}]
		}],
		attributes: { 
			exclude: ['currency_id','beneficiary_id','obligor_id','updated_at'] 
		}
	}).then(data=> JSON.parse(JSON.stringify(data)))
	.catch(ex=>{
		logger.error(ex)
		return false;
	})
}

module.exports = {
	listAvailableTransactionType,
	saveTransaction,
	updateStatusTransaction,
	getListTransaction,
	getListTransactionDetail,
	getCountTransaction,
	getBallanceByUserId,
	getBallanceSystem,
	getTransactionDetailByReffId,
	getTransactionDetailById,
	getListTransactionSpecial,
	getCountTransactionSpecial,
	getListTransactionFraud,
	getCountTransactionUserSuspend,
	getSummaryFraud,
	getOrderTransactionFraud,
	getCountOrderTransactionFraud,
	getTransactionDetailByReffIdCanceled
}