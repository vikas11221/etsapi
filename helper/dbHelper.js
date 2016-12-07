// define module
var dbHelper = {};
module.exports = dbHelper;

//functions for CRUD operations

// Get the documents collection
// this function take three arguments
// 1: query : condition
// 2: model : collection(table)
// 3: and a callback
dbHelper.select = function(query,model,callback) {
    model.find(query,function(err,result) {
        callback(err,result);
    });
};

// insert row
// model :table name in which you want to save
dbHelper.insert = function (model,done) {
    model.save(function (err) {
        if(err)
            done(err);
        else{
            done(null);
        }
    });
};

dbHelper.update = function(query,model,data,callback) {
    model.findOneAndUpdate(query, {$set:data},{ 'new': true }, function(err, doc){
        if (err) return callback(err,doc);
        return callback(null,doc);
    });
};

dbHelper.delete = function (query,model,callback) {
    model.findOneAndRemove(query, function(err, doc){
        if (err) return callback(err,doc);
        return callback(null,doc);
    });
};

dbHelper.deepSave = function (conditions,model,update,callback) {
    model.findOneAndUpdate(conditions, update,{ 'new': true }, function(err, doc) {
        if (err) return callback(err,doc);
        return callback(null,doc);
    });
};

dbHelper.deepDelete = function (postId,model,update,callback) {
    model.findByIdAndUpdate(postId, update,{ 'new': true }, function(err, doc) {
        if (err) return callback(err,doc);
        return callback(null,doc);
    });
};



//Sorting
dbHelper.sort = function (model, findCondition, sortCondition,callback) {
    model.find(findCondition).sort(sortCondition).exec(function (err, cursor) {
        if (err) return callback(err, cursor);
        return callback(null, cursor);
    });
};