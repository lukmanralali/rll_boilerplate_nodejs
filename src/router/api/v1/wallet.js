'use strict'
const { transaction,user } = require('../../../controller')

const base_path = '/api/v1/wallet'
module.exports = (app) => {

  /**
   * @swagger
   * /wallet/balance:
   *   get:
   *     tags:
   *       - Wallet
   *     security:
   *      - Authorization: []
   *     description: get user ballance
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: balance user
   */
  app.get(base_path+'/balance', function(req, res, next) {
    transaction.balanceSumary(req.user.client_id)
    .then(result => (!result) ? res.status(204).send(result): res.send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /wallet/balance/system:
   *   get:
   *     tags:
   *       - Wallet
   *     security:
   *      - Authorization: []
   *     description: get system ballance
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: balance system
   */
  app.get(base_path+'/balance/system', function(req, res, next) {
    transaction.balanceSystemSumary()
    .then(result => (!result) ? res.status(204).send(result): res.send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /wallet/balance/system/client/{client_id}:
   *   get:
   *     tags:
   *       - Wallet
   *     security:
   *      - basicAuth: []
   *     description: get system ballance
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: client_id
   *         description: client id
   *         in: path
   *         type: number
   *         required: true
   *         x-example: 1
   *     responses:
   *       200:
   *         description: balance system
   */
  app.get(base_path+'/balance/system/client/:client_id', function(req, res, next) {
    req.checkParams({
        'client_id': {
          notEmpty: {
            errorMessage: 'client_id cant be empty'
          },
          isInt: {
            errorMessage: 'client_id must be integer value'
          }
        }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.balanceSumary(req.params.client_id)
    .then(result => (!result) ? res.status(204).send(result): res.send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /wallet/balance/client/{client_id}:
   *   get:
   *     tags:
   *       - Wallet
   *     security:
   *      - Authorization: []
   *     description: get user ballance
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: client_id
   *         description: client id
   *         in: path
   *         type: number
   *         required: true
   *         x-example: 1
   *     responses:
   *       200:
   *         description: balance user
   */
  app.get(base_path+'/balance/client/:client_id', function(req, res, next) {
    req.checkParams({
        'client_id': {
          notEmpty: {
            errorMessage: 'client_id cant be empty'
          },
          isInt: {
            errorMessage: 'client_id must be integer value'
          }
        }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else transaction.balanceSumary(req.params.client_id)
    .then(result => (!result) ? res.status(204).send(result): res.send(result)).catch(err => next(err))
  })

  /**
   * @swagger
   * /wallet/balance/user/{user_id}:
   *   get:
   *     tags:
   *       - Wallet
   *     security:
   *      - Authorization: []
   *     description: get user ballance
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: user_id
   *         description: client id
   *         in: path
   *         type: number
   *         required: true
   *         x-example: 1
   *     responses:
   *       200:
   *         description: balance user
   */
  app.get(base_path+'/balance/user/:user_id', function(req, res, next) {
    req.checkParams({
        'user_id': {
          notEmpty: {
            errorMessage: 'user_id cant be empty'
          },
          isInt: {
            errorMessage: 'user_id must be integer value'
          }
        }
    })
    const errors = req.validationErrors()
    if(errors) res.status(400).send({message: errors})
    else {
      user.getIDUserActiveByUserId(req.params.user_id)
      .then(user=>{
        if(!user) res.status(200).send({count: {rows: 0,page: 1}, data:[], message:'User Not Found'})
        else{
          transaction.balanceSumary(user.client_id)
          .then(result => (!result) ? res.status(204).send(result): res.send(result))
        }
      }).catch(err => next(err))
    }
  })
}
