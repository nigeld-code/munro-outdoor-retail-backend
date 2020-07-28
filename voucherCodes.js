const User = require('./models/user');

//  Voucher Codes:
//  {
//    code: ---Voucher Code--- (Must be all CAPS and no spaces, can include numbers)
//  }

const voucherCodes = [
  {
    code: 'ALLFREE',
    discount: {
      type: '%',
      value: -100
    },
    check: ({ currentCodes, basket }) => !currentCodes.length && basket.length
  },
  {
    code: 'HALFOFF',
    discount: {
      type: '%',
      value: -50
    },
    check: ({ basket, basketTotalPrice }) =>
      basket.length && basketTotalPrice >= 100
  },
  {
    code: '15OFF1STORDER',
    autoCheck: true,
    discount: {
      type: '£',
      value: -15
    },
    check: async ({ decodedToken, currentCodes, basket, basketTotalPrice }) => {
      try {
        let user;
        if (decodedToken) {
          user = await User.findById(decodedToken.userId, 'voucherCodes');
        } else {
          return false;
        }
        return (
          user &&
          !user.voucherCodes.includes('15OFF1STORDER') &&
          !currentCodes.includes('15OFF1STORDER') &&
          basket.length &&
          basketTotalPrice >= 50
        );
      } catch (err) {
        console.log(err);
        return false;
      }
    }
  }
];

module.exports = voucherCodes;
