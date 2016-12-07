var ApiException = require('../libs/core/ApiException');
var dbNames = require('../assets/dbNames');
var dbHelper = require('../helper/dbHelper');
var userModel = require('../models/userModel');
var businessModel = require('../models/businessModel');


var parse = require('csv-parse');
var fs = require('fs');
var async = require('async');
var mysql = require('mysql');
var mime = require('mime');


var importBusiness = {};
module.exports = importBusiness;

importBusiness.importData = function (req, callback) {
    var csvArray = [];
    var noOfRecords = 0;
    async.series([
        function (cb) {
            if (!req.file || mime.lookup(req.file.path) != 'text/csv') {
                return cb(ApiException.newBadRequestError(null).addDetails('Upload a .csv file'));
            }
            else
                return cb(null);
        },
        function (cb) {
            var parser = parse({ delimiter: ';' }, function (err, result) {
                if (err) {
                    return cb(err);
                }
                if (result.length < 2) {
                    return cb(ApiException.newBadRequestError(null).addDetails('Invalid CSV file format'));
                }
                csvArray = result;
                noOfRecords = csvArray.length - 1;
                return cb(null, csvArray);
            });
            fs.createReadStream(req.file.path).pipe(parser);
        },
        function (cb) {
            validateJSON(csvArray, function (err, result) {
                csvArray = result;
                cb(err, result);
            });
        },
        function (cb) {
            importToDB(csvArray).then(function (result) {
                cb(null, result);
            }).catch(function (error) {
                cb(error);
            });
        }
    ], function (err, results) {
        if (req.file)
            fs.unlink(req.file.path, function () { });
        if (err) {
            return callback(err);
        }
        return callback(err, noOfRecords, results[3].errorCount);
    });
};



var validateJSON = function (array, callback) {
    var resultSet = [];
    array.forEach(function (rows, index) {
        if (rows.length == 15 && index != 0) {
            resultSet.push(rows);
        }
    });
    if (!resultSet.length) {
        return callback(ApiException.newBadRequestError(null).addDetails('Invalid CSV file format'));
    }
    return callback(null, resultSet);
};


var importToDB = function (rows) {
    return new Promise(function (resolve, reject) {
        var promiseArray = [];
        rows.forEach(function (row) {
            promiseArray.push(importSingleData(row));
        });
        Promise.all(promiseArray).then(function (results) {
            var promiseResult = {
                'errorCount': 0,
                'successArray': []
            };
            results.forEach(function (result) {
                if (result.isError) {
                    promiseResult.errorCount++;
                }
                else {
                    promiseResult.successArray.push(result);
                }
            });
            resolve(promiseResult);
        }).catch(function (error) {
            reject(error);
        });
    });
};


var importSingleData = function (object) {
    return new Promise(function (resolve, reject) {
        var domainDetail = {};
        var userId = 0;
        var businessId = 0;
        async.series([
            function (cb) {
                validateDbfields(object, function (err, result) {
                    if (err) {
                        return cb(err);
                    }
                    else {
                        domainDetail = result;
                        return cb(null, result);
                    }
                });
            },
            function (cb) {
                insertUserData(object, domainDetail, function (err, result) {
                    if (err) {
                        return cb(err);
                    }
                    userId = result.data.userId;
                    return cb(null, result);
                });
            },
            function (cb) {
                insertBusinessData(object, domainDetail, function (err, result) {
                    if (err) {
                        return cb(err);
                    }
                    businessId = result.data.businessId;
                    return cb(null, result);
                });
            },
            function (cb) {
                updateBusinessProfile(userId, businessId, cb);
            }
        ], function (err, result) {
            if (err) {
                resolve({ 'isError': true });
                userModel.failedSignUp(userId);
            }
            else {
                resolve({ 'isError': false });
            }
        });

    });
};


var validateDbfields = function (fieldArray, callback) {
    var sql = 'CALL ?? ( ?,?,?,?)';
    var parameters = [dbNames.sp.importBusinessFieldCheck,
        fieldArray[7],
        fieldArray[8],
        fieldArray[9],
        fieldArray[11]
    ];
    sql = mysql.format(sql, parameters);
    dbHelper.executeQuery(sql, function (err, result) {
        if (err) {
            return callback(err);
        }
        if (result[0].length) {
            return callback(err, result[0][0]);
        }
        return callback(ApiException.newNotFoundError(null));
    });
};

var insertUserData = function (row, domainDetail, callback) {
    var userObject = {
        'body': {
            'firstName': row[1],
            'lastName': row[2],
            'email': row[5],
            'userName': row[3],
            'contactNo': row[6],
            'password': row[4],
            'address': row[10],
            'webUrl': row[13],
            'domainId': domainDetail.domainId,
            'businessTitle': row[0],
            'isInternalCall': true
        }
    };
    userModel.createBusinessOwner(userObject, callback);
};

var insertBusinessData = function (row, domainDetail, callback) {
    var businessObject = {
        'body': {
            'domainId': domainDetail.domainId,
            'title': row[0],
            'description': row[14],
            'categoryId1': domainDetail.categoryId,
            'subcategoryId1': domainDetail.subcategoryId,
            'logoImg': domainDetail.cityImage ? domainDetail.cityImage : 'https://devnightout.s3.amazonaws.com/slides/1473400418321_rsz_rsz_new-york-city.jpg',
            'isProfile': false,
            'locations': [{
                'locationId': domainDetail.locationId,
                'cityId': domainDetail.cityId,
                'address': row[10],
                'postalCode': row[12] ? row[12] : '',
                'locationOrder': 1,
                'isInternalCall': true,
                'phoneNo': row[6] ? row[6] : ''
            }],
            'isInternalCall': true

        }
    };
    businessModel.createBusinessModel(businessObject, callback);
};


var updateBusinessProfile = function (userId, businessId, callback) {
    if (userId && businessId) {
        var stringQuery = 'UPDATE ?? SET businessId=? WHERE ??=?';
        var insertObject = ['db_business_profiles', businessId, 'userId', userId];
        stringQuery = mysql.format(stringQuery, insertObject);
        dbHelper.executeQuery(stringQuery, callback);
    }
    else {
        return callback(null);
    }
};