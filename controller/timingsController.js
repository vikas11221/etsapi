var timingsModel = require('../models/timingsModel');

/**
 * Public User signup controller
 * @request_type- POST
 * @url- /signup
 * @param {Object} req - express request.
 * @param {Object} res - express response.
 * @param {function} next - next middleware callback.
 */
exports.savetimings = function (req, res, next) {
    timingsModel.saveBreakTime(req, function (err, result, sessionId) {
        if (err) {
            next(err);
        }
        else {
            res.set('sessionId', sessionId).json(result);
        }
    });
};

exports.breaktimelist = function (req, res, next) {
    timingsModel.breaktimelist(req, function (err, result, sessionId) {
        if (err) {
            next(err);
        }
        else {
            res.set('sessionId', sessionId).json(result);
        }
    });
};

exports.changeIsApproved = function (req, res, next) {
    timingsModel.changeIsApproved(req, function (err, result) {
        if (err) {
            next(err);
        }
        else {
            res.set('sessionId', req.get('sessionId')).json(result);
        }
    });
};

exports.getTotalBreakTime = function (req, res, next) {
    timingsModel.getTotalBreakTime(req, function (err, result) {
        if (err) {
            next(err);
        }
        else {
            res.set('sessionId', req.get('sessionId')).json(result);
        }
    });
};