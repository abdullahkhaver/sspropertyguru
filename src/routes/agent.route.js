
import express from 'express';
import {
  getAgents,
  deleteAgent,
  editAgent,
  getFiveAgents,
  addAgentToFranchise,
  getAgentsByFranchise,
  updateAgentInFranchise,
  deleteAgentInFranchise,
} from '../controllers/agent.controller.js';

const router = express.Router();

router.get('/', getAgents);
router.get('/top5', getFiveAgents);
router.put('/:id', editAgent);
router.delete('/:id', deleteAgent);

// Franchise related routes
router.post('/:franchiseId/agents', addAgentToFranchise);
router.get('/:franchiseId/agents', getAgentsByFranchise);
router.put('/:franchiseId/agents/:agentId', updateAgentInFranchise);
router.delete('/:franchiseId/agents/:agentId', deleteAgentInFranchise);
export default router;
