const config = require("../config/auth.config");
const db = require("../models"); 
const Business = db.businesses;
const Role = db.role;
const twilio = require("twilio");
const client = twilio(
  "AC2d9a8ce2df21dbbd48032c03072edfdb",
  "7518c21a19e5b20ed33252897afe6bc6"
);
const Op = db.Sequelize.Op;
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

const Feedbacks = db.feedbacks;

exports.createFeedbacks = async (req, res) => {
  try {
    const { businessId, userId, rating, comment } = req.body;

    

    if (!businessId || !userId || !rating) {
      return res.status(400).json({
        message: "Missing required fields: businessId, userId, and rating are required.",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    const feedback = await Feedbacks.create({
      businessId,
      userId,
      rating,
      comment,
    });

    return res.status(201).json({
      message: "Feedback created successfully.",
      data: feedback,
    });
  } catch (error) {
    console.error("Error creating feedback:", error);

    return res.status(500).json({
      message: "An error occurred while creating the feedback.",
      error: error.message,
    });
  }
};
