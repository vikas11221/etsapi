var userModel = require('../models/userModel');

/**
 * Update profile controller
 * @request_type- PATCH
 * @url- /secure/user/
 * @param {Object} req - express request.
 * @param {Object} res - express response.
 * @param {function} next - next middleware callback.
 */
exports.getUserDetail = function (req, res, next) {
    userModel.getdetail(req,function (err,result) {
        if (err) {
            next(err);
        }
        else {
            res.json(result);
        }
    })
};

exports.updateProfile = function (req, res, next) {
    userModel.editProfile(req, function (err, result) {
        if (err) {
            next(err);
        }
        else {
            res.json(result);
        }
    });
};
/**
 * Upload profile picture
 * @request_type- POST
 * @url- /secure/user/profilepicture
 * @param {Object} req - express request.
 * @param {Object} res - express response.
 * @param {function} next - next middleware callback.
 */

exports.uploadPic = function (req, res, next) {
    userModel.uploadProfilePic(req, function (err, result) {
        if (err) {
            next(err);
        }
        else {
            res.json(result);
        }
    });
};

/**
 * Check artist profile
 * @request_type- POST
 * @url- /secure/user/isartist
 * @param {Object} req - express request.
 * @param {Object} res - express response.
 * @param {function} next - next middleware callback.
 */

exports.isArtist = function (req, res, next) {
    userModel.isArtist(req, function (err, result) {
        if (err) {
            next(err);
        }
        else {
            res.json(result);
        }
    });
};