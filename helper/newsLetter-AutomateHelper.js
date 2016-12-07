var dbHelper = require('../helper/dbHelper');
var ApiException = require('../libs/core/ApiException');
var dbNames = require('../assets/dbNames');
var logger = require('../libs/logger');
var mailChimpHelper = require('../helper/mailChimpHelper');
var domainDetail = require('../models/commonModel').getDomainDetail;
var businessHelper = require('../helper/businessHelper');


var async = require('async');
var mysql = require('mysql');

/**
 * Send automated newsletter
 */

var automateNewsLetter = function (callback) {
    // callback(null, 'hi');
    // var SQL = 'SELECT * FROM ?? WHERE ??=?';
    // var inserts = ['db_mailchimp_api_keys', 'isDeleted', false];
    // SQL = mysql.format(SQL, inserts);
    // dbHelper.executeQuery(SQL, function (err, result) {
    //     if (err) {
    //         logger.error(err);
    //     }
    //     else if (result.length) {
    //         var regex = /^[0-9a-z]{32}(-us)(0?[1-9]|1[0-3])?$/;
    //         result.forEach(function (domain) {
    //             if (domain.apiKey && regex.test(domain.apiKey) && domain.domainId) {
    //                 if (domain.domainId == 1)
    //                     sendNewsLetter(domain);
    //             }
    //         });
    //     }
    //     else {
    //         logger.info('No domain found to send notification');
    //     }
    // });
    createNewsLetterContent({ domainId: 1 }, callback);
};

/**
 * Send News letter for a single domain
 * @param {Object} domainInformation - domain information.
 */
function sendNewsLetter(domainInformation) {
    var cityInformaton = {};
    var campaignId = '';
    async.waterfall([
        function (cb) {
            domainDetail({ 'params': { 'domainId': domainInformation.domainId } }, function (err, result) {
                if (err) {
                    return cb(err);
                }
                cityInformaton = result.data;
                return cb(null);
            });
        },
        function (cb) {
            // mailChimpHelper.createNewCampaign(domainInformation.apiKey, domainInformation.listId, cityInformaton, cb);
            return cb(null, '9dd0460116');
        },
        function (newCampaignId, cb) {
            campaignId = newCampaignId;
            createNewsLetterContent(domainInformation, cb);
        },
        function (content, cb) {
            mailChimpHelper.updateContentInCampaign(domainInformation.apiKey, campaignId, content, function (err) {
                if (err) {
                    return cb(err);
                }
                else return cb(null);
            });
        },
        // function (cb) {
        //     mailChimpHelper.sendNewsletter(domainInformation.apiKey, campaignId, cb);
        // }
    ], function (err) {
        if (err) {
            logger.error(err);
        }
    });
}

/**
 * Create html for news letter of a domain
 * @param {Object} domainInformation - domain information.
 * @param {function(Error,object)} callback - callback function.
 */
function createNewsLetterContent(domainInformation, callback) {
    var sql = 'CALL sp_newsletter_content (?);';
    var parameters = [domainInformation.domainId];
    sql = mysql.format(sql, parameters);
    var html = '<!DOCTYPE html>' +
        '<html><head><title></title></head><body>'
        + ' <link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">'
        + '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>'
        + '<script src="http://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>'
        + '<style>.box{min-height:145px;border: 1px solid #2277dd;border-radius: 12px;padding:10px;}</style>'

        + '<div class=\"container\">';

    dbHelper.executeQueryPromise(sql).then(function (result) {
        html = html + '<div class="row">';

        //Blogs--------------
        if (result[0].length) {
            html = html + '<h3>Hot topics</h3><hr/>';
        }
        result[0].forEach(function (blog) {
            var singleBlog = '';
            singleBlog = '<div class="col-md-4" style="margin-bottom:10px">' +
                '<div class="box"><h4>' + blog.title + '</h4 >'
                + '<p>' + blog.blogText
                + '<a target="_blank" href="http://' + blog.url + '/#/blog/' + blog.id + '">  view more</a>'
                + '</p >'
                + '</div></div>';
            html = html + singleBlog;
        });
        html = html + '</div>';
        html = html + '<div class="row">';


        //Coupons-----------
        if (result[1].length) {
            html = html + '<h3>Coupons</h3><hr/>';
        }
        result[1].forEach(function (coupon) {
            var singleCoupon = '';
            singleCoupon = '<div class="col-md-4" style="margin-bottom:10px">' +
                '<div class="box"><h4>' + coupon.title + '</h4 >'
                + '<p>at- ' + coupon.businessName + '</p>'
                + '<p>' + coupon.couponDetail
                + '</p >'
                + '<p>Expires on ' + coupon.expireDate + '</p>'
                + '</div></div>';
            html = html + singleCoupon;
        });
        html = html + '</div>';
        html = html + '<div class="row">';

        //businesses---------------------
        if (result[2].length) {
            html = html + '<h3>Business Profiles</h3><hr/>';
        }
        result[2].forEach(function (business) {
            business.locationDetail = businessHelper.extractAddress(business.locationDetail);
            console.log(business.locationDetail);
            var singlebusiness = '';
            singlebusiness = '<div class="col-md-4" style="margin-bottom:10px">' +
                '<div class="box"><h4>'
                + '<a target="_blank" href="http://' + business.url + '/#/businessdetail/' + business.businessId + '">'
                + business.title
                + '</a></h4 >'
                + '<img src="' + business.logoImg + '" style="width:100px;height:100px;"></img>'
                + '<p>Category- ' + business.category1
                + '</p >'
                + '<p>Subcategory- ' + business.subcategory1 + '</p>'
                + '<p>Address- ' + business.locationDetail[0].address
                + ' ' + business.locationDetail[0].locationName + ' ' + business.locationDetail[0].cityName
                + '</p>'
                + '<p>Phone No- ' + business.locationDetail[0].phoneNo + '</p>'
                + '</div></div>';
            html = html + singlebusiness;
        });

        html = html + '</div>';
        html = html + '</div></body></html>';
        callback(null, html);
    }).catch(function (error) {
        return callback(error);
    });
}


module.exports = automateNewsLetter;