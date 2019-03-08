'use strict'
require('dotenv').load()
const { logger, expressLogger, expressLoggerError } = require('./src/helper/logger')
const express = require('express')
const fs = require('fs')
const app = express()
const routePath = './src/router/api/v1'
const findFileRoute = dir => {
    let results = []
    const list = fs.readdirSync(dir)
    list.forEach(function (file) {
        file = dir + '/' + file
        let stat = fs.statSync(file)
        if (stat && stat.isDirectory()) results = results.concat(findFileRoute(file))
        else results.push(file)
    })
    return results
}

/* set middleware */
// express logger
if(process.env.LOG_LEVEL_ROUTER=='error') app.use(expressLoggerError)
else app.use(expressLogger)

/* build router */
findFileRoute(routePath).forEach(absolutePath => require(absolutePath)(app))

/* create server */
const server = require('http').createServer(app);
const PORT = process.env.PORT || 5000
if (!module.parent) {
    server.listen(PORT, () => {
        console.log('Express Server Now Running. port:', PORT)
        logger.info('Express Server Now Running. port:', PORT)
    })
}
module.exports = app