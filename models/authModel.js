var ApiException = require('../libs/core/ApiException');
var dbHelper = require('../helper/dbHelper');
var Check = require('../libs/core/Check');
var appUtils = require('../libs/appUtils');
var responseModel = require('../assets/responseModel');
var api_errors = require('../assets/api_errors');
var responseMessage = require('../assets/responseMessage');
var dbNames = require('../assets/dbNames');
// var mailer = require('../notify/mailNotifier');
var api_events = require('../assets/api_events');
var userModel = require('./userModel');

var md5 = require('md5');
var uuid = require('node-uuid');
var mysql = require('mysql');
var async = require('async');
var lodash = require('lodash');
var randomstring = require('randomstring');
var moment = require('moment');

//Define modules

var auth = {};
module.exports = auth;


auth.saveLoginLogoutTime = function (req, callback) {
     var stringQuery = 'INSERT INTO loginLogoutTime SET ? ';
     var insertData = sanitizeLogoutData(req);
    stringQuery = mysql.format(stringQuery, insertData);

    dbHelper.executeQuery(stringQuery, function (err, result) {
        if (err) {
            return callback(err);
        }
        return callback(err, result);

    });
};

/**
 * Check User Email existance
 * @param {Object} req - express request object.
 * @param {function(Error,object)} callback - callback function.
 */
auth.checkEmail = function (req, callback) {
    var rules = {
        email: Check.that(req.params.email).isNotEmptyOrBlank().isEmail().isLengthInRange(1, 100)
    };
    appUtils.validateChecks(rules, function (err, result) {
        if (err) {
            return callback(err);
        }
        checkEmailExistance(req.params.email, function (err, status) {
            if (err) {
                return callback(err);
            }
            var response = new responseModel.objectResponse();
            response.data['isExists'] = false;
            if (status > 0) {
                response.data['isExists'] = true;
            }
            return callback(err, response);

        });
    });
};


/**
 * Check UserName existance
 * @param {Object} req - express request object.
 * @param {function(Error,object)} callback - callback function.
 */
auth.checkUserName = function (req, callback) {
    var rules = {
        userName: Check.that(req.params.userName).isNotEmptyOrBlank().isLengthInRange(1, 100)
    };
    appUtils.validateChecks(rules, function (err, result) {
        if (err) {
            return callback(err);
        }
        checkUserNameExistance(req.params.userName, function (err, status) {
            if (err) {
                return callback(err);
            }
            var response = new responseModel.objectResponse();
            response.data['isExists'] = false;
            if (status > 0) {
                response.data['isExists'] = true;
            }
            return callback(err, response);
        });
    });
};


/**
 * User login model
 * @param {Object} req - express request object.
 * @param {function(Error,object)} callback - callback function.
 */
auth.login = function (req, callback) {
    var rules = {
        email: Check.that(req.body.email).isNotEmptyOrBlank().isLengthInRange(1, 100),
        password: Check.that(req.body.password).isNotEmptyOrBlank().isLengthInRange(4, 20),
        // domainId: Check.that(req.body.domainId).isInteger()
    };
    var userDetail = {};
    var newSessionId = '';
    async.series([
        function (cb) {
            appUtils.validateChecks(rules, cb);
        },
        function (cb) {
            validateUser(req.body, function (err, result) {
                if (err) {
                    return cb(err);
                }
              
                else {
                    if (result.password == md5(req.body.password)) {
                        newSessionId = uuid.v4();
                        userDetail = result;
                        updateUserDetailOnLogin(req, newSessionId, cb);
                    }
                    else {
                        return cb(ApiException.newNotAllowedError(api_errors.invalid_auth_credentials.error_code, null).addDetails(responseMessage.WRONG_PASSWORD));
                    }
                }
            });
        }

    ], function (err, results) {
        if (err) {
            return callback(err);
        }
        else {
            var _req = {};
            _req.body = {};
            _req.body.userId = userDetail.id.toString();
           
            var body = {userId: _req.body.userId, loginTime: new moment().format("YYYY-MM-DD HH:mm:ss")};
            var wrapBody = {};
            wrapBody.body = body;
            auth.saveLoginLogoutTime(wrapBody,function (err, result) {
              userModel.getdetail(_req, function (err, result) {
                var response = responseForSuccessfulLogin(result[0],req.body.password);
                return callback(null, response, newSessionId);
            })
              
            })
        }
    });

};


/**
 * For sending response if user successfully logged in.
 * @param {Object}  - userDetail(object).
 */
var responseForSuccessfulLogin = function (userDetail,password) {
    var response = new responseModel.objectResponse();
    response.data = {
        'firstName': userDetail.firstName,
        'lastName': userDetail.lastName,
        'email': userDetail.email,
        'contactNo': userDetail.phone ? userDetail.phone : '',
        'userId': userDetail.id,
        'imgUrl': userDetail.imgUrl,
        'roleId': userDetail.roleId,
        'userName': userDetail.userName,
        'loginDateTime': userDetail.date,
        'password':password

    };

    switch (userDetail.roleId) {
        case 2:
            {
                response.data['businessId'] = userDetail.businessId ? userDetail.businessId : 0;
                response.data['businessTitle'] = userDetail.businessTitle ? userDetail.businessTitle : '';
                response.data['enables'] = userDetail['enables'] ? lodash.compact(lodash.split(userDetail['enables'], ',')) : [];
                response.data['isProfile'] = userDetail['isProfile'] ? true : false;
                response.data['address'] = userDetail['address'] ? userDetail['address'] : '';
                response.data['webUrl'] = userDetail['webUrl'] ? userDetail['webUrl'] : '';
                break;
            }
        case 3:
            {
                response.data['domainId'] = userDetail.domainId;
                break;
            }
        case 4:
            {
                response.data['domainId'] = userDetail.domainId;
                response.data['privilage'] = userDetail.privilege;
            }
    }
    return response;
};


/**
 * Check User Email exist in database or Not.
 * @param {Object} req - express request object.
 * @param {function(Error,object)} callback - callback function..
 */
var checkEmailExistance = function (emailId, callback) {
    var sql = 'SELECT count(id) as count FROM ?? WHERE (?? = ? OR ??=?) AND ??=?';
    var inserts = ['db_users', 'email', emailId, 'userName', emailId, 'isDeleted', false];
    sql = mysql.format(sql, inserts);
    dbHelper.executeQuery(sql, function (err, result) {
        if (err) {
            return callback(err);
        }
        return callback(null, result[0].count);

    });
};


/**
 * Check UserName exist in database or Not.
 * @param {Object} req - express request object.
 * @param {function(Error,object)} callback - callback function..
 */
var checkUserNameExistance = function (userName, callback) {
    var sql = 'SELECT count(id) as count FROM ?? WHERE (?? = ? OR ??=?) AND ??=?';
    var inserts = ['db_users', 'userName', userName, 'email', userName, 'isDeleted', false];
    sql = mysql.format(sql, inserts);
    dbHelper.executeQuery(sql, function (err, result) {
        if (err) {
            return callback(err);
        }
        return callback(null, result[0].count);
    });
};


/**
 * For authentication of user.
 * @param {Object} req - express request object.
 * @param {function(Error,object)} callback - callback function.
 */
var validateUser = function (request, callback) {
    var sql = 'CALL ?? ( ?,?);';
    var object = [dbNames.sp.getUserDetail, '', request.email];
    sql = mysql.format(sql, object);
    dbHelper.executeQueryPromise(sql).then(function (result) {
        if (result[0].length) {
            return callback(null, result[0][0]);
        }
        else {
            return callback(ApiException.newNotAllowedError(api_errors.invalid_auth_credentials.error_code, null).addDetails(api_errors.invalid_auth_credentials.description));
        }
    }, function (error) {
        return callback(error);
    });
};


/**
 * Update the user details when user logged in.
 * @param {Object} req - express request object.
 * @param{int}-newSessionId(int).
 * @param {function(Error,object)} callback - callback function.
 */
var updateUserDetailOnLogin = function (req, newSessionId, callback) {
    var updateObject = {};

    if (req.body.deviceType && req.body.deviceId) {
        updateObject['deviceType'] = req.body.deviceType;
        updateObject['deviceId'] = req.body.deviceId;
    }
    updateObject['sessionId'] = newSessionId;

    var stringQuery = 'UPDATE ?? SET ? WHERE email = ? OR userName=? ';
    stringQuery = mysql.format(stringQuery, ['users', updateObject, req.body.email, req.body.email]);
    dbHelper.executeQueryPromise(stringQuery).then(function (result) {
        updateDateIfLoggedInFirstTimeToday({ sessionId: newSessionId, date: moment().format('YYYY-MM-DD HH:mm:ss') }, callback);
    }, function (err) {
        callback(err, null);
    });

};

var updateDateIfLoggedInFirstTimeToday = function (params, callback) {
    var stringQuery = 'select id from users where date(users.date) = ? and sessionId = ?';
    stringQuery = mysql.format(stringQuery, [params.date.split(" ")[0],params.sessionId]);
    dbHelper.executeQueryPromise(stringQuery).then(function (result) {
        if (result.length) {
             callback(null, result);
        }
        else {
            stringQuery = 'UPDATE ?? SET users.date = ? WHERE sessionId = ?';
            stringQuery = mysql.format(stringQuery, ['users',params.date,params.sessionId]);
            dbHelper.executeQueryPromise(stringQuery).then(function (result) {
                 callback(null, result);
            }, function (err) {
                callback(err, null);
            });
        }

    }, function (err) {
        callback(err, null);
    });
};

/**
 * Reset the password.
 * @param {Object} req - express request object.
 * @param {function(Error,object)} callback - callback function.
 */
auth.forgetPassword = function (req, callback) {
    var rules = {
        email: Check.that(req.body.email).isNotEmptyOrBlank().isEmail()
    };
    appUtils.validateChecks(rules, function (err, result) {
        if (err) {
            return callback(err);
        }
        var newPassword = randomstring.generate(8);
        var encryptedNewPassword = md5(newPassword);
        var sql = 'CALL ?? ( ?,?);';
        var object = [dbNames.sp.resetPassword, req.body.email, encryptedNewPassword];
        sql = mysql.format(sql, object);
        dbHelper.executeQueryPromise(sql).then(function (result) {
            if (result[0][0].userExistance == 0) {
                return callback(ApiException.newNotAllowedError(api_errors.user_not_registered.error_code, null)
                    .addDetails(api_errors.user_not_registered.description));
            }
            var payload = {
                'name': result[1][0].name,
                'password': newPassword
            };
            var response = new responseModel.objectResponse();
            response.message = responseMessage.RESET_PASSWORD;
            mailer.sendMail(api_events.forget_password.event_code, req.body.email, payload);
            return callback(null, response);

        }, function (error) {
            callback(error);
        });

    });
};

var sanitizeLogoutData = function (req) {
    var data = {};
    data.userId = req.body.userId ? req.body.userId: req.auth.id;

    if(req.body.loginTime){
        data.loginTime = req.body.loginTime;
    }if(req.body.logoutTime){
        data.logoutTime = req.body.logoutTime;
    }
    if(req.body.totalWorkHours){
        data.totalWorkHours = req.body.totalWorkHours;
        data.totalIdleTime = req.body.totalIdleTime;
        data.remainingHours = req.body.remainingHours;
        data.totalMeetingTime = req.body.totalMeetingTime;
    }
    return data;
};
