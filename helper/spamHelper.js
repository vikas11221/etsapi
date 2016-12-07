var ApiException = require('../libs/core/ApiException');
var dbHelper = require('../helper/dbHelper');
var api_errors = require('../assets/api_errors');
var dbNames = require('../assets/dbNames');

var mysql = require('mysql');


var spamHelper = {};
module.exports = spamHelper;

/**
 * Check user for spam before submitting review
 */
spamHelper.checkBusinessReviewSpam = function (checkObject) {
    return new Promise(function (resolve, reject) {
        var sql = 'CALL ?? ( ?,?,?)';
        var parameters = [dbNames.sp.checkBusinessReviewSpam, checkObject.domainId, checkObject.userId, checkObject.businessId];
        sql = mysql.format(sql, parameters);
        dbHelper.executeQuery(sql, function (err, result) {
            if (err) {
                reject(err);
            }
            if (result[0].length && result[0][0].status == 0) {
                resolve(false);
            }
            else {
                reject(ApiException.newNotAllowedError(api_errors.marked_spam.error_code, null)
                    .addDetails(api_errors.marked_spam.description));
            }
        });
    });
};