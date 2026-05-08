import { Router } from 'express';
import { projectController } from './project.controller';
import { contextController } from '../context/context.controller';
import { exportController } from '../export/export.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', projectController.create);
router.get('/', projectController.getAll);
router.get('/:id', projectController.getOne);
router.patch('/:id', projectController.update);
router.delete('/:id', projectController.delete);
router.post('/:projectId/context/updates', contextController.handleRawUpdate);
router.get('/:projectId/context/latest', contextController.getLatestSnapshot);
router.post('/:projectId/context/export', exportController.exportContext);
router.post('/:projectId/context/restore', contextController.restoreVersion);
router.post('/:projectId/context/cleanup/preview', contextController.previewCleanup);
router.post('/:projectId/context/cleanup/apply', contextController.applyCleanup);

export default router;
