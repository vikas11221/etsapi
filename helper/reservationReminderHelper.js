var dbNames = require('../assets/dbNames');
var dbHelper = require('../helper/dbHelper');
var logger = require('../libs/logger');
var pushNotifier = require('../notify/pushNotifier');


var mysql = require('mysql');

//Send reminder for reservation
module.exports = function sendReminder() {
    console.log('Cron-job for reservation reminder started');
    var sql = 'CALL ?? ();';
    var parameters = [dbNames.sp.reservationReminder];
    sql = mysql.format(sql, parameters);
    dbHelper.executeQueryPromise(sql).then(function (result) {
        if (result[0].length) {
            var reservations = result[0];
            createNotificationParams(reservations);
        }
        else {
            logger.info('No notification available to send');
        }

    }, function (error) {
        logger.info(error.message);
    });
};

/**
 * Create notification object for each reservations
 * @param {array} list of reservations to send reminder
 */
function createNotificationParams(reservations) {
    var webNotificationList = [];
    try {
        reservations.forEach(function (object) {
            var message = 'Hi ' + object.firstName
                + ' you have reservation at '
                + object.businessTitle
                + ' at ' + object.reservationTime;
            var notificationObject = {
                'pushObject': {
                    'toUser': object.userId,
                    'notificationType': 1,
                    'message': message,
                    'contentId': object.Id,
                    'domainId': object.domainId
                },
                'deviceInformation': {
                    'deviceId': object.deviceId,
                    'deviceType': object.deviceType
                }
            };
            if (object.deviceType && object.deviceId) {
                sendPushReminder(notificationObject);
            }
            webNotificationList.push([object.userId, object.domainId, 1, object.Id, object.businessId, message]);
        });
    } catch (error) {
        logger.info(error.message);
    }
    insertMultipleWebNotification(webNotificationList);
}


/**
 * Send single push-notification
 * @param {object} push-notification object
 */
function sendPushReminder(notificationObject) {
    var gcm = notificationObject.deviceInformation.deviceType == 2 ? [notificationObject.deviceInformation.deviceId] : [];
    var apn = notificationObject.deviceInformation.deviceType == 1 ? [notificationObject.deviceInformation.deviceId] : [];
    pushNotifier.sendPush(gcm, apn, notificationObject.pushObject, function () { });
}


/**
 * Save multiple entry in notification table
 * @param {Array} insertObjects -objects to save in db
 */
function insertMultipleWebNotification(insertObjects) {
    var stringQuery = 'INSERT INTO db_notification (toUser,domainId,notificationType,contentId,businessId,message) VALUES ?';
    stringQuery = mysql.format(stringQuery, [insertObjects]);
    dbHelper.executeQuery(stringQuery, function (err) {
        if (err) {
            logger.error(err.message);
        }
    });
}