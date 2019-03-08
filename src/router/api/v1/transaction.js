'use strict'
const { transaction,user } = require('../../../controller')
const { formatPageLimit } = require('../../../helper/util')


const base_path = '/api/v1/transaction'
module.exports = (app) => {

  /**
   * @swagger
   * /transaction:
   *   get:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: get list transaction based on user token
   *     parameters:
   *       - name: start_date
   *         x-example: '2001-01-01 00:00:00'
   *         type: string
   *         pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
   *         description: it must be filled with other date parameter if not will be set default today date
   *         in: query
   *         required: true
   *       - name: end_date
   *         x-example: '2025-01-01 00:00:00'
   *         type: string
   *         pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
   *         description: it must be filled with other date parameter if not will be set default today date
   *         in: query
   *         required: true
   *       - name: trans_reff_number
   *         x-example: '123456-123456-123456'
   *         type: string
   *         description: transaction refference number. provided after transaction
   *         in: query
   *         required: false
   *       - name: deal_reff
   *         type: string
   *         description: (optional) deal refference. can be filled with Credit or Debit
   *         in: query
   *         required: false
   *       - name: page
   *         x-example: 1
   *         type: integer
   *         description: limit order list
   *         in: query
   *         required: true
   *       - name: count
   *         x-example: 10
   *         type: integer
   *         description: offset order list
   *         in: query
   *         required: true
   *       - name: order
   *         x-example: DESC
   *         type: string
   *         description: ordering list by transaction date (ASC/DESC)
   *         in: query
   *         required: false
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: List of transaction
   */
  app.get(base_path, function(req, res, next) {
    req.checkQuery({
        'start_date': {
          notEmpty: {
            errorMessage: 'start_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
        'end_date': {
          notEmpty: {
            errorMessage: 'end_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
        'page': {
          notEmpty: {
            errorMessage: 'page cant be empty'
          },
          isInt: {
            errorMessage: 'page must be integer value'
          }
        },
        'count': {
          notEmpty: {
            errorMessage: 'count cant be empty'
          },
          isInt: {
            errorMessage: 'count must be integer value'
          }
        }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else {
      // req.query.client_id = (req.query.client_id!==undefined) ? req.query.client_id.split(',').map(Number).filter(i=> Number.isInteger(parseInt(i, 10))) : []
      transaction.historyTransaction(formatPageLimit(req.query), req.user.id, req.user.token, req.user.client_id)
      .then(result => result.status ? res.status(result.status).send(result) : res.send(result)).catch(err => next(err))
    }
  })

  /**
   * @swagger
   * /transaction/client/{client_id}:
   *   get:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: get list transaction based on user token
   *     parameters:
   *       - name: client_id
   *         description: client_id
   *         in: path
   *         type: integer
   *         required: true
   *         x-example: 17928
   *       - name: client_id
   *         description: if you need batch filter, client id can be separated by coma
   *         in: query
   *         type: string
   *         required: false
   *         x-example: 8
   *       - name: start_date
   *         x-example: '2001-01-01 00:00:00'
   *         type: string
   *         pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
   *         description: it must be filled with other date parameter if not will be set default today date
   *         in: query
   *         required: true
   *       - name: end_date
   *         x-example: '2025-01-01 00:00:00'
   *         type: string
   *         pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
   *         description: it must be filled with other date parameter if not will be set default today date
   *         in: query
   *         required: true
   *       - name: deal_reff
   *         type: string
   *         description: (optional) deal refference. can be filled with Credit or Debit
   *         in: query
   *         required: false
   *       - name: page
   *         x-example: 1
   *         type: integer
   *         description: limit order list
   *         in: query
   *         required: true
   *       - name: count
   *         x-example: 10
   *         type: integer
   *         description: offset order list
   *         in: query
   *         required: true
   *       - name: order
   *         x-example: DESC
   *         type: string
   *         description: ordering list by transaction date (ASC/DESC)
   *         in: query
   *         required: false
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: List of transaction
   */
  app.get(base_path+'/client/:client_id', function(req, res, next) {
    req.checkQuery({
        'start_date': {
          notEmpty: {
            errorMessage: 'start_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
        'end_date': {
          notEmpty: {
            errorMessage: 'end_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
        'page': {
          notEmpty: {
            errorMessage: 'page cant be empty'
          },
          isInt: {
            errorMessage: 'page must be integer value'
          }
        },
        'count': {
          notEmpty: {
            errorMessage: 'count cant be empty'
          },
          isInt: {
            errorMessage: 'count must be integer value'
          }
        }
    })
    req.checkParams({
      'client_id': {
        notEmpty: {
          errorMessage: 'missing path parameter (client_id).'
        },
        isInt: {
          errorMessage: 'client_id must be integer value'
        }
      }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else {
      req.query.client_id = (req.query.client_id!==undefined) ? req.query.client_id.split(',').map(Number).filter(i=> Number.isInteger(parseInt(i, 10))) : []
      user.getIDUserActiveByClientIdList(req.params.client_id)
      .then(user=>{
        if(!user) res.status(200).send({count: {rows: 0,page: 1}, data:[], message:'User Not Found'})
        else if(user.length==0) res.status(200).send({count: {rows: 0,page: 1}, data:[], message:'User Not Found'})
        else{
          transaction.historyTransaction(formatPageLimit(req.query), user, req.user.token)
          .then(result => res.send(result))
        }
      }).catch(err => next(err))
    }
  })

  /**
   * @swagger
   * /transaction/user/{user_id_wallet}:
   *   get:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: get list transaction based on user token
   *     parameters:
   *       - name: user_id_wallet
   *         description: user_id_wallet
   *         in: path
   *         type: integer
   *         required: true
   *         x-example: 8
   *       - name: client_id
   *         description: if you need batch filter, client id can be separated by coma
   *         in: query
   *         type: string
   *         required: false
   *         x-example: 8
   *       - name: trans_reff_number
   *         x-example: '123456-123456-123456'
   *         type: string
   *         description: transaction refference number. provided after transaction
   *         in: query
   *         required: false
   *       - name: start_date
   *         x-example: '2001-01-01 00:00:00'
   *         type: string
   *         pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
   *         description: it must be filled with other date parameter if not will be set default today date
   *         in: query
   *         required: true
   *       - name: end_date
   *         x-example: '2025-01-01 00:00:00'
   *         type: string
   *         pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
   *         description: it must be filled with other date parameter if not will be set default today date
   *         in: query
   *         required: true
   *       - name: deal_reff
   *         type: string
   *         description: (optional) deal refference. can be filled with Credit or Debit
   *         in: query
   *         required: false
   *       - name: page
   *         x-example: 1
   *         type: integer
   *         description: limit order list
   *         in: query
   *         required: true
   *       - name: count
   *         x-example: 10
   *         type: integer
   *         description: offset order list
   *         in: query
   *         required: true
   *       - name: order
   *         x-example: DESC
   *         type: string
   *         description: ordering list by transaction date (ASC/DESC)
   *         in: query
   *         required: false
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: List of transaction
   */
  app.get(base_path+'/user/:user_id_wallet', function(req, res, next) {
    req.checkQuery({
        'start_date': {
          notEmpty: {
            errorMessage: 'start_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
        'end_date': {
          notEmpty: {
            errorMessage: 'end_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
        'page': {
          notEmpty: {
            errorMessage: 'page cant be empty'
          },
          isInt: {
            errorMessage: 'page must be integer value'
          }
        },
        'count': {
          notEmpty: {
            errorMessage: 'count cant be empty'
          },
          isInt: {
            errorMessage: 'count must be integer value'
          }
        }
    })
    req.checkParams({
      'user_id_wallet': {
        notEmpty: {
          errorMessage: 'missing path parameter (user_id_wallet).'
        },
        isInt: {
          errorMessage: 'user_id_wallet must be integer value'
        }
      }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else{
      req.query.client_id = (req.query.client_id!==undefined) ? req.query.client_id.split(',').map(Number).filter(i=> Number.isInteger(parseInt(i, 10))) : []
      transaction.historyTransactionSpecialUser(formatPageLimit(req.query), req.params.user_id_wallet, req.user.token)
      .then(result => res.send(result)).catch(err => next(err))
    }
  })

  /**
   * @swagger
   * /transaction/list:
   *   get:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: get detail list transaction 
   *     parameters:
   *       - name: client_id
   *         description: client id list, separated by coma
   *         in: query
   *         type: string
   *         required: false
   *         x-example: "2904,2"
   *       - name: trans_reff_number
   *         x-example: '123456-123456-123456'
   *         type: string
   *         description: transaction refference number. provided after transaction
   *         in: query
   *         required: false
   *       - name: start_date
   *         x-example: '2001-01-01 00:00:00'
   *         type: string
   *         pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
   *         description: it must be filled with other date parameter if not will be set default today date
   *         in: query
   *         required: true
   *       - name: end_date
   *         x-example: '2025-01-01 00:00:00'
   *         type: string
   *         pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
   *         description: it must be filled with other date parameter if not will be set default today date
   *         in: query
   *         required: true
   *       - name: deal_reff
   *         type: string
   *         description: (optional) deal refference. can be filled with Credit or Debit
   *         in: query
   *         required: false
   *       - name: remark_1
   *         type: string
   *         description: (optional) can be filled with remark 1 
   *         in: query
   *         required: false
   *         x-example: '0004/ORD/28/11/2018'
   *       - name: remark_2
   *         type: string
   *         description: (optional) can be filled with remark 2
   *         in: query
   *         required: false
   *       - name: page
   *         x-example: 1
   *         type: integer
   *         description: limit order list
   *         in: query
   *         required: true
   *       - name: count
   *         x-example: 10
   *         type: integer
   *         description: offset order list
   *         in: query
   *         required: true
   *       - name: order
   *         x-example: DESC
   *         type: string
   *         description: ordering list by transaction date (ASC/DESC)
   *         in: query
   *         required: false
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: List of transaction
   */
  app.get(base_path+'/list', function(req, res, next) {
    req.checkQuery({
      'start_date': {
        notEmpty: {
          errorMessage: 'start_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
        }
      },
      'end_date': {
        notEmpty: {
          errorMessage: 'end_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
        }
      },
      'page': {
        notEmpty: {
          errorMessage: 'page cant be empty'
        },
        isInt: {
          errorMessage: 'page must be integer value'
        }
      },
      'count': {
        notEmpty: {
          errorMessage: 'count cant be empty'
        },
        isInt: {
          errorMessage: 'count must be integer value'
        }
      }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else{
      const validClientIdList = (req.query.client_id!==undefined) ? req.query.client_id.split(',').map(Number).filter(i=> Number.isInteger(parseInt(i, 10))) : []
      transaction.historyTransactionDetail(formatPageLimit(req.query), validClientIdList, req.user.token)
      .then(result => res.send(result)).catch(err => next(err))
    }
  })



  /**
   * @swagger
   * /transaction/reff/{trans_reff_number}:
   *   get:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: get transaction detail
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: trans_reff_number
   *         description: transaction refference number. provided after transaction
   *         in: path
   *         type: string
   *         required: true
   *         x-example: "123456-123456-123456"
   *     responses:
   *       200:
   *         description: Successfully fetch
   *       204:
   *         description: Data Not Found
   */
  app.get(base_path+'/reff/:trans_reff_number', (req, res, next) => {
    req.checkParams({
      'trans_reff_number': {
        notEmpty: {
          errorMessage: 'trans_reff_number cant be empty, and please follow format based on example'
        }
      }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.detailTransactionByTransId(req.params.trans_reff_number, req.user)
    .then(result => (!result) ? res.status(204).send(result): res.send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /transaction/id/{trans_id}:
   *   get:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: get transaction detail
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: trans_id
   *         description: transaction refference number. provided after transaction
   *         in: path
   *         type: number
   *         required: true
   *         x-example: 1
   *     responses:
   *       200:
   *         description: Successfully fetch
   *       204:
   *         description: Data Not Found
   */
  app.get(base_path+'/id/:trans_id', (req, res, next) => {
      req.checkParams({
        'trans_id': {
          notEmpty: {
            errorMessage: 'trans_id cant be empty, and please follow format based on example'
          },
          isInt: {
            errorMessage: 'trans_id must be integer value'
          }
        }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.detailTransactionById(req.params.trans_id, req.user)
    .then(result => (!result) ? res.status(204).send(result): res.send(result)).catch(err => next(err))
  })

 /**
   * @swagger
   * /transaction/system/credit:
   *   post:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: create transaction by system, wich is deduction on main account
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: body
   *         description: create transaction
   *         in: body
   *         schema: {
   *          "type": "object",
   *          "required": true,
   *          "properties": {
   *              "trans_date": {
   *                  "type": "string",
   *                  "example": "2018-05-01 12:50:51"
   *              },
   *              "type": {
   *                  "type": "string",
   *                  "example": "Cashback"
   *              },
   *              "amount": {
   *                  "type": "decimal",
   *                  "example": 1000000.00
   *              },
   *              "curency": {
   *                  "type": "string",
   *                  "example": "IDR"
   *              },
   *              "remark_1": {
   *                  "type": "string",
   *                  "example": "sample remark 1"
   *              },
   *              "remark_2": {
   *                  "type": "string",
   *                  "example": "sample remark 2"
   *              } 
   *           }
   *        }
   *     responses:
   *       201:
   *         description: Successfully create transaction
   */
  app.post(base_path+'/system/credit', (req, res, next) => {
      req.checkBody({
        'trans_date': {
          notEmpty: {
            errorMessage: 'trans_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
        'type': {
          notEmpty: {
            errorMessage: 'type cant be empty. please refer this value (TopUp, Cashback, Order)'
          }
        },
        'amount': {
          notEmpty: {
            errorMessage: 'amount cant be empty, and please follow format based on example'
          }
        },
        'curency': {
          notEmpty: {
            errorMessage: 'curency cant be empty'
          }
        },
        'remark_1': {
          notEmpty: {
            errorMessage: 'remark_1 cant be empty. if empty needed, please fill with single white space'
          }
        },
        'remark_2': {
          notEmpty: {
            errorMessage: 'remark_2 cant be empty. if empty needed, please fill with single white space'
          }
        }
    })

    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.createTransaction(req.body, req.user)
    .then(result => (!result) ? res.status(500).send({message: 'Failed to Create Transaction'}): res.status(result.status).send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /transaction:
   *   post:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: create transaction by system, wich is deduction on main account
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: body
   *         description: create transaction
   *         in: body
   *         schema: {
   *          "type": "object",
   *          "required": true,
   *          "properties": {
   *              "trans_date": {
   *                  "type": "string",
   *                  "example": "2018-05-01 12:50:51"
   *              },
   *              "type": {
   *                  "type": "string",
   *                  "example": "Cashback"
   *              },
   *              "amount": {
   *                  "type": "decimal",
   *                  "example": 1000000.00
   *              },
   *              "curency": {
   *                  "type": "string",
   *                  "example": "IDR"
   *              },
   *              "remark_1": {
   *                  "type": "string",
   *                  "example": "sample remark 1"
   *              },
   *              "remark_2": {
   *                  "type": "string",
   *                  "example": "sample remark 2"
   *              } 
   *           }
   *        }
   *     responses:
   *       201:
   *         description: Successfully create transaction
   */
  app.post(base_path, (req, res, next) => {
      req.checkBody({
        'trans_date': {
          notEmpty: {
            errorMessage: 'trans_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
        'type': {
          notEmpty: {
            errorMessage: 'type cant be empty. please refer this value (TopUp, Cashback, Order)'
          }
        },
        'amount': {
          notEmpty: {
            errorMessage: 'amount cant be empty, and please follow format based on example'
          }
        },
        'curency': {
          notEmpty: {
            errorMessage: 'curency cant be empty'
          }
        },
        'remark_1': {
          notEmpty: {
            errorMessage: 'remark_1 cant be empty. if empty needed, please fill with single white space'
          }
        },
        'remark_2': {
          notEmpty: {
            errorMessage: 'remark_2 cant be empty. if empty needed, please fill with single white space'
          }
        }
    })

    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.createTransaction(req.body, req.user)
    .then(result => (!result) ? res.status(500).send({message: 'Failed to Create Transaction'}): res.status(result.status).send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /transaction/system:
   *   post:
   *     tags:
   *       - Transaction
   *     security:
   *      - basicAuth: []
   *     description: create transaction by system, wich is deduction on main account
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: body
   *         description: create transaction
   *         in: body
   *         schema: {
   *          "type": "object",
   *          "required": true,
   *          "properties": {
   *              "trans_date": {
   *                  "type": "string",
   *                  "example": "2018-05-01 12:50:51"
   *              },
   *              "type": {
   *                  "type": "string",
   *                  "example": "Cashback"
   *              },
   *              "amount": {
   *                  "type": "decimal",
   *                  "example": 1000000.00
   *              },
   *              "curency": {
   *                  "type": "string",
   *                  "example": "IDR"
   *              },
   *              "remark_1": {
   *                  "type": "string",
   *                  "example": "sample remark 1"
   *              },
   *              "remark_2": {
   *                  "type": "string",
   *                  "example": "sample remark 2"
   *              } 
   *           }
   *        }
   *     responses:
   *       201:
   *         description: Successfully create transaction
   */
  app.post(base_path+'/system', (req, res, next) => {
      req.checkBody({
        'trans_date': {
          notEmpty: {
            errorMessage: 'trans_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
        'type': {
          notEmpty: {
            errorMessage: 'type cant be empty. please refer this value (TopUp, Cashback, Order)'
          }
        },
        'amount': {
          notEmpty: {
            errorMessage: 'amount cant be empty, and please follow format based on example'
          }
        },
        'curency': {
          notEmpty: {
            errorMessage: 'curency cant be empty'
          }
        },
        'remark_1': {
          notEmpty: {
            errorMessage: 'remark_1 cant be empty. if empty needed, please fill with single white space'
          }
        },
        'remark_2': {
          notEmpty: {
            errorMessage: 'remark_2 cant be empty. if empty needed, please fill with single white space'
          }
        }
    })

    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.createTransaction(req.body, req.user)
    .then(result => (!result) ? res.status(500).send({message: 'Failed to Create Transaction'}): res.status(result.status).send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /transaction/validate/{trans_reff_number}:
   *   put:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: finish current transaction
   *     parameters:
   *       - name: trans_reff_number
   *         description: transaction refference number. provided after transaction
   *         in: path
   *         type: string
   *         required: true
   *         x-example: "123456-123456-123456"
   *     produces:
   *       - application/json
   *     responses:
   *       201:
   *         description: transaction updated
   */
  app.put(base_path+'/validate/:trans_reff_number', function(req, res, next) {
    req.checkParams({
      'trans_reff_number': {
        notEmpty: {
          errorMessage: 'trans_reff_number cant be empty, and please follow format based on example'
        }
      }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.validateTransaction(req.params.trans_reff_number, 'Completed', req.user)
    .then(result => (!result) ? res.status(501).send({message:'Failed To Implemet'}): res.status(result.status).send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /transaction/system/validate/{trans_reff_number}:
   *   put:
   *     tags:
   *       - Transaction
   *     security:
   *      - basicAuth: []
   *     description: finish current transaction
   *     parameters:
   *       - name: trans_reff_number
   *         description: transaction refference number. provided after transaction
   *         in: path
   *         type: string
   *         required: true
   *         x-example: "123456-123456-123456"
   *     produces:
   *       - application/json
   *     responses:
   *       201:
   *         description: transaction updated
   */
  app.put(base_path+'/system/validate/:trans_reff_number', function(req, res, next) {
    req.checkParams({
      'trans_reff_number': {
        notEmpty: {
          errorMessage: 'trans_reff_number cant be empty, and please follow format based on example'
        }
      }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.validateTransaction(req.params.trans_reff_number, 'Completed', req.user)
    .then(result => (!result) ? res.status(501).send({message:'Failed To Implemet'}): res.status(result.status).send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /transaction/admin/validate/{trans_reff_number}:
   *   put:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: finish current transaction
   *     parameters:
   *       - name: trans_reff_number
   *         description: transaction refference number. provided after transaction
   *         in: path
   *         type: string
   *         required: true
   *         x-example: "123456-123456-123456"
   *     produces:
   *       - application/json
   *     responses:
   *       201:
   *         description: transaction updated
   */
  app.put(base_path+'/admin/validate/:trans_reff_number', function(req, res, next) {
    req.checkParams({
      'trans_reff_number': {
        notEmpty: {
          errorMessage: 'trans_reff_number cant be empty, and please follow format based on example'
        }
      }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.validateTransaction(req.params.trans_reff_number, 'Completed', req.user)
    .then(result => (!result) ? res.status(501).send({message:'Failed To Implemet'}): res.status(result.status).send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /transaction/user/cancel/{trans_reff_number}:
   *   put:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: cancel current transaction
   *     parameters:
   *       - name: trans_reff_number
   *         description: transaction refference number. provided after transaction
   *         in: path
   *         type: string
   *         required: true
   *         x-example: "123456-123456-123456"
   *     produces:
   *       - application/json
   *     responses:
   *       201:
   *         description: transaction updated
   */
  app.put(base_path+'/user/cancel/:trans_reff_number', function(req, res, next) {
    req.checkParams({
      'trans_reff_number': {
        notEmpty: {
          errorMessage: 'trans_reff_number cant be empty, and please follow format based on example'
        }
      }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.validateTransaction(req.params.trans_reff_number, 'Cancel', req.user)
    .then(result => (!result) ? res.status(501).send({message:'Failed To Implemet'}): res.status(result.status).send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /transaction/system/cancel/{trans_reff_number}:
   *   put:
   *     tags:
   *       - Transaction
   *     security:
   *      - basicAuth: []
   *     description: cancel current by system
   *     parameters:
   *       - name: trans_reff_number
   *         description: transaction refference number. provided after transaction
   *         in: path
   *         type: string
   *         required: true
   *         x-example: "123456-123456-123456"
   *     produces:
   *       - application/json
   *     responses:
   *       201:
   *         description: transaction updated
   */
  app.put(base_path+'/system/cancel/:trans_reff_number', function(req, res) {
    req.checkParams({
      'trans_reff_number': {
        notEmpty: {
          errorMessage: 'trans_reff_number cant be empty, and please follow format based on example'
        }
      }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.validateTransaction(req.params.trans_reff_number, 'Cancel', req.user)
    .then(result => (!result) ? res.status(501).send({message:'Failed To Implemet'}): res.status(result.status).send(result)).catch(err => next(err))
  })

   /**
   * @swagger
   * /transaction/user/suspend/fraud:
   *   get:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: get list transaction based on user token
   *     parameters:
   *       - name: start_date
   *         x-example: '2018-12-03 00:00:00'
   *         type: string
   *         pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
   *         description: it must be filled with other date parameter if not will be set default today date
   *         in: query
   *         required: true
   *       - name: page
   *         x-example: 1
   *         type: integer
   *         description: offset order list
   *         in: query
   *         required: true
   *       - name: count
   *         x-example: 10
   *         type: integer
   *         description: limit order list
   *         in: query
   *         required: true
   *       - name: client_id
   *         x-example: 10544
   *         type: string
   *         description: client id user
   *         in: query
   *         required: false
   *       - name: order_by
   *         x-example: client_id
   *         type: string
   *         description: ordering list by (client_id,debit,credit,saldo)
   *         in: query
   *         required: false
   *       - name: order
   *         x-example: DESC
   *         type: string
   *         description: ordering list (ASC/DESC)
   *         in: query
   *         required: false
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: List of transaction
   */
  app.get(base_path+'/user/suspend/fraud', function(req, res, next) {
    req.checkQuery({
        'start_date': {
          notEmpty: {
            errorMessage: 'start_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
         'page': {  
           notEmpty: {  
             errorMessage: 'page cant be empty' 
           }, 
           isInt: { 
             errorMessage: 'page must be integer value' 
           }  
         }, 
         'count': { 
           notEmpty: {  
             errorMessage: 'count cant be empty'  
           }, 
           isInt: { 
             errorMessage: 'count must be integer value'  
           }  
         }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else {
      const validClientIdList = (req.query.client_id!==undefined) ? req.query.client_id.split(',').map(Number).filter(i=> Number.isInteger(parseInt(i, 10))) : []      
      transaction.userSuspendFraud(formatPageLimit(req.query),validClientIdList,req.user.token)
      .then(result => res.send(result)).catch(err => next(err))
    }
  })
  /**
   * @swagger
   * /transaction/user/suspend/fraud/summary:
   *   get:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: get list transaction based on user token
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: List of transaction
   */
  app.get(base_path+'/user/suspend/fraud/summary', function(req, res, next) {
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else {
      transaction.summaryFraud(req.user.token)
      .then(result => res.send(result)).catch(err => next(err))
    }
  })

  /**
   * @swagger
   * /transaction/deposit/fraud:
   *   get:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: get list transaction based on user token
   *     parameters:
   *       - name: start_date
   *         x-example: '2018-12-03 00:00:00'
   *         type: string
   *         pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
   *         description: it must be filled with other date parameter if not will be set default today date
   *         in: query
   *         required: true
   *       - name: page
   *         x-example: 1
   *         type: integer
   *         description: offset order list
   *         in: query
   *         required: true
   *       - name: count
   *         x-example: 10
   *         type: integer
   *         description: limit order list
   *         in: query
   *         required: true
   *       - name: client_id
   *         x-example: 10544
   *         type: integer
   *         description: client id user
   *         in: query
   *         required: false
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: List of deposit fraud transaction
   */
  app.get(base_path+'/deposit/fraud', function(req, res, next) {
    req.checkQuery({
        'start_date': {
          notEmpty: {
            errorMessage: 'start_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
        'page': {
          notEmpty: {
            errorMessage: 'page cant be empty'
          },
          isInt: {
            errorMessage: 'page must be integer value'
          }
        },
        'count': {
          notEmpty: {
            errorMessage: 'count cant be empty'
          },
          isInt: {
            errorMessage: 'count must be integer value'
          }
        }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else {
      console.log(req.query)
      transaction.depositTransactionsFraud(formatPageLimit(req.query),req.user.token)
      .then(result => res.send(result)).catch(err => next(err))
    }
  })


  /**
   * @swagger
   * /transaction/revalidate/{trans_reff_number}:
   *   put:
   *     tags:
   *       - Transaction
   *     security:
   *      - Authorization: []
   *     description: re validate current transaction canceled
   *     parameters:
   *       - name: trans_reff_number
   *         description: transaction refference number. provided after transaction canceled
   *         in: path
   *         type: string
   *         required: true
   *         x-example: "123456-123456-123456"
   *     produces:
   *       - application/json
   *     responses:
   *       201:
   *         description: transaction updated
   */
  app.put(base_path+'/revalidate/:trans_reff_number', function(req, res, next) {
    req.checkParams({
      'trans_reff_number': {
        notEmpty: {
          errorMessage: 'trans_reff_number cant be empty, and please follow format based on example'
        }
      }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.reValidateTransaction(req.params.trans_reff_number, 'Pending', req.user)
    .then(result => (!result) ? res.status(501).send({message:'Failed To Implemet'}): res.status(result.status).send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /transaction/system/revalidate/{trans_reff_number}:
   *   put:
   *     tags:
   *       - Transaction
   *     security:
   *      - basicAuth: []
   *     description: re validate current transaction canceled
   *     parameters:
   *       - name: trans_reff_number
   *         description: transaction refference number. provided after transaction canceled
   *         in: path
   *         type: string
   *         required: true
   *         x-example: "123456-123456-123456"
   *     produces:
   *       - application/json
   *     responses:
   *       201:
   *         description: transaction updated
   */
  app.put(base_path+'/system/revalidate/:trans_reff_number', function(req, res, next) {
    req.checkParams({
      'trans_reff_number': {
        notEmpty: {
          errorMessage: 'trans_reff_number cant be empty, and please follow format based on example'
        }
      }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.reValidateTransaction(req.params.trans_reff_number, 'Pending', req.user)
    .then(result => (!result) ? res.status(501).send({message:'Failed To Implemet'}): res.status(result.status).send(result)).catch(err => next(err))
  });


  /**
   * @swagger
   * /transaction/async:
   *   post:
   *     tags:
   *       - Async Transaction
   *     security:
   *      - Authorization: []
   *     description: create transaction by system, wich is deduction on main account
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: body
   *         description: create transaction
   *         in: body
   *         schema: {
   *          "type": "object",
   *          "required": true,
   *          "properties": {
   *              "trans_date": {
   *                  "type": "string",
   *                  "example": "2018-05-01 12:50:51"
   *              },
   *              "type": {
   *                  "type": "string",
   *                  "example": "Cashback"
   *              },
   *              "amount": {
   *                  "type": "decimal",
   *                  "example": 1000000.00
   *              },
   *              "curency": {
   *                  "type": "string",
   *                  "example": "IDR"
   *              },
   *              "remark_1": {
   *                  "type": "string",
   *                  "example": "sample remark 1"
   *              },
   *              "remark_2": {
   *                  "type": "string",
   *                  "example": "sample remark 2"
   *              },
   *              "result_url": {
   *                  "type": "string",
   *                  "example": "https://apidev.ralali.com/api/v2/async_result"
   *              } 
   *           }
   *        }
   *     responses:
   *       202:
   *         description: The request has been accepted for processing
   *       400:
   *         description: The request is not valid
   */
  app.post(base_path+'/async', (req, res, next) => {
      req.checkBody({
        'trans_date': {
          notEmpty: {
            errorMessage: 'trans_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
        'type': {
          notEmpty: {
            errorMessage: 'type cant be empty. please refer this value (TopUp, Cashback, Order)'
          }
        },
        'amount': {
          notEmpty: {
            errorMessage: 'amount cant be empty, and please follow format based on example'
          }
        },
        'curency': {
          notEmpty: {
            errorMessage: 'curency cant be empty'
          }
        },
        'remark_1': {
          notEmpty: {
            errorMessage: 'remark_1 cant be empty. if empty needed, please fill with single white space'
          }
        },
        'remark_2': {
          notEmpty: {
            errorMessage: 'remark_2 cant be empty. if empty needed, please fill with single white space'
          }
        }
    })

    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else{
      var create = transaction.asyncCrateTransaction(req.body, req.user).promise();
      create.then(result => (!result) ? res.status(500).send({message: 'Failed to Create Transaction'}): res.status(202).send({message: 'Processing Request',process_id: result.MessageId})).catch(err => next(err))
    } 
  });

  /**
   * @swagger
   * /transaction/async/system:
   *   post:
   *     tags:
   *       - Async Transaction
   *     security:
   *      - basicAuth: []
   *     description: create transaction by system, wich is deduction on main account
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: body
   *         description: create transaction
   *         in: body
   *         schema: {
   *          "type": "object",
   *          "required": true,
   *          "properties": {
   *              "trans_date": {
   *                  "type": "string",
   *                  "example": "2018-05-01 12:50:51"
   *              },
   *              "type": {
   *                  "type": "string",
   *                  "example": "Cashback"
   *              },
   *              "amount": {
   *                  "type": "decimal",
   *                  "example": 1000000.00
   *              },
   *              "curency": {
   *                  "type": "string",
   *                  "example": "IDR"
   *              },
   *              "remark_1": {
   *                  "type": "string",
   *                  "example": "sample remark 1"
   *              },
   *              "remark_2": {
   *                  "type": "string",
   *                  "example": "sample remark 2"
   *              },
   *              "result_url": {
   *                  "type": "string",
   *                  "example": "https://apidev.ralali.com/api/v2/async_result"
   *              } 
   *           }
   *        }
   *     responses:
   *       201:
   *         description: Successfully create transaction
   */
  app.post(base_path+'/async/system', (req, res, next) => {
      req.checkBody({
        'trans_date': {
          notEmpty: {
            errorMessage: 'trans_date cant be empty, and please follow format based on example (yyyy-MM-DD hh:mm:ss)'
          }
        },
        'type': {
          notEmpty: {
            errorMessage: 'type cant be empty. please refer this value (TopUp, Cashback, Order)'
          }
        },
        'amount': {
          notEmpty: {
            errorMessage: 'amount cant be empty, and please follow format based on example'
          }
        },
        'curency': {
          notEmpty: {
            errorMessage: 'curency cant be empty'
          }
        },
        'remark_1': {
          notEmpty: {
            errorMessage: 'remark_1 cant be empty. if empty needed, please fill with single white space'
          }
        },
        'remark_2': {
          notEmpty: {
            errorMessage: 'remark_2 cant be empty. if empty needed, please fill with single white space'
          }
        }
    })

    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else {
      var create = transaction.asyncCrateTransaction(req.body, req.user).promise();
      create.then(result => (!result) ? res.status(500).send({message: 'Failed to Create Transaction'}): res.status(202).send({message: 'Processing Request',process_id: result.MessageId})).catch(err => next(err))
    }
  });

}