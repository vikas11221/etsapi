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
var moment = require('moment');
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
        isMeeting : Check.that(req.body.isMeeting).isNotEmptyOrBlank(),
        date : Check.that(req.body.date).isNotEmptyOrBlank()
    };
    appUtils.validateChecks(rules, function (err) {
        if (err) {
            return callback(err);
        }
        else {
            var insertData = sanitizeDataForTimingsTable(req.body);
            insertTimingsData(insertData, function (err, result) {
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

user.getTotalBreakTime = function (req, callback) {

    var curDate = moment().format().split("T")[0];

    var stringQuery = 'CALL ?? ( ?,?);';
    var object = [dbNames.sp.totalIdleTime_meetingTime, curDate , req.body.userId];
    stringQuery = mysql.format(stringQuery, object);

    dbHelper.executeQuery(stringQuery, function (err, result) {
        if (err) {
            return callback(err);
        }

        if (result[0].length) {
            getLoginTime(req.body.userId, function (err,result_date) {

                var loginTime = result_date[0].date;

                var myStringParts = (result[0])[0].totalIdleTime.split(':');
                var actualTime = moment(moment().format('YYYY-MM-DD hh:mm:ss')).subtract({ hours: myStringParts[0], minutes: myStringParts[1], seconds: myStringParts[2]});
                var _loginTime = new moment(moment( loginTime ).format('YYYY-MM-DD hh:mm:ss'));     
              
                var ms = moment(actualTime).diff(_loginTime);
                var d = moment.duration(ms);
                var totalWorkHours = Math.floor(d.asHours()) + moment.utc(ms).format(":mm:ss");
                
                var startTime=moment(totalWorkHours, "HH:mm:ss");
                var endTime=moment('08:30:00',"hh:mm:ss");
                var duration = moment.duration(endTime.diff(startTime));
                var hours = parseInt(duration.asHours());
                var minutes = parseInt(duration.asMinutes())-hours*60;

                var response = new responseModel.arrayResponse();
                response.data = lodash.concat(result[0] , {'totalWorkHours':totalWorkHours});
                response.data = lodash.concat(response.data , {'remainingHours':hours + ":" + minutes});
                return callback(null, response);
            });
        }

    });
};

var getLoginTime = function (userId, callback) {
    var stringQuery = 'SELECT date FROM users where id = ? ';
    stringQuery = mysql.format(stringQuery, userId);
    dbHelper.executeQuery(stringQuery, function (err, result) {
        if (err) {
            return callback(err);
        }
        return callback(err, result);

    });
};

user.changeIsApproved = function (req, callback) {
    var stringQuery = 'UPDATE timer_detail SET isApproved = ? where id = ? ';
    stringQuery = mysql.format(stringQuery, [req.body.isApproved == "true",req.body.breakTimeId]);
    dbHelper.executeQuery(stringQuery, function (err, result) {
        if (err) {
            return callback(err);
        }
        return callback(err, result);

    });
};

user.breaktimelist = function (req, callback) {
    var stringQuery = 'SELECT * FROM timer_detail ORDER BY date DESC';
    // stringQuery = mysql.format(stringQuery, [req.body.isApproved == "true",req.body.breakTimeId]);
    dbHelper.executeQuery(stringQuery, function (err, result) {
        if (err) {
            return callback(err);
        }
        
        if(result[0].length > 0){
        
        var response = new responseModel.arrayResponse();
                response.data = result[0];
                return callback(null, response);
        }
        
        return callback(err, result);

    });
};

var responseForSuccessfullSave = function () {
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
    insertObject['isApproved'] = false;
    insertObject['isMeeting'] = data.isMeeting == "true";
    insertObject['date'] = data.date;
    return insertObject;
};