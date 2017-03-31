const cfenv = require('cfenv');
var cf = cfenv.getAppEnv() || {};
var services = cf.services || {};
var postgresDbs = services['postgres'] || [{}];

function getAppUri() {
    if (cf) {
        var appEnv = cfenv.getAppEnv();
        return appEnv.url;
    } else {
        return 'http://localhost:1337';
    }
}


function getDBObject() {

    var db = postgresDbs[0];
    var credentials = db.credentials || {};
    var dbName = credentials.database || '';
    var dbUser = credentials.username || '';
    var dbHost = credentials.host || '';
    var dbPass = credentials.password || '';
    var dbPort = credentials.port || '';


    var dbObject = {
        adapter: 'sails-postgresql',
        host: dbHost || 'localhost',
        user: dbUser || 'onatbas',
        password: dbPass || '',
        port: dbPort || 5432,
        database: dbName || 'postgres',
        poolSize: 10,
        ssl: false
    };

    return dbObject;
};

module.exports = {
    getAppUri: getAppUri,
    getDBObject: getDBObject
}