var bcrypt = require('bcrypt');
var uuid = require('node-uuid');


module.exports = {
    attributes: {
        provider: {type: 'string', required: true},
        uid: {type: 'string', required: true},
        shard: {type: 'string', required: true},
        token: {type: 'string', required: true},
        id: { type: 'string', 
          primaryKey : 'true',
          defaultsTo: function (){ return uuid.v4(); },
          unique: true,
          index: true,
          uuidv4: true
        }
    }
};

