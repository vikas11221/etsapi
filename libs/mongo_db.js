var ApiException = require('../libs/core/ApiException');
var config = require('config');
var mongoose = require('mongoose');

var db = {};
module.exports = db;

db.connect = function() {
    var uri = config.get('db').host + "/" + config.get('db').database;

    if (db.mongooseDb){
        console.info('Connection established to : ', uri);
    }else {
        db.mongooseDb = mongoose.connection;
        mongoose.connect(uri);
        db.mongooseDb.Promise = global.Promise;

        db.mongooseDb.on('error', function (error) {
            console.info('Unable to connect to database.',error);
            process.exit(1)
        });

        // When successfully connected
        mongoose.connection.on('connected', function () {
            console.log('Mongoose connection established to ' + uri);
        });

        // When the connection is disconnected
        mongoose.connection.on('disconnected', function () {
            console.log('Mongoose connection disconnected');
        });

        // db.mongooseDb.on('open', function () {
        //     console.info('Connection established to : ', uri);
        // });
    }
};

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});

db.getConnection = function() {
    return db.mongooseDb;
};

db.disconnect = function(done) {
    if (db.mongooseDb) {
        db.mongooseDb.disconnect();
        done(null);
    }else {
        done("There is no connection!");
    }
};

