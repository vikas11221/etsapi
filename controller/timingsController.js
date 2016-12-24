var timingsModel = require('../models/timingsModel');

exports.getDefaultBreakTime = function (req, res, next) {
    timingsModel.getDefaultBreakTime(req, function (err, result) {
        if (err) {
            next(err);
        }
        else {
            res.json(result);
        }
    });
}

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