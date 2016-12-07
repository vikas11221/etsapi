var lodash = require('lodash');


// define module

var businessHelper = {};
module.exports = businessHelper;

/**
 * The category class to represent business category.
 * @param {string} category - business category.
 * @param {string} subcategory - business subcategory.
 * @constructor
 */

function categoryForBusiness(category, subcategory) {
    this.categoryName = category;
    this.subcategoryName = subcategory;
}

/**
 * The businessTiming class to represent business timing.
 * @param {int} dayNo -day no of week
 * @param {time} openTime - business opening time.
 * @param {time} closeTime - business closing time.
 * @constructor
 */

function businessTiming(dayNo, openTime, closeTime) {
    this.forDay = dayNo;
    this.openingTime = openTime;
    this.closingTime = closeTime;
}

/**
 * The contactDetail class to represent business contact.
 * @param {object} 
 * @constructor
 */

function contactDetail(object, list) {
    this.emailId = object.email ? object.email : '';
    this.webUrl = object.websiteUrl ? object.websiteUrl : '';
    this.twitterUrl = object.twitterUrl ? object.twitterUrl : '';
    this.facebookUrl = object.faceBookUrl ? object.faceBookUrl : '';
    this.gPlusUrl = object.googlePlusUrl ? object.googlePlusUrl : '';
    if (lodash.findIndex(list, ['id', 32]) == -1) {
        this.webUrl = '';
    }
    if (lodash.findIndex(list, ['id', 64]) == -1) {
        this.twitterUrl = '';
        this.facebookUrl = '';
        this.gPlusUrl = '';
    }
}

/**
 * The menuDetail class to represent menu screen of mobile.
 * @param {string} emailId 
 * @param {string} phoneNo 
 * @param {string} webUrl 
 * @constructor
 */

function menuDetail(object) {
    this.shouldViewMenu = object.menuUrl ? true : false;
    this.menuUrl = object.menuUrl;
    this.shouldOrderOnline = object.onlineOrderUrl ? true : false;
    this.onlineUrl = object.onlineOrderUrl;
    this.shouldReservation = object.canReserve ? true : false;
    this.shouldCoupon = object.hasCoupons ? true : false;
}


/**
 * The businessTiming class to represent business timing.
 * @param {int} dayNo -day no of week
 * @param {time} openTime - business opening time.
 * @param {time} closeTime - business closing time.
 * @constructor
 */

function restriction(list, isProfile) {
    this.canReview = true;
    this.canUploadImage = isProfile;
}


function Location(object) {
    this.postalCode = object[0] ? object[0] : '';
    this.address = object[1] ? object[1] : '';
    this.locationName = object[2] ? object[2] : '';
    this.cityName = object[3] ? object[3] : '';
    this.phoneNo = object[4] ? object[4] : '';
    this.faxNo = object[5] ? object[5] : '';
    this.geoCode = (object[6] && object[7]) ? { 'lat': object[6], 'lng': object[7] } : { 'lat': '', 'lng': '' };
}

/**
 * Make list of categories from business detail
 * @param {object} - raw DataTable row
 */

var convertBusinessCategoryToList = function (object) {
    try {
        var categories = [];
        if (object.category1 && object.subcategory1) {
            categories.push(new categoryForBusiness(object.category1, object.subcategory1));
        }
        if (object.category2 && object.subcategory2) {
            categories.push(new categoryForBusiness(object.category2, object.subcategory2));
        }
        if (object.category3 && object.subcategory3) {
            categories.push(new categoryForBusiness(object.category3, object.subcategory3));
        }
    } catch (err) {
        throw new Error(err.message);
    }
    return categories;
};

/**
 * Make list of business timing from business detail
 * @param {object} - raw DataTable row
 */

var convertBusinessTimingsToList = function (object) {
    try {
        var timings = [];
        if (object.sundayOpening && object.sundayClosing) {
            timings.push(new businessTiming(0, object.sundayOpening, object.sundayClosing));
        }
        else {
            timings.push(new businessTiming(0, '', ''));
        }
        if (object.mondayOpening && object.mondayClosing) {
            timings.push(new businessTiming(1, object.mondayOpening, object.mondayClosing));
        }
        else {
            timings.push(new businessTiming(1, '', ''));
        }
        if (object.tuedayOpening && object.tuedayClosing) {
            timings.push(new businessTiming(2, object.tuedayOpening, object.tuedayClosing));
        }
        else {
            timings.push(new businessTiming(2, '', ''));
        }
        if (object.weddayOpening && object.weddayClosing) {
            timings.push(new businessTiming(3, object.weddayOpening, object.weddayClosing));
        }
        else {
            timings.push(new businessTiming(3, '', ''));
        }
        if (object.thsdayOpening && object.thsdayClosing) {
            timings.push(new businessTiming(4, object.thsdayOpening, object.thsdayClosing));
        }
        else {
            timings.push(new businessTiming(4, '', ''));
        }
        if (object.fridayOpening && object.fridayClosing) {
            timings.push(new businessTiming(5, object.fridayOpening, object.fridayClosing));
        }
        else {
            timings.push(new businessTiming(5, '', ''));
        }
        if (object.satdayOpening && object.satdayClosing) {
            timings.push(new businessTiming(6, object.satdayOpening, object.satdayClosing));
        }
        else {
            timings.push(new businessTiming(6, '', ''));
        }

    } catch (err) {
        throw new Error(err.message);
    }
    return timings;
};


var businessDetailResponse = function () {
    this.data = {
        'category': [],
        'imgUrls': [],
        'isFavourite': true,
        'menus': {},
        'operationalTimings': [],
        'menuImageUrls': [],
        'photoUrls': [],
        'videoUrls': [],
        'audioUrls': [],
        'paymentTypes': [],
        'reviews': [],
        'reviewsCount': 0,
        'coupons': [],
        'couponsCount': 0,
        'isMusicProfile': false,
        'rating': 0,
        'locations': []
    };
};

/**
 * 0 Business detail
 * 1 payment types
 * 2 profile option
 * 3 reviews count
 * 4 reviews
 * 5 coupons count
 * 6 coupons
 * 7 user uploaded review images
 */

/**
 * Make business business detail from Mysql result set
 * @param {array} - raw DataTable row
 */

businessHelper.convertBusinessDetail = function (result) {
    var dataTable = result[0][0];
    try {
        var businessDetail = new businessDetailResponse;
        businessDetail.data.operationalTimings = convertBusinessTimingsToList(dataTable);
        businessDetail.data.category = convertBusinessCategoryToList(dataTable);
        businessDetail.data.contactDetail = new contactDetail(dataTable, result[2] ? result[2] : []);
        businessDetail.data.menus = new menuDetail(dataTable);
        businessDetail.data.desc = dataTable.description ? dataTable.description : '';
        businessDetail.data.id = dataTable.id ? dataTable.id : '';
        businessDetail.data.isFavourite = (dataTable.customerLike == 0) ? false : true;
        businessDetail.data.businessType = 'Business';
        businessDetail.data.title = dataTable.title ? dataTable.title : '';
        businessDetail.data.timeZone = dataTable.timezone ? dataTable.timezone : '';
        businessDetail.data.businessLogo = dataTable.logoImg ? dataTable.logoImg : '';
        businessDetail.data.typeOfDishes = dataTable.mealType ? dataTable.mealType : '';
        businessDetail.data.priceRange = dataTable.priceRange ? dataTable.priceRange : '';
        businessDetail.data.isProfile = dataTable.isProfile ? true : false;
        businessDetail.data.primerVideoUrl = dataTable.isProfile && dataTable.primerVideoUrl ? dataTable.primerVideoUrl : '';
        businessDetail.data.rating = dataTable.rating ? dataTable.rating : 0;
        businessDetail.data.locations = businessHelper.extractAddress(dataTable.locationDetail);

        if (dataTable.isWeb) {
            businessDetail.data.canClaim = !businessDetail.data.isProfile && dataTable.canClaim ? true : false;
        }
        if (dataTable.businessMenuImages) {
            businessDetail.data.menuImageUrls = lodash.compact(lodash.split(dataTable.businessMenuImages, ','));

        }
        if (dataTable.businessImages) {
            businessDetail.data.imgUrls = lodash.compact(lodash.split(dataTable.businessImages, ','));

        }
        if (dataTable.videoUrls && dataTable.category1 != 'Music') {

            businessDetail.data.videoUrls = lodash.compact(lodash.split(dataTable.videoUrls, ','));
            if (lodash.findIndex(result[2] ? result[2] : [], ['id', 8]) == -1) {
                businessDetail.data.videoUrls = [];
            }
        }
        if (dataTable.videoUrls && dataTable.category1 == 'Music') {
            businessDetail.data.audioUrls = lodash.compact(lodash.split(dataTable.videoUrls, ','));
        }
        if (dataTable.category1 == 'Music') {
            businessDetail.data.isMusicProfile = true;
        }

        if (result[1]) {
            businessDetail.data.paymentTypes = result[1].map(function (object) {
                return (object.name);
            });
        }
        businessDetail.data.restrictions = new restriction(result[2], businessDetail.data.isProfile);
        businessDetail.data.reviewsCount = result[3][0].reviewCount;
        businessDetail.data.reviews = result[4] ? result[4] : [];
        businessDetail.data.couponsCount = result[5][0].couponCount ? result[5][0].couponCount : 0;
        businessDetail.data.coupons = result[6] ? result[6] : [];
        businessDetail.data.photoUrls = result[7] ? result[7] : [];
        businessDetail.data.headerImage = dataTable.headerImg ? dataTable.headerImg : '';
        return businessDetail;

    } catch (err) {
        throw new Error(err.message);
    }
};

/**
 * Make business list from Mysql results 
 * @param {array} - raw DataTable rows
 */

businessHelper.convertToBusinessList = function (dataTable) {
    var resultData = [];
    for (var index in dataTable) {
        var businessObject = {
            'title': dataTable[index].title,
            'id': dataTable[index].id,
            'desc': dataTable[index].description ? dataTable[index].description : '',
            'date': '',
            'category': [],
            'businessLogo': dataTable[index].logoImg,
            'rating': dataTable[index].rating,
            'menus': new menuDetail(dataTable[index]),
            'isProfile': dataTable[index].isProfile ? true : false,
            'locations': [],
            'primerUrl': dataTable[index].primerUrl,
            'isFavourite': (dataTable[index].customerLike == 0) ? false : true
        };
        businessObject.category = convertBusinessCategoryToList(dataTable[index]);
        businessObject.locations = businessHelper.extractAddress(dataTable[index].locationDetail);
        resultData.push(businessObject);
    }
    return resultData;
};


/**
 * Make location list from Mysql results 
 * @param {array} - raw DataTable rows
 */
businessHelper.extractAddress = function (locationDetail) {
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
