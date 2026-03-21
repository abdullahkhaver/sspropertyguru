// controllers/dashboard.controller.js
import User from '../models/user.model.js';
import Property from '../models/property.model.js';
import Franchise from '../models/franchise.model.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Basic counts
    const usersCount = await User.countDocuments();
    const franchiseCount = await Franchise.countDocuments();
    const propertiesCount = await Property.countDocuments();

    // Property breakdowns (using updated field names)
    const plotsCount = await Property.countDocuments({ category: 'Plot' });
    const housesCount = await Property.countDocuments({ category: 'House' });
    const onSaleCount = await Property.countDocuments({ sellingType: 'Sale' });
    const onRentCount = await Property.countDocuments({ sellingType: 'Rent' });
    const onLeaseCount = await Property.countDocuments({
      sellingType: 'Lease',
    });

    // Optional: status-based counts
    const availableCount = await Property.countDocuments({
      status: 'Available',
    });
    const soldCount = await Property.countDocuments({ status: 'Sold' });
    const rentedCount = await Property.countDocuments({ status: 'Rented' });
    const pendingCount = await Property.countDocuments({ status: 'Pending' });

    res.status(200).json({
      success: true,
      stats: {
        users: usersCount,
        franchise: franchiseCount,
        properties: propertiesCount,
        plots: plotsCount,
        houses: housesCount,
        onSale: onSaleCount,
        onRent: onRentCount,
        onLease: onLeaseCount,
        available: availableCount,
        sold: soldCount,
        rented: rentedCount,
        pending: pendingCount,
      },
      pie: [
        { name: 'Users', value: usersCount, color: '#2e7a66' },
        { name: 'Franchise', value: franchiseCount, color: '#ffc107' },
        { name: 'Properties', value: propertiesCount, color: '#17a2b8' },
        { name: 'Plots', value: plotsCount, color: '#6f42c1' },
        { name: 'Houses', value: housesCount, color: '#007bff' },
      ],
      sellingTypeStats: [
        { name: 'Sale', value: onSaleCount, color: '#28a745' },
        { name: 'Rent', value: onRentCount, color: '#17a2b8' },
        { name: 'Lease', value: onLeaseCount, color: '#ffc107' },
      ],
      statusStats: [
        { name: 'Available', value: availableCount, color: '#28a745' },
        { name: 'Sold', value: soldCount, color: '#dc3545' },
        { name: 'Rented', value: rentedCount, color: '#007bff' },
        { name: 'Pending', value: pendingCount, color: '#ffc107' },
      ],
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
