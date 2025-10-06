// controllers/dashboard.controller.js
import User from "../models/user.model.js";
import Property from "../models/property.model.js";
import Franchise from "../models/franchise.model.js";

export const getDashboardStats = async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    // const agentsCount = await Agent.countDocuments();
    const franchiseCount = await Franchise.countDocuments();
    const propertiesCount = await Property.countDocuments();

    // Example: property types
    const plotsCount = await Property.countDocuments({ type: "plot" });
    const housesCount = await Property.countDocuments({ type: "house" });
    const onSaleCount = await Property.countDocuments({ status: "sale" });

    res.status(200).json({
      success: true,
      stats: {
        users: usersCount,
        // agents: agentsCount,
        franchise: franchiseCount,
        properties: propertiesCount,
        plots: plotsCount,
        houses: housesCount,
        onSale: onSaleCount,
      },
      pie: [
        { name: "Users", value: usersCount, color: "#2e7a66" },
        // { name: "Agents", value: agentsCount, color: "#007bff" },
        { name: "Franchise", value: franchiseCount, color: "#ffc107" },
        { name: "Properties", value: propertiesCount, color: "#17a2b8" },
      ],
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
