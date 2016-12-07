var ApiException = require('../libs/core/ApiException');
var dbNames = require('../assets/dbNames');
var dbHelper = require('../helper/dbHelper');
var eventModel = require('../models/eventModel');
var specialModel = require('../models/specialModel');
var responseModel = require('../assets/responseModel');


var parse = require('csv-parse');
var fs = require('fs');
var async = require('async');
var mysql = require('mysql');
var mime = require('mime');
var moment = require('moment');

var importEvents = {};
module.exports = importEvents;



/**
 * Import events.
 * @param {object} - req (express request object)
 * @param {function(Error,object)} callback - callback function.
 */
importEvents.importEvents = function (req, callback) {
    importData(req, true, function (err, totalRecord, errorRecord) {
        createImportResponse(err, totalRecord, errorRecord, callback);
    });
};


/**
 * Import events.
 * @param {object} - req (express request object)
 * @param {function(Error,object)} callback - callback function.
 */
importEvents.importSpecials = function (req, callback) {
    importData(req, false, function (err, totalRecord, errorRecord) {
        createImportResponse(err, totalRecord, errorRecord, callback);
    });
};

/**
 * Import events.
 * @param {object} - req (express request object)
 * @param {function(Error,object)} callback - callback function.
 */
var importData = function (req, isEvent, callback) {
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
            importToDB(csvArray, isEvent).then(function (result) {
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

/**
 * Validate event object for each rows.
 * @param {array} - excel rows
 * @param {function(Error,object)} callback - callback function.
 */
var validateJSON = function (array, callback) {
    var resultSet = [];
    array.forEach(function (rows, index) {
        if (rows.length == 10 && index != 0) {
            resultSet.push(rows);
        }
    });
    if (!resultSet.length) {
        return callback(ApiException.newBadRequestError(null).addDetails('Invalid CSV file format'));
    }
    return callback(null, resultSet);
};

/**
 * Import rows into database
 * @param {array} - excel rows
 */
var importToDB = function (rows, isEvent) {
    return new Promise(function (resolve, reject) {
        var promiseArray = [];
        rows.forEach(function (row) {
            promiseArray.push(importSingleData(row, isEvent));
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

/**
 * Import single row into database
 * @param {object} - excel row
 */
var importSingleData = function (object, isEvent) {
    return new Promise(function (resolve, reject) {
        var domainDetail = {};
        async.series([
            function (cb) {
                validateDbfields(object, isEvent, function (err, result) {
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
                if (isEvent) {
                    insertEventData(object, domainDetail, cb);
                }
                else {
                    insertSpecialData(object, domainDetail, cb);
                }

            }
        ], function (err) {
            if (err) {
                resolve({ 'isError': true });
            }
            else {
                resolve({ 'isError': false });
            }
        });

    });
};

/**
 * Import validate fields in database
 * @param {object} - excel row
 * @param {function(Error,object)} callback - callback function.
 */
var validateDbfields = function (fieldArray, isEvent, callback) {
    var sql = 'CALL ?? ( ?,?,?,?,?)';
    var parameters = [dbNames.sp.importEventsFieldCheck,
        fieldArray[0],
        fieldArray[2],
        fieldArray[3],
        fieldArray[4],
        isEvent
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

/**
 * Insert single using event model
 * @param {object} - excel row
 * @param {object} - database information
 * @param {function(Error,object)} callback - callback function.
 */
var insertEventData = function (row, domainDetail, callback) {
    var eventObject = createInsertObject(row, domainDetail, true);
    if (domainDetail.lat && domainDetail.lng) {
        eventObject.body.locations[0]['lat'] = domainDetail.lat.toString();
        eventObject.body.locations[0]['lng'] = domainDetail.lng.toString();
    }
    eventModel.createEvent(eventObject, callback);
};


/**
 * Insert single using special model
 * @param {object} - excel row
 * @param {object} - database information
 * @param {function(Error,object)} callback - callback function.
 */
var insertSpecialData = function (row, domainDetail, callback) {
    var eventObject = createInsertObject(row, domainDetail, false);
    if (domainDetail.lat && domainDetail.lng) {
        eventObject.body.locations[0]['lat'] = domainDetail.lat.toString();
        eventObject.body.locations[0]['lng'] = domainDetail.lng.toString();
    }
    specialModel.createSpecial(eventObject, callback);
};


var createInsertObject = function (row, domainDetail, isEvent) {

    var startTime = null;
    var endTime = null;

    if (row[6]) {
        startTime = moment('01/01/2016 ' + row[6]);
        startTime = startTime.isValid() ? startTime.format('HH:mm') : null;
    }

    if (row[8]) {
        endTime = moment('01/01/2016 ' + row[8]);
        endTime = endTime.isValid() ? endTime.format('HH:mm') : null;
    }

    var objectToInsert = {
        'body': {
            'domainId': domainDetail.domainId,
            'businessId': domainDetail.businessId,
            'repeatId': 0,
            'categoryId1': domainDetail.categoryId,
            'subcategoryId1': domainDetail.subcategoryId,
            'title': row[1],
            'description': row[9],
            'startDate': row[5],
            'startTime': startTime,
            'endDate': row[7],
            'endTime': endTime,
            'locations': [
                {
                    'locationId': domainDetail.locationId,
                    'cityId': domainDetail.cityId,
                    'address': domainDetail.address ? domainDetail.address : '',
                    'locationOrder': 1,
                    'phoneNo': domainDetail.phoneNo
                }
            ],
            'requireTicket': true,
            'imgUrl': domainDetail.logoImg
        }
    };
    return objectToInsert;
};

var createImportResponse = function (err, totalRecord, errorRecord, callback) {
    if (err) {
        return callback(err);
    }
    var successFullRecords = totalRecord - errorRecord;
    var response = new responseModel.objectResponse();
    response.data['success'] = successFullRecords ? successFullRecords : 0;
    response.data['totalRecords'] = totalRecord;
    response.message = 'Out of ' + totalRecord + ' records, ' + successFullRecords + ' recocrds uploaded successfully.';
    return callback(err, response);
};