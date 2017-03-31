var bcrypt = require('bcrypt');

module.exports = {
    attributes: {
        provider: {type: 'string', required: true},
        uid: {type: 'string', required: true},
        shard: {type: 'string', required: true},
        token: {type: 'string', required: true}
    }
};

