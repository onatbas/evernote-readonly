var bcrypt = require('bcrypt');

module.exports = {
    attributes: {
        evernoteId: {
            type: 'string',
            required: true,
        },
        token: {
            type: 'string',
            required: true,
        }
    }
};

