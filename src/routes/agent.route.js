import express from 'express';
import {
  getAgents,
  deleteAgent,
  editAgent,
  getFiveAgents,
  toggleAgentStatus,
  addAgentToFranchise,
  getAgentsByFranchise,
  updateAgentInFranchise,
  deleteAgentInFranchise,
} from '../controllers/agent.controller.js';
import {upload} from "../middleware/multer.js";

const router = express.Router();

router.get('/', getAgents);
router.patch('/:agentId/toggle-status', toggleAgentStatus);
router.get('/top5', getFiveAgents);
router.put('/:id', editAgent);
router.delete('/:id', deleteAgent);

// Franchise related routes
router.post('/:franchiseId/agents', upload.single('image'),addAgentToFranchise);
router.get('/:franchiseId/agents', getAgentsByFranchise);
router.put('/:franchiseId/agents/:agentId',upload.single('image'), updateAgentInFranchise);
router.delete('/:franchiseId/agents/:agentId', deleteAgentInFranchise);
export default router;
