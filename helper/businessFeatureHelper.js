var ApiException = require('../libs/core/ApiException');
var dbHelper = require('../helper/dbHelper');
var dbNames = require('../assets/dbNames');
var api_errors = require('../assets/api_errors');

var mysql = require('mysql');
var lodash = require('lodash');


var businessFeatures = {};
module.exports = businessFeatures;

/**
 * Verify enable flag for a business
 * @param {int} businessId -(Business to verify).
 * @param {int} featureId -(feature to verify).
 * @param {function(Error,object)} callback - callback function.
 */
businessFeatures.verifyFeatures = function (businessId, featureId, callback) {
    featureId ? featureId : 0;
    var sql = 'CALL ?? ( ?,?);';
    var parameters = [dbNames.sp.businessFeatureCheck, businessId, featureId];
    sql = mysql.format(sql, parameters);
    dbHelper.executeQuery(sql, function (err, result) {
        if (err) {
            return callback(err);
        }
        if (result[0].length) {
            var flags = {
                'isProfile': result[0][0].isProfile ? true : false,
                'enables': result[0][0].enables ? lodash.compact(lodash.split(result[0][0].enables, ',')) : []
            };

            return callback(err, flags);
        }
        return callback(ApiException.newNotAllowedError(api_errors.feature_not_allowed.error_code, null)
            .addDetails(api_errors.feature_not_allowed.description));
    });
};