var router = require('express').Router();
var controllerIndex = require('../controller/index');
var authUtil = require('../libs/authUtils');

router.use(authUtil.verifySessionId);

router.post('/user/savetime', controllerIndex.timings.savetimings);

module.exports = router;