'use strict'

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const { logger } = require('../helper/logger')
const loggerFunction = (msg) => {
  logger.info(msg)
}

const sequelize = new Sequelize(
  process.env.DB_MYSQL_DATABASE,
  process.env.DB_MYSQL_USERNAME,
  process.env.DB_MYSQL_PASSWORD, {
    dialect: 'mysql',
    protocol: 'mysql',
    host: process.env.DB_MYSQL_HOST,
    port: process.env.DB_MYSQL_PORT,
    logging: loggerFunction,
    define: {
      timestamps: false
    },
    dialectOptions: {
      multipleStatements: true,
      useUTC: false, //for reading from database
      dateStrings: true,
      typeCast: function (field, next) { // for reading from database
          if(field.type === 'DATETIME') return field.string()
          return next()
      }
    },
    timezone: '+07:00'
  }
)

const findFileRoute = dir => {
    let results = []
    const list = fs.readdirSync(dir).filter((file) => (file.indexOf('.') !== 0) && (file !== 'index.js'))
    list.forEach(file => {
        file = dir + '/' + file
        let stat = fs.statSync(file)
        if (stat && stat.isDirectory()) results = results.concat(findFileRoute(file))
        else results.push(file)
    })
    return results
}
const db = {}
findFileRoute(__dirname).forEach(file => {
	const model = sequelize.import(file)
    db[model.name] = model;
	logger.info('loaded model: ',file)
})
Object.keys(db).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db)
  }
})
db.sequelize = sequelize
db.Sequelize = Sequelize
module.exports = db