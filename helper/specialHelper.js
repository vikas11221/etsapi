var lodash = require('lodash');

// define module

var specialHelper = {};
module.exports = specialHelper;

/**
 * The contactDetail class to represent business contact.
 * @param {string} emailId 
 * @param {string} phoneNo 
 * @param {string} webUrl 
 * @constructor
 */

function contactDetail(object) {
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

specialHelper.convertSpecialDetail = function (result) {
    var detail = result[0][0];
    var specialDetail = {};
    try {
        specialDetail.businessType = 'Special';
        specialDetail.title = detail.title ? detail.title : '';
        specialDetail.timeZone = detail.timezone ? detail.timezone : '';
        specialDetail.contactDetail = new contactDetail(detail);
        specialDetail.desc = detail.description ? detail.description : '';
        specialDetail.businessName = detail.businessTitle ? detail.businessTitle : '';
        specialDetail.businessId = detail.businessId;
        specialDetail.logo = detail.imgUrl ? detail.imgUrl : '';
        specialDetail.date = detail.startDate;
        specialDetail.startTime = detail.startTime ? detail.startTime : '';
        specialDetail.endTime = detail.endTime ? detail.endTime : '';
        specialDetail.videoUrl = detail.video ? detail.video : '';
        specialDetail.videoUrl2 = detail.video2 ? detail.video2 : '';
        specialDetail.isDailyEvent = false;
        specialDetail.locations = specialHelper.extractAddress(detail.locations);
        specialDetail.isDailyEvent = detail.specialRepeatType == 1 ? true : false;
        specialDetail.categories = lodash.trim(detail.specialCategories);
        specialDetail.isProfile = detail.isProfile ? true : false;
        specialDetail.timings = '';
        if (detail.isOutside) {
            specialDetail.locations[0].address = detail.address2;
        }

        switch (detail.specialRepeatType) {
            case 2:
                specialDetail.timings = 'This special repeats every week on ';
                break;
            case 3:
                specialDetail.timings = 'This special repeats on every month from ';
                break;
            case 4:
                specialDetail.timings = 'This special repeats on every month from ';
                break;
            case 5:
                specialDetail.timings = 'This special repeats on every year from ';
                break;
            case -1:
                specialDetail.timings = 'This special is from ';
                break;
            default: specialDetail.timings = '';
        }
        if (detail.specialRepeatType != 1 && detail.message) {
            specialDetail.timings = specialDetail.timings + detail.message;
        }
        return specialDetail;
    } catch (err) {
        throw new Error(err.message);
    }
};

/**
 * Make location list from Mysql results 
 * @param {array} - raw DataTable rows
 */
specialHelper.extractAddress = function (locationDetail) {
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


/**
 * Make special list from Mysql results 
 * @param {array} - raw DataTable rows
 */

specialHelper.convertToSpecialList = function (dataTable) {
    var resultData = [];
    for (var index in dataTable) {
        var eventObject = dataTable[index];
        eventObject.locations = specialHelper.extractAddress(dataTable[index].locations);
        resultData.push(eventObject);
    }
    return resultData;
};