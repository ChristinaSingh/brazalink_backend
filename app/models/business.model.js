const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const Business = sequelize.define(
    "businesses",
    {
      userId: {
        type: DataTypes.INTEGER, 
        allowNull: true, 
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM(
          "Restaurants",
          "Cafes",
          "Desserts",
          "Groceries",
          "Clothing",
          "Others"
        ),
        allowNull: true,
      },
      sub_category: {
        type: DataTypes.ENUM(
          "Ice Creams",
          "Cakes",
          "Pastries",
          "Fast Food",
          "Snacks",
          "Beverages",
          "Others"
        ),
        allowNull: true,
      },
      // Step 2 (Address Info)
      street: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      apartment: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      zipcode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Step 3 (Contact & Business Hours)
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      website_link: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_sunday_open: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_sunday_close: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_monday_open: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_monday_close: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_tuesday_open: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_tuesday_close: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_wednesday_open: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_wednesday_close: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_thursday_open: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_thursday_close: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_friday_open: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_friday_close: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_saturday_open: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      business_hours_saturday_close: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Step 4 (Links & Media)
      ordering_link: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      booking_link: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      whatsapp_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      instagram_link: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      facebook_link: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      twitter_link: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      logo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      background_image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      latitude: {
        type: DataTypes.FLOAT,
      },
      longitude: {
        type: DataTypes.FLOAT,
      },
      // Timestamps
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'businesses',
      timestamps: true,
    }
  );

  return Business;
};
