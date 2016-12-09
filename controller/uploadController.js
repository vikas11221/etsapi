var uploadModel = require('../models/userModel');


/**
 * Upload multiple file controller
 * @request_type- POST
 * @url- /secure/upload/multiple
 * @param {Object} req - express request.
 * @param {Object} res - express response.
 * @param {function} next - next middleware callback.
 */

exports.uploadMultiple = function (req, res, next) {
    uploadModel.uploadMultiple(req, function (err, result) {
        if (err) {
            next(err);
        }
        else {
            res.json(result);
        }
    });
};