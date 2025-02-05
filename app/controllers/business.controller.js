const db = require("../models");
const config = require("../config/auth.config");
const Business = db.businesses;
const Role = db.role;
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const client = twilio(
  "AC2d9a8ce2df21dbbd48032c03072edfdb",
  "7518c21a19e5b20ed33252897afe6bc6"
);
const Op = db.Sequelize.Op;
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

// Create Business
exports.createBusiness = async (req, res) => {
  try {
    const {
      userId,
      businessName,
      description,
      category,
      sub_category,
      street,
      apartment,
      zipcode,
      state,
      phone,
      email,
      website_link,
      ordering_link,
      booking_link,
      whatsapp_number,
      instagram_link,
      facebook_link,
      twitter_link,
      logo,
      background_image,
      latitude,
      longitude,
    } = req.body;

    console.log("Request Body:", req.body); // Log the incoming request

    if (!businessName || !category || !sub_category || !street || !zipcode) {
      return res.status(400).json({
        message:
          "Please provide all required fields: businessName, category, sub_category, street, and zipcode.",
      });
    }

    // Create a new business record
    const newBusiness = await Business.create({
      userId,
      businessName,
      description,
      category,
      sub_category,
      street,
      apartment,
      zipcode,
      state,
      phone,
      email,
      website_link,
      ordering_link,
      booking_link,
      whatsapp_number,
      instagram_link,
      facebook_link,
      twitter_link,
      logo,
      background_image,
      latitude,
      longitude,
    });

    console.log("New Business Created:", newBusiness); // Log the new business

    // Respond with the created business
    return res.status(201).json({
      message: "Business created successfully.",
      business: newBusiness,
    });
  } catch (error) {
    console.error("Error creating business:", error); // Log the full error object
    return res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

exports.getAllBusinesses = async (req, res) => {
  try {
    const businesses = await Business.findAll();

    // Check if businesses exist
    if (!businesses) {
      return res.status(404).json({ message: "No businesses found." });
    }

    // Return success response with business data
    return res.status(200).json({
      message: "Businesses fetched successfully.",
      data: businesses,
    });
  } catch (error) {
    console.error(error);
    // Return error response
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.likeBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findByPk(businessId);

    if (!business) {
      return res.status(404).json({ message: "Business not found." });
    }

    business.likes += 1;

    await business.save();

    return res.status(200).json({
      message: "Business liked successfully.",
      business: {
        id: business.id,
        likes: business.likes,
      },
    });
  } catch (error) {
    console.error("Error liking business:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getBusinessById = async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findByPk(businessId);

    if (!business) {
      return res.status(404).json({ message: "Business not found." });
    }

    await business.save();

    return res.status(200).json({
      message: "Business liked successfully.",
      data: {
        business,
      },
    });
  } catch (error) {
    console.error("Error liking business:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.editBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const {
      businessName,
      description,
      category,
      sub_category,
      street,
      apartment,
      zipcode,
      state,
      phone,
      email,
      website_link,
      ordering_link,
      booking_link,
      whatsapp_number,
      instagram_link,
      facebook_link,
      twitter_link,
      logo,
      background_image,
      latitude,
      longitude,
    } = req.body;

    console.log("Request Body:", req.body);

    const business = await Business.findByPk(businessId);
    if (!business) {
      return res.status(404).json({
        message: "Business not found.",
      });
    }

    business.businessName = businessName || business.businessName;
    business.description = description || business.description;
    business.category = category || business.category;
    business.sub_category = sub_category || business.sub_category;
    business.street = street || business.street;
    business.apartment = apartment || business.apartment;
    business.zipcode = zipcode || business.zipcode;
    business.state = state || business.state;
    business.phone = phone || business.phone;
    business.email = email || business.email;
    business.website_link = website_link || business.website_link;
    business.ordering_link = ordering_link || business.ordering_link;
    business.booking_link = booking_link || business.booking_link;
    business.whatsapp_number = whatsapp_number || business.whatsapp_number;
    business.instagram_link = instagram_link || business.instagram_link;
    business.facebook_link = facebook_link || business.facebook_link;
    business.twitter_link = twitter_link || business.twitter_link;
    business.logo = logo || business.logo;
    business.background_image = background_image || business.background_image;
    business.latitude = latitude || business.latitude;
    business.longitude = longitude || business.longitude;

    const updatedBusiness = await business.save();

    console.log("Business Updated:", updatedBusiness);

    return res.status(200).json({
      message: "Business updated successfully.",
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("Error updating business:", error);
    return res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

