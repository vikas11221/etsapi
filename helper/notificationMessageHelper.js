var api_events = require('../assets/api_events');
var logger = require('../libs/logger');

var lodash = require('lodash');


//Message builder for various notification events

module.exports = function (code, object) {
    this.message = '';
    switch (code) {

        case api_events.reservation_changed.event_code:
            this.message = 'Hi '
                + checkString(object.customerName)
                + ', your reservation for '
                + checkString(object.reservationDateTime)
                + ' has been '
                + checkString(object.reservationStatusName)
                + ' by '
                + checkString(object.title)
                + '.';
            break;

        case api_events.custom_notification_business.event_code:
            this.message = object.message
                + ' By- '
                + object.businessTitle
                + '.';
            break;

        case api_events.coupon_created.event_code:
            this.message = 'New coupon '
                + object.title
                + ' has been added by '
                + object.businessTitle
                + '. Expires on: '
                + object.expireDate
                + '. Hurry Up.';
            break;

        case api_events.event_created.event_code:
            this.message = 'New event '
                + object.title
                + ' created by '
                + object.businessTitle;
            break;

        case api_events.special_created.event_code:
            this.message = 'New special '
                + object.title
                + ' created by '
                + object.businessTitle;
            break;

        default: logger.error('Notification Message Helper', 'event_code not implemented');
    }
};

//Check undefined or null values

var checkString = function (string) {
    if (lodash.isString(string)) {
        return string;
    }
    return '';
};