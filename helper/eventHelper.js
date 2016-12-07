var lodash = require('lodash');


// define module

var eventHelper = {};
module.exports = eventHelper;

/**
 * The contactDetail class to represent business contact.
 * @param {string} emailId 
 * @param {string} phoneNo 
 * @param {string} webUrl 
 * @constructor
 */

function contactDetail(object) {
    this.emailId = object.email ? object.email : '';
    this.webUrl = object.websiteUrl ? object.websiteUrl : '';
}

function Location(object) {
    this.postalCode = object[0] ? object[0] : '';
    this.address = object[1] ? object[1] : '';
    this.locationName = object[2] ? object[2] : '';
    this.cityName = object[3] ? object[3] : '';
    this.phoneNo = object[4] ? object[4] : '';
    this.geoCode = (object[5] && object[6]) ? { 'lat': object[5], 'lng': object[6] } : { 'lat': '', 'lng': '' };
}

function Timings(object) {
    this.startDate = object.actualStartDate;
    this.endDate = object.actualEndDate;
    this.startTime = object.startTime;
    this.endTime = object.endTime;
    this.repeatCount = object.repeatCount;
    this.weekDay = object.weekDay;
    this.repeatId = object.eventRepeatType;
}

eventHelper.convertEventDetail = function (result) {

    var detail = result[0][0];
    var eventDetail = {};
    try {
        eventDetail.businessType = 'Event';
        eventDetail.title = detail.title ? detail.title : '';
        eventDetail.timeZone = detail.timezone ? detail.timezone : '';
        eventDetail.contactDetail = new contactDetail(detail);
        eventDetail.desc = detail.description ? detail.description : '';
        eventDetail.businessName = detail.businessTitle ? detail.businessTitle : '';
        eventDetail.businessId = detail.businessId;
        eventDetail.logo = detail.imgUrl ? detail.imgUrl : '';
        eventDetail.date = detail.startDate;
        eventDetail.startTime = detail.startTime ? detail.startTime : '';
        eventDetail.endTime = detail.endTime ? detail.endTime : '';
        eventDetail.videoUrl = detail.video ? detail.video : '';
        eventDetail.videoUrl2 = detail.video2 ? detail.video2 : '';
        eventDetail.shouldTicket = detail.requireTicket && detail.tickets ? true : false;
        eventDetail.ticketUrl = detail.tickets ? detail.tickets : '';
        eventDetail.locations = eventHelper.extractAddress(detail.locations);
        eventDetail.categories = lodash.trim(detail.eventCategories);
        eventDetail.isProfile = detail.isProfile ? true : false;
        eventDetail.imgUrls = [];
        if (detail.eventImages) {
            eventDetail.imgUrls = lodash.compact(lodash.split(detail.eventImages, ';'));
        }
        eventDetail.isDailyEvent = detail.eventRepeatType == 1 ? true : false;
        eventDetail.timings = '';
        if (detail.isOutside) {
            eventDetail.locations[0].address = detail.address2;
        }
        switch (detail.eventRepeatType) {
            case 2:
                eventDetail.timings = 'This event repeats every week on ';
                break;
            case 3:
                eventDetail.timings = 'This event repeats on every month from ';
                break;
            case 4:
                eventDetail.timings = 'This event repeats on every month from ';
                break;
            case 5:
                eventDetail.timings = 'This event repeats on every year from ';
                break;
            case -1:
                eventDetail.timings = 'This event is from ';
                break;
            default: eventDetail.timings = '';
        }
        if (detail.eventRepeatType != 1 && detail.message) {
            eventDetail.timings = eventDetail.timings + detail.message;
        }
        eventDetail['eventTimings'] = new Timings(detail);
        return eventDetail;
    } catch (err) {
        throw new Error(err.message);
    }
};




/**
 * Make event list from Mysql results 
 * @param {array} - raw DataTable rows
 */

eventHelper.convertToEventList = function (dataTable) {
    var resultData = [];
    for (var index in dataTable) {
        var eventObject = dataTable[index];
        eventObject.locations = eventHelper.extractAddress(dataTable[index].locations);
        resultData.push(eventObject);
    }
    return resultData;
};


/**
 * Make location list from Mysql results 
 * @param {array} - raw DataTable rows
 */
eventHelper.extractAddress = function (locationDetail) {
    var locationResult = [];
    if (lodash.isString(locationDetail)) {
        var locations = lodash.split(locationDetail, '!@');
        if (lodash.isArray(locations)) {
            locations.forEach(function (object) {
                var singleLocationDetail = lodash.split(object, '$#@');
                locationResult.push(new Location(singleLocationDetail));
            });
        }
    }
    return locationResult;
};