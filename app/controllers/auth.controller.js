const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const client = twilio("AC2d9a8ce2df21dbbd48032c03072edfdb", "7518c21a19e5b20ed33252897afe6bc6");
const Op = db.Sequelize.Op;
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

// Sign Up User
exports.signup = async (req, res) => {
  try {
    if (!req.body.password || !req.body.email) {
      return res
        .status(400)
        .send({ message: "Email and password are required!" });
    }

    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dob: req.body.dob,
      phone: req.body.phone,
      email: req.body.email,
      profileImage: req.body.profileImage || null,
      password: bcrypt.hashSync(req.body.password, 8),
    });

    console.log("User here:-", user.rainbow);

    if (req.body.roles && req.body.roles.length > 0) {
      const roles = await Role.findAll({
        where: {
          name: {
            [Op.or]: req.body.roles,
          },
        },
      });

      if (!roles || roles.length === 0) {
        return res.status(400).send({ message: "Invalid roles specified!" });
      }

      await user.setRoles(roles);
    } else {
      const defaultRole = await Role.findOne({ where: { name: "user" } });
      if (!defaultRole) {
        return res.status(500).send({ message: "Default role not found!" });
      }
      await user.setRoles([defaultRole.id]);
    }

    res.status(201).send({
      message: "User registered successfully!",
      user: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
};

// Sign In User
exports.signin = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    console.log("Email or Phone:", emailOrPhone);

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      },
    });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid password!",
      });
    }

    const token = jwt.sign({ id: user.id }, config.secret, {
      algorithm: "HS256",
      allowInsecureKeySizes: true,
      expiresIn: 86400, // 1 day
    });

    const roles = await user.getRoles();
    const authorities = roles.map((role) => `ROLE_${role.name.toUpperCase()}`);

    const userResponse = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: authorities,
    };

    res.status(200).send({
      user: userResponse,
      accessToken: token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "An error occurred during sign-in." });
  }
};

// Password Reset
exports.passwordReset = async (req, res) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return res
      .status(400)
      .json({ message: "Email or phone number is required." });
  }

  try {
    console.log("Email", email);
    console.log("Phone", phone);

    // Find the user based on email or phone
    const user = await User.findOne({
      where: email ? { email } : { phone },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate OTP for password reset
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = Date.now() + 3600000; // OTP expires in 1 hour

    console.log("Otp", otp);
    console.log("Otp Expiry", otpExpiry);

    // Store OTP and expiry time in the user record
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP via email or phone based on user input
    if (email) {
      // Send OTP to email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "prashantsharma62677@gmail.com",
          pass: "iefp lpkx ebzc ecqr",
        },
      });

      const mailOptions = {
        from: "prashantsharma62677@gmail.com",
        to: user.email,
        subject: "Password Reset OTP",
        html: `
          <p>You requested a password reset. Use the following OTP to reset your password:</p>
          <h2>${otp}</h2>
          <p>This OTP will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({
          status: "success",
          message: "OTP sent to your email.",
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return res.status(500).json({
          status: "error",
          message: "Failed to send email. Please try again later.",
        });
      }
    } else if (phone) {
      try {
        const message = await client.messages.create({
          body: `Your password reset OTP is ${otp}. It will expire in 1 hour.`,
          from: 7470734508,
          to: 6263146872,
        });

        console.log("Twilio message SID:", message.sid);
        return res.status(200).json({
          status: "success",
          message: "OTP sent to your phone.",
        });
      } catch (smsError) {
        console.error("Error sending SMS:", smsError);
        return res.status(500).json({
          status: "error",
          message: "Failed to send SMS. Please try again later.",
        });
      }
    }
  } catch (error) {
    console.error("Error in password reset process:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error. Please try again later.",
    });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  // Validate request body
  if (!email || !otp) {
    return res.status(400).json({
      status: "error",
      message: "Email and OTP are required.",
    });
  }

  console.log("Email and OTP",email ,otp)

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    console.log("Received OTP:", otp);
    console.log("Stored OTP in database:", user.otp);
    console.log("Current Time:", Date.now());
    console.log("OTP Expiry Time:", user.otpExpiry);

    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP.",
      });
    }

    // Check if the OTP has expired
    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({
        status: "error",
        message: "Expired OTP.",
      });
    }
    
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("Error in OTP verification process:", error);
    res.status(500).json({
      status: "error",
      message: "Server error. Please try again later.",
      error: error.message,
    });
  }
};

// Create New Password
exports.createNewPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email and new password are required." });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt); 

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Profile API
exports.getProfile = async (req, res) => {
  const { userId } = req.params; 

  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      profileImage: user.profileImage,
      address: user.address,
      zipcode: user.zipcode,
      about: user.about,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Profile API
exports.updateProfile = async (req, res) => {
  const {
    userId,
    firstName,
    lastName,
    email,
    address,
    zipcode,
    about,
  } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  const updateData = {};

  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (email) updateData.email = email;
  if (address) updateData.address = address;
  if (zipcode) updateData.zipcode = zipcode;
  if (about) updateData.about = about;

  try {
    const user = await User.update(updateData, {
      where: { id: userId },
      returning: true, 
    });

    if (!user[1].length) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: user[1][0], 
    });
  } catch (error) {
    console.error(error); 
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Save Business in User Profile
// exports.saveBusiness= async (req, res) => {
//   try {
//     const { userId, businessId } = req.body;

//     console.log("userId:", userId);
//     console.log("businessId:", businessId);

//     const user = await User.findByPk(userId);
//     const business = await Business.findByPk(businessId);

//     if (!user || !business) {
//       return res.status(404).json({ message: "User or Business not found!" });
//     }

//     await user.addSavedBusiness(business);

//     return res.status(200).json({ message: "Business saved successfully!" });
//   } catch (error) {
//     console.error("Error saving business:", error);
//     return res.status(500).json({ message: "An error occurred while saving the business." });
//   }
// };

// exports.getSavedBusinesses = async (userId) => {
//   try {
//     const user = await User.findByPk(userId, {
//       include: {
//         model: Business,
//         as: "savedBusinesses",
//       },
//     });

//     if (!user) {
//       return { message: "User not found!" };
//     }

//     return { savedBusinesses: user.savedBusinesses };
//   } catch (error) {
//     console.error(error);
//     return { message: "Error retrieving saved businesses." };
//   }
// };

