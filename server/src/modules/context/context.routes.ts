import { Router } from 'express';
import { contextController } from './context.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
  
const router = Router();
  
router.use(authMiddleware);
  
router.post('/snapshot', contextController.createSnapshot);
router.post('/update', contextController.createUpdate);
router.get('/history/:projectId', contextController.getContextHistory);
router.get('/diff/:projectId', contextController.getDiff);
router.post('/restore/:projectId', contextController.restoreVersion);
router.post('/cleanup/preview/:projectId', contextController.previewCleanup);
router.post('/cleanup/apply/:projectId', contextController.applyCleanup);
 
export default router;


