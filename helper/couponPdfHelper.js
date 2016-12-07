var ApiException = require('../libs/core/ApiException');

var PDFDocument = require('pdfkit');

module.exports = function (couponDetails, callback) {
    try {
        var doc = new PDFDocument({ 'bufferPages': true });

        //doc.pipe(fs.createWriteStream('out.pdf'));

        var currentPosition = 0;
        for (var index in couponDetails) {

            var domainName = couponDetails[index].domain ? couponDetails[index].domain : '';
            var couponTitle = couponDetails[index].title ? couponDetails[index].title : '';
            var address = couponDetails[index].address ? couponDetails[index].address : '';
            var desc = couponDetails[index].couponDetail ? couponDetails[index].couponDetail : '';
            var expiry = couponDetails[index].expireDate ? couponDetails[index].expireDate : '';
            var srNo = couponDetails[index].couponNo ? couponDetails[index].couponNo : '';
            var externalLink = couponDetails[index].externalLink ? couponDetails[index].externalLink : '';
            var phNo = couponDetails[index].phone ? couponDetails[index].phone : '';
            var business = couponDetails[index].businessTitle ? couponDetails[index].businessTitle : '';
            var startY = currentPosition * 190 + 10;
            var startX = 10;
            doc.lineWidth(1);
            doc.moveTo(startX, startY)
                .dash(5, { space: 5 })
                .lineTo(startX + 550, startY)
                .lineTo(startX + 550, startY + 175)
                .lineTo(startX, startY + 175)
                .lineTo(startX, startY)
                .stroke();

            var currentY = startY + 20;
            doc.fontSize(10)
                .text(domainName, startX + 10, currentY)
                .font('Times-Roman', 'bold');


            currentY = currentY + 15;
            doc.fontSize(12)
                .fillColor('blue')
                .text(business, startX + 10, currentY)
                .font('Times-Roman');

            currentY = currentY + 15;
            doc.fontSize(10)
                .fillColor('blue')
                .text(couponTitle, startX + 10, currentY)
                .font('Times-Roman');
            var width = doc.widthOfString(couponTitle);
            var height = doc.currentLineHeight();

            doc.underline(startX + 10, currentY, width, height)
                .link(startX + 10, currentY, width, height, externalLink)
                .fillColor('black');


            // doc.image('https://devnightout.s3.amazonaws.com/static/1464787526124_third-img.png', 320, 50, { fit: [100, 100] })
            //     .stroke()
            //     .fillColor('black');

            currentY = currentY + 20;
            doc.fontSize(12)
                .text(address, startX + 10, currentY)
                .font('Times-Roman')
                .moveDown();
            if (phNo) {
                currentY = currentY + 15;
                doc.fontSize(10)
                    .text(phNo, startX + 10, currentY)
                    .font('Times-Roman')
                    .moveDown()
                    .moveDown();
            }

            currentY = currentY + 20;
            doc.fontSize(10)
                .text(desc, startX + 10, currentY)
                .font('Times-Roman')
                .moveDown()
                .moveDown();

            currentY = currentY + 30;
            doc.fontSize(12)
                .fillColor('red')
                .text('Please redeem your coupon before ' + expiry, startX + 10, currentY)
                .font('Times-Roman')
                .moveDown();
            currentY = currentY + 25;
            doc.fontSize(10)
                .fillColor('black')
                .text('Coupon No:' + srNo, startX + 10, currentY)
                .font('Times-Roman')
                .moveDown();

            doc.moveTo(startX, startY);
            currentPosition++;
            if (currentPosition > 2) {
                currentPosition = 0;
                doc.addPage();
            }
        }
        doc.end();
        return callback(null, doc);
    } catch (err) {
        return callback(ApiException.newInternalError(err.message));
    }
};