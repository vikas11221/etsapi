/**
 * Created by daffodil on 28/11/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var dbHelper = require("../helper/dbHelper");
var moment = require('moment');

// define module
var model = {};
module.exports = model;

var UserSchema = new Schema({
    IP: String,
    total_mouse_button_events: String,
    total_mouse_move_events: String,
    keys_code: [],
    mouse_button_codes: [],
    date: {type: Date, default: Date.now},
});

var user = mongoose.model('eventLogs', UserSchema);

model.save = function (eventData, callback) {
    var data = new user({
        IP: 2151,
        total_mouse_button_events: eventData.total_mouse_button_events,
        total_mouse_move_events: eventData.total_mouse_move_events,
        keys_code: eventData.keys_code,
        mouse_button_codes: eventData.mouse_button_codes
    });

    dbHelper.insert(data, function (err) {
        if (err)
            callback(err);
        else
            callback(null);
    })
};
model.isDocOnCurrentDate = function (eventData, callback) {
    dbHelper.sort(user,null,{date:-1}, function (err, result) {
        // console.log("RESULT :",result);
        if (err)
            callback(err);
        else {
            // console.log("SSS :",moment(result[0].date).format("DD/MM/YYYY")  == moment(Date.now()).format("DD/MM/YYYY"));
            if (result.length) {
                callback(null, moment(result[0].date).format("DD/MM/YYYY") == moment(Date.now()).format("DD/MM/YYYY"));
            }
            else {
                callback(null, false);
            }
        }

    })
};
model.update = function (eventData, callback) {
    var conditions = {
        IP: eventData.IP,
        //'album.imageName': { $ne: req.body.comment }
    };
    var update = {
        $addToSet: {
            keys_code: eventData.keys_code
        }
    }

    dbHelper.deepSave(conditions, user, update, function (err, result) {

        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }


    });

}


model.simpleSelect = function (callback) {

    dbHelper.simpleSelect(user, function (err, result) {
        if (err) {
            console.log("Error :", err)
            callback(err);
        } else {
            callback(null, result.length);
        }

    });
}

module.exports.model = model;