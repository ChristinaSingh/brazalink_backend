const db = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const Auth = db.auth;
const Role = db.role;

exports.adminRegister = async (req, res) => {
  try {
    const { email, password, phone } = req.body;

    if (!email || !password || !phone) {
      return res.status(400).send({ message: "Email, password, and phone are required!" });
    }

    const existingAdmin = await Auth.findOne({
      where: {
        email: {
          [Op.eq]: email,
        },
      },
    });

    if (existingAdmin) {
      return res.status(400).send({ message: "Admin with this email already exists!" });
    }

    // Hash the password before saving to the database
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Create new admin
    const newAdmin = await Auth.create({
      email,
      password: hashedPassword,
      phone,
    });

    // Find the 'admin' role from the role table
    const adminRole = await Role.findOne({
      where: { name: "admin" },
    });

    if (!adminRole) {
      return res.status(400).send({ message: "Admin role not found!" });
    }

    // Assign 'admin' role to the new user
    await newAdmin.setRoles([adminRole.id]);

    res.status(201).send({
      message: "Admin registered successfully!",
      admin: newAdmin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
};
