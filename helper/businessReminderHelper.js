var dbNames = require('../assets/dbNames');
var dbHelper = require('../helper/dbHelper');
var logger = require('../libs/logger');
// var mailer = require('../notify/mailNotifier');

var mysql = require('mysql');

// Send business expiry reminder email

module.exports = function sendReminder() {
    console.log('Cron-job for business reminder started');
    var sql = 'CALL ?? ();';
    var parameters = [dbNames.sp.businessReminder];
    sql = mysql.format(sql, parameters);
    dbHelper.executeQueryPromise(sql).then(function (result) {
        if (result[0].length) {
            result[0].forEach(function (business) {
                business['subject'] = 'Business Expiry Reminder';
                mailer.sendBusinessReminder(business.email, business, 1);
                if (business.licenseeEmail) {
                    mailer.sendBusinessReminder(business.licenseeEmail, business, 2);
                }
            });
        }
        if (result[1].length) {
            result[1].forEach(function (business) {
                business['subject'] = 'Business Expiry Reminder';
                mailer.sendBusinessReminder(business.email, business, 3);
                if (business.licenseeEmail) {
                    mailer.sendBusinessReminder(business.licenseeEmail, business, 4);
                }
            });
        }
    }, function (error) {
        logger.info(error.message);
    });
};