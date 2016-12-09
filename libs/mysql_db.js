
var mysql = require('mysql');
var ApiException = require('../libs/core/ApiException');

var config = require('config');

module.exports = {
    connectionPool: null,
    connect: function () {
        var pool = mysql.createPool(config.get('db'));
        this.connectionPool = pool;
    },
    getConnection: function (callback) {
        this.connectionPool.getConnection(function (err, connection) {
            if (err) {
                return callback(ApiException.newInternalError(null), null);
            }
            return callback(err, connection);
        });
    }

};

