'use strict'
const { user } = require('../../../controller')


const base_path = '/api/v1/user'
module.exports = (app) => {

  /**
   * @swagger
   * /user/activate:
   *   put:
   *     tags:
   *       - User
   *     security:
   *      - Authorization: []
   *     description: update current user profile
   *     produces:
   *       - application/json
   *     responses:
   *       201:
   *         description: user created
   */
  app.put(base_path+'/activate', function(req, res, next) {
    if(req.headers['x-access-token']==undefined) res.status(401).send({
      authorized: false,
      message: 'Full Authentication is Required to Access This Resource.'
    })
    else return user.activate(req.headers['x-access-token'])
    .then(result => res.status(result.status).send(result))
    .catch(err => next(err))    
  });

  /**
   * @swagger
   * /user/register:
   *   put:
   *     tags:
   *       - User
   *     security:
   *      - Authorization: []
   *     description: update current user profile
   *     produces:
   *       - application/json
   *     responses:
   *       201:
   *         description: user created
   */
  app.put(base_path+'/register', function(req, res, next) {
    if(req.headers['x-access-token']==undefined) res.status(401).send({
      authorized: false,
      message: 'Full Authentication is Required to Access This Resource.'
    })
    else return user.register(req.headers['x-access-token'])
    .then(result => res.status(result.status).send(result))
    .catch(err => next(err))    
  });

  /**
   * @swagger
   * /user/status:
   *   get:
   *     tags:
   *       - User
   *     security:
   *      - Authorization: []
   *     description: update current user profile
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: status user
   */
  app.get(base_path+'/status', function(req, res, next) {
    res.status(200).send(req.user)
  })
}
