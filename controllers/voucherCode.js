const voucherCodes = require('../voucherCodes');

exports.postCheckCode = async (req, res, next) => {
  const voucherCode = req.body.code;
  const currentCodes = req.body.currentCodes;
  const basket = req.basket;
  const basketTotalPrice = req.basketTotalPrice;
  const voucherCodeObj = voucherCodes.find(
    codeObj => codeObj.code === voucherCode
  );
  const passCheck = await voucherCodeObj.check({
    decodedToken: req.decodedToken,
    currentCodes,
    basket,
    basketTotalPrice
  });
  if (voucherCodeObj) {
    if (!passCheck) {
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
    return res.status(200).json({
      acceptCode: false,
      message: {
        isAccepted: false,
        msg: `Reject: ${voucherCode}`
      }
    });
  }
};

exports.postAutoCheckCodes = async (req, res, next) => {
  const currentCodes = req.body.currentCodes;
  const basket = req.basket;
  const basketTotalPrice = req.basketTotalPrice;
  const autoVoucherCodesArr = voucherCodes.filter(codeObj => codeObj.autoCheck);
  const activeAutoCodes = [];
  const activeAutoDiscounts = [];
  const removeCodes = [];
  if (autoVoucherCodesArr.length && basket.length) {
    for (let autoCodeObj of autoVoucherCodesArr) {
      const passCheck = await autoCodeObj.check({
        decodedToken: req.decodedToken,
        currentCodes,
        basket,
        basketTotalPrice
      });
      if (passCheck && !currentCodes.includes(autoCodeObj.code)) {
        activeAutoCodes.push(autoCodeObj.code);
        activeAutoDiscounts.push(autoCodeObj.discount);
      }
    }
  }
  if (currentCodes.length && basket.length) {
    for (let index = 0; currentCodes.length > index; index++) {
      const voucherCodeObj = voucherCodes.find(
        codeObj => codeObj.code === currentCodes[index]
      );
      let failCheck;
      if (voucherCodeObj.check) {
        failCheck = await voucherCodeObj.check({
          decodedToken: req.decodedToken,
          currentCodes: [...currentCodes].filter((_, i) => i !== index),
          basket,
          basketTotalPrice
        });
      }
      if (voucherCodeObj && !failCheck) {
        removeCodes.push(currentCodes[index]);
      }
    }
  }
  return res.status(200).json({
    autoCodes: activeAutoCodes,
    autoDiscounts: activeAutoDiscounts,
    removeCodes
  });
};
