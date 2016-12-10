var controllerIndex = require('../controller/index');
var authUtil = require('../libs/authUtils');
var secureRoute = require('./secureRouter');

module.exports = function (app) {
    app.use('/secure',secureRoute);
    app.post('/register', controllerIndex.auth.signUp);
    app.post('/login', controllerIndex.auth.login);
    app.post('/changepassword', authUtil.verifySessionId, controllerIndex.auth.changePassword);
    app.post('/forgetpassword', controllerIndex.auth.forgetPassword);
    // app.post('/search', controllerIndex.common.contentSearchController);
    app.get('/isemailidexist/:email', controllerIndex.auth.checkEmail);
    app.get('/isusernameexist/:userName', controllerIndex.auth.checkUserName);

};