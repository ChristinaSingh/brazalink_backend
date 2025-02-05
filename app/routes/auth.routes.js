const { verifySignUp } = require("../middleware");
const controller = require("../controllers/auth.controller");
const controllers = require("../controllers/feedbacks.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted,
    ],
    controller.signup
  );

  app.post("/auth/signin", controller.signin);
  app.post("/auth/password-reset", controller.passwordReset);
  app.post("/auth/verify-otp", controller.verifyOtp);
  app.post("/auth/create-new-password", controller.createNewPassword);
  app.post("/auth/get-profile/:userId", controller.getProfile);
  app.post("/auth/update-profile/:userId", controller.updateProfile);
  

  // app.post("/auth/save-business", controller.saveBusiness);
};
