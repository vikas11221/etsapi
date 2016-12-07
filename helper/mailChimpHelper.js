var ApiException = require('../libs/core/ApiException');


var request = require('request');
var lodash = require('lodash');
var md5 = require('md5');
var async = require('async');
var moment = require('moment');

var mailChimpHelper = {};
module.exports = mailChimpHelper;



/**
 * Add subscriber in mailchimp list
 * @param {object} - requestObject (express request object)
 * @param {object} - mailChimpDetail (mailchimp user list)
 * @param {function(Error,object)} callback - callback function.
 */
mailChimpHelper.subscribe = function (requestObject, mailChimpDetail, categories, callback) {
    var obj = new SubscriptionObject(requestObject, mailChimpDetail.listId, categories);
    makeRequest(obj, mailChimpDetail.apiKey, callback);
};

/**
 * unSubscribe from mailchimp list
 * @param {object} - requestObject (express request object)
 * @param {object} - mailChimpDetail (mailchimp user list)
 * @param {function(Error,object)} callback - callback function.
 */
mailChimpHelper.unSubscribe = function (requestObject, mailChimpDetail, callback) {
    var obj = new UnSubscriptionObject(requestObject, mailChimpDetail.listId);
    makeRequest(obj, mailChimpDetail.apiKey, callback);
};

/**
 * unSubscribe from mailchimp list
 * @param {object} - mailChimpDetail (mailchimp user list)
 * @param {array} - oldCategories (old preferences list)
 * @param {array} - newCategories (new preferences list)
 * @param {function(Error,object)} callback - callback function.
 */
mailChimpHelper.changeSubscription = function (mailChimpDetail, oldCategories, newCategories, callback) {
    var obj = new ChangeSubscriptionObject(mailChimpDetail.email, mailChimpDetail.listId, oldCategories, newCategories);
    makeRequest(obj, mailChimpDetail.apiKey, callback);
};


/**
 * Configure mailchimp server and create list/interest areas/campigns for new server
 * If some attribute is missing then it creates that and updates in db
 * @param {string} - newApiKey (new key to update)
 * @param {object} - domainDetail (domain information)
 * @param {function(Error,object)} callback - callback function.
 */
mailChimpHelper.configureMailChimpServer = function (newApiKey, domainDetail, callback) {
    var cityName = domainDetail.cityName;
    async.waterfall([
        function (cb) {
            checkList(newApiKey, cityName, function (err, result) {
                return cb(err, result);
            });
        },
        function (listId, cb) {
            if (listId) {
                return cb(null, listId);
            }
            createNewList(newApiKey, cityName, cb);
        },
        function (listId, cb) {
            checkInterests(newApiKey, listId, function (err, result) {
                return cb(err, listId, result);
            });
        },
        function (listId, interestId, cb) {
            if (interestId) {
                return cb(null, listId, interestId);
            }
            createNewInterestCategory(newApiKey, listId, cb);
        },
        function (listId, interestId, cb) {
            checkInterestCategories(newApiKey, listId, interestId, function (err, result) {
                if (err) {
                    return cb(err);
                }
                return cb(null, listId, interestId, result);
            });
        },
        function (listId, interestId, categoryLists, cb) {
            var mailChimpDetail = {
                'listId': listId,
                'interestId': interestId,
                'categories': categoryLists,
                'campaignId': ''
            };
            return cb(null, mailChimpDetail);
        }
    ], callback);

};


/**
 * Create capign for city
 * @param {string} - apiKey (server api key)
 * @param {string} - listId (current city name)
 * @param {object} - domainDetail (domain information)
 * @param {function(Error,object)} callback - callback function.
 */
mailChimpHelper.createNewCampaign = function (apikey, listId, domainDetail, callback) {
    var gateway = lodash.split(apikey, '-', 2);
    var uri = 'https://' + gateway[1] + '.api.mailchimp.com/3.0/campaigns';
    request({
        url: uri,
        method: 'POST',
        json: {
            'recipients': {
                'list_id': listId
            },
            'type': 'regular',
            'settings': {
                'subject_line': domainDetail.cityName + 'NightOut-NewsLetter ' + moment().format('Do MMM YYYY'),
                'reply_to': domainDetail.email,
                'from_name': domainDetail.cityName + 'NightOut'
            }
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'apikey ' + apikey
        }
    }, function (err, result) {
        if (err || result.statusCode != 200) {
            return callback(ApiException.newInternalError(null));
        }
        return callback(null, result.body.id);
    });
};



/**
 * Update content in mailchimp server for a campaign
 * @param {object} - domainDetail (domain information)
 * @param {string} - contentToUpdate (html string content)
 * @param {function(Error,object)} callback - callback function.
 */
mailChimpHelper.updateContentInCampaign = function (apikey, campignId, contentToUpdate, callback) {
    var gateway = lodash.split(apikey, '-', 2);
    var uri = 'https://' + gateway[1] + '.api.mailchimp.com/3.0/campaigns/' + campignId + '/content';
    request({
        url: uri,
        method: 'PUT',
        json: {
            'html': contentToUpdate
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'apikey ' + apikey
        }
    }, function (err, result) {

        if (err || result.statusCode != 200) {
            return callback(ApiException.newInternalError(null));
        }
        return callback(null);
    });
};


mailChimpHelper.sendNewsletter = function (apikey, campignId, callback) {
    var gateway = lodash.split(apikey, '-', 2);
    var uri = 'https://' + gateway[1] + '.api.mailchimp.com/3.0/campaigns/' + campignId + '/actions/send';
    request({
        url: uri,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'apikey ' + apikey
        }
    }, function (err, result) {
        if (err) {
            return callback(ApiException.newInternalError(null));
        }
        return callback(null);
    });
};

/**
 * Make request to mailchimp server for update data
 * @param {string} - apiKey (server api key)
 * @param {object} - requestObject (mailchimp request object)
 * @param {function(Error,object)} callback - callback function.
 */

function makeRequest(requestObject, apiKey, callback) {
    var gateway = lodash.split(apiKey, '-', 2);
    var str = 'https://' + gateway[1] + '.api.mailchimp.com/3.0/lists/';
    requestObject['headers'] = {
        'Content-Type': 'application/json',
        'Authorization': 'apikey ' + apiKey
    };
    requestObject['uri'] = str + requestObject['uri'];
    request(requestObject, function (err, result) {
        if (err || result.statusCode != 200) {
            return callback(ApiException.newInternalError(null));
        }
        return (null);
    });
}


/**
 * Creates subscription object
 * @param {object} - userDetail (Subscriber detail)
 * @param {string} - listId (List id to add subscriber)
 * @param {array} - categories (preferences list)
 */
function SubscriptionObject(userDetail, listId, categories) {
    var str = listId + '/members';
    var intrests = {};

    for (var index in categories) {
        intrests[categories[parseInt(index)].gorupId] = true;
    }

    var userObject = {
        'email_address': userDetail.email,
        'status': 'subscribed',
        'merge_fields': {
            'FNAME': userDetail.firstName ? userDetail.firstName : '',
            'LNAME': userDetail.lastName ? userDetail.lastName : ''
        },
        'interests': intrests
    };
    this.method = 'POST';
    this.uri = str.toString();
    this.json = userObject;
}

/**
 * Creates unsubscription object
 * @param {object} - userDetail (Subscriber detail)
 * @param {string} - listId (List id to add subscriber)
 */
function UnSubscriptionObject(userDetail, listId) {
    var str = listId + '/members/' + md5(lodash.toLower(userDetail.email));
    this.method = 'DELETE';
    this.uri = str.toString();
}

/**
 * Creates subscription object
 * @param {string} - email (Subscriber email)
 * @param {string} - listId (List id to add subscriber)
 * @param {array} - oldCategories (old preferences list)
 * @param {array} - newCategories (new preferences list)
 */
function ChangeSubscriptionObject(email, listId, oldCategories, newCategories) {
    var str = listId + '/members/' + md5(lodash.toLower(email));
    var intrests = {};
    for (var index in oldCategories) {
        intrests[oldCategories[parseInt(index)].gorupId] = false;
    }
    for (var index1 in newCategories) {
        intrests[newCategories[parseInt(index1)].gorupId] = true;
    }
    var userObject = {
        'interests': intrests
    };
    this.method = 'PATCH';
    this.uri = str.toString();
    this.json = userObject;
}

/**
 * Check list existance for current city
 * @param {string} - apiKey (server api key)
 * @param {string} - cityName (current city name)
 * @param {function(Error,object)} callback - callback function.
 */
function checkList(apiKey, cityName, callback) {
    var gateway = lodash.split(apiKey, '-', 2);
    var uri = 'https://' + gateway[1] + '.api.mailchimp.com/3.0/lists';
    request({
        url: uri,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'apikey ' + apiKey
        }
    }, function (err, result) {
        if (err || result.statusCode != 200) {
            return callback(ApiException.newInternalError(null).addDetails('Provide a valid api key'));
        }
        var listsResult = JSON.parse(result.body);
        var lists = listsResult.lists;
        var index = lodash.findIndex(lists, { 'name': 'MyNightOut-' + cityName });
        if (index != -1) {
            return callback(null, lists[index].id);
        }
        return callback(null, null);
    });
}

/**
 * Check interest area for current list
 * @param {string} - apiKey (server api key)
 * @param {string} - listId (list id)
 * @param {function(Error,object)} callback - callback function.
 */
function checkInterests(apiKey, listId, callback) {
    var gateway = lodash.split(apiKey, '-', 2);
    var uri = 'https://' + gateway[1] + '.api.mailchimp.com/3.0/lists/' + listId + '/interest-categories';
    request({
        url: uri,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'apikey ' + apiKey
        }
    }, function (err, result) {
        if (err || result.statusCode != 200) {
            return callback(err);
        }
        var categoryResult = JSON.parse(result.body);
        var categories = categoryResult.categories;
        var index = lodash.findIndex(categories, { 'title': 'Category-Interests' });
        if (index != -1) {
            return callback(null, categories[index].id);
        }
        return callback(null, null);
    });
}


/**
 * Check  campaign for current list
 * @param {string} - apiKey (server api key)
 * @param {string} - listId (list id)
 * @param {string} - cityName (curret city name)
 * @param {function(Error,object)} callback - callback function.
 */
function checkCampaign(apiKey, listId, cityName, callback) {
    var gateway = lodash.split(apiKey, '-', 2);
    var uri = 'https://' + gateway[1] + '.api.mailchimp.com/3.0/campaigns?list_id=' + listId;
    request({
        url: uri,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'apikey ' + apiKey
        }
    }, function (err, result) {
        if (err || result.statusCode != 200) {

            return callback(err);
        }
        var campaignsResult = JSON.parse(result.body);
        var campaigns = campaignsResult.campaigns;
        var index = lodash.findIndex(campaigns, function (eachCampign) {
            return eachCampign.settings.subject_line == cityName + 'NightOut-NewsLetter';
        });
        if (index != -1) {
            return callback(null, campaigns[index].id);
        }
        return callback(null, null);
    });
}


/**
 * Check interset areas for current list
 * @param {string} - apiKey (server api key)
 * @param {string} - listId (list id)
 * @param {string} - inserestId (interest group id)
 * @param {function(Error,object)} callback - callback function.
 */
function checkInterestCategories(apiKey, listId, inserestId, callback) {
    var gateway = lodash.split(apiKey, '-', 2);
    var uri = 'https://' + gateway[1] + '.api.mailchimp.com/3.0/lists/' + listId + '/interest-categories/' + inserestId + '/interests';
    request({
        url: uri,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'apikey ' + apiKey
        }
    }, function (err, result) {
        if (err || result.statusCode != 200) {
            return callback(err);
        }
        var categoryResult = JSON.parse(result.body);
        var categories = categoryResult.interests;
        var exists = [];
        var notExists = [];
        db_categories.forEach(function (cat) {
            var index = lodash.findIndex(categories, { 'name': cat.name });
            if (index != -1) {
                exists.push({ 'groupId': categories[index].id, 'categoryId': cat.id });
            }
            else {
                notExists.push(cat);
            }
        });

        if (notExists.length) {
            createInterestCategories(apiKey, listId, inserestId, notExists, function (err, result) {
                if (err && !result) {
                    return callback(err);
                }
                var finalArray = lodash.concat(exists, result ? result : []);
                return callback(null, finalArray);
            });
        }
        else {
            return callback(null, exists);
        }
    });
}


/**
 * Create new interest categories
 * @param {string} - apiKey (server api key)
 * @param {string} - listId (list id)
 * @param {string} - inserestId (interest group id)
 * @param {array} - categories (categories list to create)
 * @param {function(Error,object)} callback - callback function.
 */
function createInterestCategories(apiKey, listId, inserestId, categories, callback) {
    var parallelArray = [];
    var resultArray = [];
    categories.forEach(function (cat) {
        var fnc = function (cb) {
            var gateway = lodash.split(apiKey, '-', 2);
            var uri = 'https://' + gateway[1] + '.api.mailchimp.com/3.0/lists/' + listId + '/interest-categories/' + inserestId + '/interests';
            request({
                url: uri,
                method: 'POST',
                json: {
                    'name': cat.name
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'apikey ' + apiKey
                }
            }, function (err, result) {
                if (err || result.statusCode != 200) {
                    return cb(ApiException.newInternalError(null));
                }
                else {
                    resultArray.push({ 'groupId': result.body.id, 'categoryId': cat.id });
                    return cb(null, result);
                }
            });
        };
        parallelArray.push(fnc);
    });
    async.parallel(parallelArray, function (err) {
        callback(err, resultArray);
    });

}


/**
 * Create new group
 * @param {string} - apiKey (server api key)
 * @param {string} - listId (list id)
 * @param {function(Error,object)} callback - callback function.
 */
function createNewInterestCategory(apikey, listId, callback) {
    var gateway = lodash.split(apikey, '-', 2);
    var uri = 'https://' + gateway[1] + '.api.mailchimp.com/3.0/lists/' + listId + '/interest-categories';
    request({
        url: uri,
        method: 'POST',
        json: {
            'title': 'Category-Interests',
            'type': 'checkboxes'
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'apikey ' + apikey
        }
    }, function (err, result) {
        if (err || result.statusCode != 200) {
            return callback(ApiException.newInternalError(null));
        }
        return callback(null, listId, result.body.id);
    });
}

/**
 * Create list for current city
 * @param {string} - apiKey (server api key)
 * @param {string} - cityName (current city name)
 * @param {function(Error,object)} callback - callback function.
 */
function createNewList(apikey, cityName, callback) {
    var gateway = lodash.split(apikey, '-', 2);
    var uri = 'https://' + gateway[1] + '.api.mailchimp.com/3.0/lists';
    var name = 'MyNightOut-' + cityName;
    request({
        url: uri,
        method: 'POST',
        json: {
            'name': name,
            'contact': {
                'company': 'Optimal Media',
                'address1': 'Testing address',
                'address2': 'testing 2',
                'city': 'Atlanta',
                'state': 'GA',
                'zip': '30308',
                'country': 'US',
                'phone': ''
            },
            'permission_reminder': 'You\'\'\'re receiving this email because you signed up for testing the list.',
            'email_type_option': true
            , 'campaign_defaults': {
                'from_name': 'Sachin',
                'from_email': 'sachin.mehndiratta@daffodilsw.com',
                'subject': 'Testing',
                'language': 'en'
            }
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'apikey ' + apikey
        }
    }, function (err, result) {
        if (err || result.statusCode != 200) {
            return callback(ApiException.newInternalError(null));
        }
        return callback(null, result.body.id);
    });
}



/**
 * content of db_categories in database
 */
var db_categories = [
    {
        'id': 1,
        'name': 'Restaurants'
    },
    {
        'id': 2,
        'name': 'Bars'
    },
    {
        'id': 3,
        'name': 'Entertainment'
    },
    {
        'id': 4,
        'name': 'Music'
    },
    {
        'id': 5,
        'name': 'Lodging'
    },
    {
        'id': 6,
        'name': 'Extra'
    }
];