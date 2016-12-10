var router = require('express').Router();
var controllerIndex = require('../controller/index');
var authUtil = require('../libs/authUtils');

router.use(authUtil.verifySessionId);

router.post('/user/savetime', controllerIndex.timings.savetimings);

//get total meeting time and total idle time
router.post('/user/totalbreaktime_idletime', controllerIndex.timings.getTotalBreakTime);

module.exports = router;