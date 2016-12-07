var controllerIndex = require('../controller/index');

var authUtil = require('../libs/authUtils');
var dbHelper = require('../helper/dbHelper.js');




module.exports = function (app) {

    app.post('/signup/businessowner', controllerIndex.auth.signUpBusinessOwner);
    app.post('/signup', controllerIndex.auth.signUp);
    app.post('/login', controllerIndex.auth.login);

    
    app.get('/test', function (req, res, next) {
        require('../helper/newsLetter-AutomateHelper')(function (err, result) {
            if (err) {
                return next(err);
            }
            res.send(result);
        });
    });





 app.get('/search/:searchName', function (req, res, next) {
     console.log("SearchName:",req.params.searchName );
dbHelper.searchQuery(req,res,"name",req.params.searchName);

       
    });

    };



/*
To check this project please 
goto -> NODEJS_StartUp_Project/start/my-nightout-api$ ->node app.js (hit enter).
Now hit  this url:
URL=>   http://localhost:5100/signup
Body=>  
{
    "firstName":"shubham",
    "lastName":"verma",
    "email":"email@gmail.com",
    "password":"123454321232",
    "contactNo":"1234567899"
}


then Response should be=>

{
  "firstName": "Shubham",
  "lastName": "Verma",
  "email": "email@gmail.com",
  "phone": "1234567899",
  "password": "0053242e210061a04681a47f408dfb93",
  "userName": "email@gmail.com",
  "sessionId": "36ab9c07-364e-4de5-8533-5d8b294cd2b0",
  "isLive": true
}

*/