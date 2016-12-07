var dbNames = require('../assets/dbNames');
var dbHelper = require('../helper/dbHelper');
var logger = require('../libs/logger');
var notificationModel_Admin = require('../models/notificationModel-Admin');
var pushNotifier = require('../notify/pushNotifier');


var mysql = require('mysql');
var lodash = require('lodash');

module.exports = function sendNotification() {
    console.log('Cron-job for scheduled notification started');

    // Check for admin notification
    sendAdminNotification();

    // Check for business owner notification
    var sql = 'CALL ?? ();';
    var parameters = [dbNames.sp.scheduledNotification];
    sql = mysql.format(sql, parameters);
    dbHelper.executeQueryPromise(sql).then(function (result) {
        if (result[0].length && result[1].length) {
            var lastId = 0;
            var currentBusiness = {};
            var insertObjects = [];
            try {
                for (var index in result[1]) {
                    if (result[1][index].id != lastId) {
                        if (!lodash.isEmpty(currentBusiness)) {
                            console.log(currentBusiness);
                            pushNotifier.sendPush(currentBusiness['gcm'], currentBusiness['apn'], currentBusiness['pushObject'], function () { });
                        }
                        currentBusiness = {};
                        currentBusiness['pushObject'] = {
                            'toUser': 0,
                            'notificationType': 5, //notification type for custom notification
                            'message': result[1][index].message + ' by- ' + result[1][index].title,
                            'contentId': result[1][index].businessId,
                            'domainId': result[1][index].domainId
                        };
                        currentBusiness['apn'] = [];
                        currentBusiness['gcm'] = [];
                    }
                    if (result[1][index].deviceType == 2 && result[1][index].deviceId)
                        currentBusiness['gcm'].push(result[1][index].deviceId);
                    if (result[1][index].deviceType == 1 && result[1][index].deviceId)
                        currentBusiness['apn'].push(result[1][index].deviceId);
                    insertObjects.push([result[1][index].userId, result[1][index].domainId, 5, result[1][index].businessId, result[1][index].message + ' by- ' + result[1][index].title]);
                    lastId = result[1][index].id;
                }
            } catch (error) {
                logger.error(error.message);
                return;
            }
            insertMultipleNotification(insertObjects);
            if (!lodash.isEmpty(currentBusiness)) {
                console.log(currentBusiness);
                pushNotifier.sendPush(currentBusiness['gcm'], currentBusiness['apn'], currentBusiness['pushObject'], function () { });
            }
        }
        else {
            logger.info('No scheduled notification available to send from business owners');
        }
    }, function (error) {
        logger.error(error.message);
    });
};


/**
 * Save multiple entry in notification table
 * @param {Array} insertObjects -objects to save in db
 */
var insertMultipleNotification = function (insertObjects) {
    var stringQuery = 'INSERT INTO db_notification (toUser,domainId,notificationType,contentId,message) VALUES ?';
    stringQuery = mysql.format(stringQuery, [insertObjects]);
    dbHelper.executeQuery(stringQuery, function (err) {
        if (err) {
            logger.error(err.message);
        }
    });
};

/**
 * Call admin
 */
var sendAdminNotification = function () {
    var sql = 'CALL ?? ();';
    var parameters = [dbNames.sp.scheduledNotificationAdmin];
    sql = mysql.format(sql, parameters);
    dbHelper.executeQueryPromise(sql).then(function (result) {
        if (result[0].length) {
            result[0].forEach(function (item) {
                notificationModel_Admin.sendNotificationToAll(item.message);
            });
        }
        else {
            logger.info('No scheduled notification available to send from admin');
        }
    });
};