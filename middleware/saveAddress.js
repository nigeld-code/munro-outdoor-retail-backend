const User = require('../models/user');

module.exports = async (req, res, next) => {
  if (req.body.saveAddress && req.decodedToken) {
    const deliveryDetails = req.body.deliveryDetails;
    const userId = req.decodedToken.userId;

    const user = await User.findById(userId);
    if (!user) {
      return next();
    }
    user.savedAddress = {
      name: deliveryDetails.name,
      address: deliveryDetails.address,
      city: deliveryDetails.city,
      postcode: deliveryDetails.postcode
    };
    await user.save();
  }
  next();
};
