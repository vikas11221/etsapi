var controllerIndex = require('../controller/index');
var authUtil = require('../libs/authUtils');

module.exports = function (app) {
    app.get('/test', function (req, res, next) {
        res.end("hey")
    });
    app.use('/secure', function () {
        console.log("secure path");
    });
    app.post('/register', controllerIndex.auth.signUp);
    app.post('/login', controllerIndex.auth.login);
    app.post('/changepassword', authUtil.verifySessionId, controllerIndex.auth.changePassword);
    app.post('/forgetpassword', controllerIndex.auth.forgetPassword);
    // app.post('/search', controllerIndex.common.contentSearchController);
    app.get('/isemailidexist/:email', controllerIndex.auth.checkEmail);
    app.get('/isusernameexist/:userName', controllerIndex.auth.checkUserName);

};