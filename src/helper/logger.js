'use strict'

const winston = require('winston')
require('winston-daily-rotate-file')
const expressWinston = require('express-winston');

let transportConfiguration={
	filename: process.env.LOG_PATH+'/application-%DATE%.log',
	datePattern: 'YYYY-MM-DD',
	// datePattern: 'YYYY-MM-DD-HH', // to rotate log in hour
	level: process.env.LOG_LEVEL,
	maxSize: process.env.LOG_MAX_SIZE,
	maxFiles: process.env.LOG_MAX_FILE_NUMBER
}

const transport = new (winston.transports.DailyRotateFile)(transportConfiguration)
const logger = new (winston.Logger)({
    transports: [ transport ]
});

const expressLogger = expressWinston.logger({
	transports: [ transport ],
	meta: false,
	msg: "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}} {{req.params}}{{req.body}}{{req.query}}",
	expressFormat: true,
	colorize: false,
	ignoreRoute: function (req, res) { return false; }
})

const expressLoggerError = expressWinston.errorLogger({
	transports: [ transport ],
	meta: true,
	msg: "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}} {{req.params}}{{req.body}}{{req.query}}",
	expressFormat: true,
	colorize: false,
	ignoreRoute: function (req, res) { return false; }
})

module.exports = { logger, expressLogger, expressLoggerError }