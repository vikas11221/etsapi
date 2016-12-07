var dbNames = require('../assets/dbNames');
var dbHelper = require('../helper/dbHelper');
var ApiException = require('../libs/core/ApiException');

var mysql = require('mysql');


var emaillIdHelper = {};
module.exports = emaillIdHelper;


/**
 * Get email id of licensee or admin of a domain
 * callbcak version
 */

emaillIdHelper.getMailId = function (domainId, roleId) {
    return new Promise(function (resolve, reject) {
        var sql = 'CALL ??(?,?);';
        var inserts = [dbNames.sp.getEmailId, domainId, roleId];
        sql = mysql.format(sql, inserts);
        dbHelper.executeQueryPromise(sql).then(function (result) {
            if (result[0].length) {
                resolve(result[0]);
            }
            else {
                reject(ApiException.newNotFoundError(null).addDetails('No recepients found'));
            }
        }, function (error) {
            reject(error);
        });
    });
};

/**
 * Get email id of licensee or admin of a domain
 * promise version
 */

emaillIdHelper.getMailIdAsync = function (domainId, roleId, callback) {
    emaillIdHelper.getMailId(domainId, roleId).then(function (result) {
        return callback(null, result);
    }, function (error) {
        return callback(error);
    });
};