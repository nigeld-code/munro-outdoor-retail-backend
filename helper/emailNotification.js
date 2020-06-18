require('dotenv').config({ path: __dirname + '/../.env' });
const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-2' });

const sesv2 = new AWS.SESV2({ apiVersion: '2019-09-27' });

module.exports = (emailToAddresses, emailSubject, emailHtml, emailText) => {
  const params = {
    Content: {
      Simple: {
        Body: {
          Html: {
            Data: emailHtml,
            Charset: 'UTF-8'
          },
          Text: {
            Data: emailText,
            Charset: 'UTF-8'
          }
        },
        Subject: {
          Data: emailSubject,
          Charset: 'UTF-8'
        }
      }
    },
    Destination: {
      ToAddresses: emailToAddresses
    },
    FromEmailAddress: 'munrooutdoor@outlook.com'
  };

  sesv2.sendEmail(params, (err, data) => {
    if (err) console.log(err, err.stack);
    else console.log(data);
  });
};
