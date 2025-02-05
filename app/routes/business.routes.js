const { verifySignUp } = require("../middleware");
const controller = require("../controllers/business.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/business/create-business", controller.createBusiness);
  app.get("/business/all-business", controller.getAllBusinesses);
  app.post("/business/like/:businessId", controller.likeBusiness);
  app.post("/business/get-business/:businessId", controller.getBusinessById);
  app.put("/business/edit-business/:businessId", controller.editBusiness);
//   app.post("/auth/create-new-password", controller.createNewPassword);
//   app.post("/auth/get-profile/:userId", controller.getProfile);
//   app.post("/auth/update-profile/:userId", controller.updateProfile);
};
