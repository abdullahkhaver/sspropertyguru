import User from '../models/user.model.js';
import Property from '../models/property.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const getFranchiseDashboard = async (req, res, next) => {
  try {
    const { franchiseId } = req.params;

    if (!franchiseId) {
      return res.status(400).json(ApiError.badRequest('Franchise ID required'));
    }

    // Count agents of franchise
    const agentCount = await User.countDocuments({ franchise: franchiseId });

    // Count all properties of franchise
    const propertyCount = await Property.countDocuments({
      franchise: franchiseId,
    });

    // Count houses and plots separately
    const houseCount = await Property.countDocuments({
      franchise: franchiseId,
      type: 'house',
    });

    const plotCount = await Property.countDocuments({
      franchise: franchiseId,
      type: 'plot',
    });

    res.json(
      ApiResponse.success('Franchise dashboard stats', {
        agentCount,
        propertyCount,
        houseCount,
        plotCount,
        chartData: [
          { name: 'Houses', value: houseCount },
          { name: 'Plots', value: plotCount },
          {
            name: 'Other Properties',
            value: propertyCount - (houseCount + plotCount),
          },
        ],
      }),
    );
  } catch (err) {
    console.error('Franchise Dashboard Error:', err);
    next(err);
  }
};
