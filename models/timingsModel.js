var ApiException = require('../libs/core/ApiException');
var api_errors = require('../assets/api_errors');
var dbHelper = require('../helper/dbHelper');
var Check = require('../libs/core/Check');
var appUtils = require('../libs/appUtils');
var responseModel = require('../assets/responseModel');
var responseMessage = require('../assets/responseMessage');
var awsHelper = require('../helper/awsUploadHelper');
var dbNames = require('../assets/dbNames');
var api_events = require('../assets/api_events');
// var mailer = require('../notify/mailNotifier');

var md5 = require('md5');
var uuid = require('node-uuid');
var mysql = require('mysql');
var lodash = require('lodash');
var async = require('async');
//define module

var user = {};
module.exports = user;

var _user_role = {
    'public': 1,
    'hod': 2,
    'admin': 6
};

/**
 * Used for creating new public user.
 * @param {object} - req (express request object)
 * @param {function(Error,object)} callback - callback function.
 */

user.saveBreakTime = function (req, callback) {
    var rules = {
        userId : Check.that(req.body.userId).isNotEmptyOrBlank(),
        meetingWith : Check.that(req.body.meetingWith).isOptional().isNotEmptyOrBlank().isLengthInRange(1, 50),
        reason : Check.that(req.body.reason).isNotEmptyOrBlank(),
        breakTime : Check.that(req.body.breakTime).isNotEmptyOrBlank(),
        isMeeting : Check.that(req.body.isMeeting).isNotEmptyOrBlank()
    };
    appUtils.validateChecks(rules, function (err) {
        if (err) {
            return callback(err);
        }
        else {
            var insertData = sanitizeDataForTimingsTable(req.body);
            insertTimingsData(insertData, function (err, userIdCreated) {
                if (err) {
                    return callback(err);
                }

                var sessionId = req.get('sessionId');
                var response = new responseModel.objectResponse();
                response.data = responseForSuccessfullSave();
                response.message = responseMessage.TIME_SAVED;
                return callback(null, response, sessionId);
            });
        }
    });
};

var responseForSuccessfullSave = function (userDetail, userId, roleId) {
    var response = {};
    return response;
};

var insertTimingsData = function (insertData, callback) {
    var stringQuery = 'INSERT INTO timer_detail SET ? ';
    stringQuery = mysql.format(stringQuery, insertData);
    dbHelper.executeQuery(stringQuery, function (err, result) {
        if (err) {
            return callback(err);
        }
        return callback(err, result);

    });
};


var sanitizeDataForTimingsTable = function (data) {
    var insertObject = {};
    insertObject['userId'] = data.userId.trim();
    insertObject['reason'] = data.reason.trim();
    insertObject['breakTime'] = data.breakTime;
    if (data.meetingWith) {
        insertObject['meetingWith'] = data.meetingWith.trim();
    }
    insertObject['isMeeting'] = data.isMeeting;
    return insertObject;
};