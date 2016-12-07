var ApiException = require('../libs/core/ApiException');
var dbHelper = require('../helper/dbHelper');
var dbNames = require('../assets/dbNames');

var mysql = require('mysql');

//define module

var contactHelper = {};
module.exports = contactHelper;

/**
 * Get contact us mail subject
 */

contactHelper.getContactSubject = function (contactObject) {
    return new Promise(function (resolve, reject) {
        var sql = 'CALL ?? ( ?,?);';
        var object = [dbNames.sp.contactUsMailSubject, contactObject.domainId, contactObject.subjectId];
        sql = mysql.format(sql, object);
        dbHelper.executeQueryPromise(sql).then(function (result) {
            if (result[0].length || result[1].length) {
                var subject = result[0][0].domainName
                    + ' "' + result[1][0].subjectName
                    + '" Inquiry';
                resolve(subject);
            }
            reject(ApiException.newNotFoundError(null));
        }, function (error) {
            reject(error);
        });
    });
};