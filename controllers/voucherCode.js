const voucherCodes = require('../voucherCodes');

exports.postCheckCode = (req, res, next) => {
  const voucherCode = req.body.code;
  const currentCodes = req.body.currentCodes;
  const basket = req.basket;
  const basketTotalPrice = req.basketTotalPrice;
  const voucherCodeObj = voucherCodes.find(
    codeObj => codeObj.code === voucherCode
  );
  if (voucherCodeObj) {
    if (
      voucherCodeObj.check &&
      !voucherCodeObj.check({
        decodedToken: req.decodedToken,
        currentCodes,
        basket,
        basketTotalPrice
      })
    ) {
      return res.status(200).json({
        acceptCode: false,
        message: {
          isAccepted: false,
          msg: `Reject: ${voucherCode}`
        }
      });
    } else {
      return res.status(200).json({
        acceptCode: true,
        discount: voucherCodeObj.discount,
        message: {
          isAccepted: true,
          msg: `Accept: ${voucherCode}`
        }
      });
    }
  } else {
    res.status(200).json({
      acceptCode: false,
      message: {
        isAccepted: false,
        msg: `Reject: ${voucherCode}`
      }
    });
  }
};

exports.postAutoCheckCodes = (req, res, next) => {
  const currentCodes = req.body.currentCodes;
  const basket = req.basket;
  const basketTotalPrice = req.basketTotalPrice;
  const autoVoucherCodesArr = voucherCodes.filter(codeObj => codeObj.autoCheck);
  const activeAutoCodes = [];
  const activeAutoDiscounts = [];
  const removeCodes = [];
  if (autoVoucherCodesArr.length && basket.length) {
    autoVoucherCodesArr.forEach(autoCodeObj => {
      if (
        autoCodeObj.check({
          decodedToken: req.decodedToken,
          currentCodes,
          basket,
          basketTotalPrice
        }) &&
        !currentCodes.includes(autoCodeObj.code)
      ) {
        activeAutoCodes.push(autoCodeObj.code);
        activeAutoDiscounts.push(autoCodeObj.discount);
      }
    });
  }
  if (currentCodes.length && basket.length) {
    currentCodes.forEach((code, index) => {
      const voucherCodeObj = voucherCodes.find(
        codeObj => codeObj.code === code
      );
      if (
        voucherCodeObj &&
        voucherCodeObj.check &&
        !voucherCodeObj.check({
          decodedToken: req.decodedToken,
          currentCodes: [...currentCodes].filter((_, i) => i !== index),
          basket,
          basketTotalPrice
        })
      ) {
        removeCodes.push(code);
      }
    });
  }
  return res.status(200).json({
    autoCodes: activeAutoCodes,
    autoDiscounts: activeAutoDiscounts,
    removeCodes
  });
};
