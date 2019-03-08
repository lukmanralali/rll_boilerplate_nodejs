'use strict'
const model = require('../../model')
const { logger } = require('../../helper/logger')

const checkUserIsSuspended = (client_id) => {
    return model.user_suspened.findOne({
        where: {
            client_id: client_id,
            deleted_at: null
        }
    })
}

module.exports = {
    checkUserIsSuspended
}