
var logger = require('../libs/logger');


var gm = require('gm');
var sizeOf = require('image-size');
var imageMagick = gm.subClass({ imageMagick: true });
var fs = require('fs');

// define module
var waterMark = {};
module.exports = waterMark;



/**
 * Add water mark to files
 */
waterMark.convert = function (files) {
    return new Promise(function (resolve, reject) {
        var promiseArray = [];
        for (var index in files) {
            promiseArray.push(appendWaterMark(files[index].path, 'MyNightOut.com'));
        }
        Promise.all(promiseArray).then(function () {
            resolve(true);
        }, function (error) {
            deleteFile(files);
            reject(error);
        });
    });
};



/**
 * Append water mark to a single file
 */
var appendWaterMark = function (imagePath, text) {

    return new Promise(function (resolve, reject) {
        var mainImagePath = imagePath;
        var frontImage = './assets/logo.jpg';
        var resultImage = imagePath;

        var dimensions = sizeOf(mainImagePath);
        var nightoutfontSize = dimensions.width / 30;
        var logoSizeX = parseInt(dimensions.width / 15);
        var logoSizeY = parseInt(dimensions.height / 14);
        (logoSizeX < logoSizeY) ? logoSizeY = logoSizeX : logoSizeX = logoSizeY;

        var textX = parseInt(dimensions.width / 13);
        var textY = parseInt(dimensions.height - (dimensions.height / 20));


        var logoCorX = parseInt(dimensions.width / 26);
        var logoCorY = parseInt(dimensions.height - (dimensions.height / 10));

        var xy = '\+' + logoCorX + '\+' + logoCorY;
        gm(frontImage)
            .resize(logoSizeX, logoSizeY, '!')
            .write(frontImage, function (err) {
                if (err) {
                    console.log(err);
                    reject(err);
                }

                gm(mainImagePath)
                    .composite(frontImage)
                    .geometry(xy)
                    .write(resultImage, function (err) {
                        if (err) {
                            console.log(err);

                            reject(err);
                        }
                        imageMagick(resultImage)
                            .font('Arial')
                            .fontSize(nightoutfontSize)
                            .fill('white')
                            .drawText(textX, textY, text)
                            .write(resultImage, function (err) {
                                if (err) {
                                    console.log(err);

                                    reject(err);
                                }
                                resolve(true);

                            });
                    });

            });
    });
};


/**
 * Delete files for which error occoured
 */
var deleteFile = function (files) {
    files.forEach(function (file) {
        fs.unlink(file.path, function (err) {
            if (err) {
                logger.info(err.message);
            }
        });
    });
};