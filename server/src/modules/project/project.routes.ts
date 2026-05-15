import { Router } from 'express';
import { projectController } from './project.controller';
import { contextController } from '../context/context.controller';
import { exportController } from '../export/export.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { aiLimiter, authLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', projectController.create);
router.get('/', projectController.getAll);
router.get('/:id', projectController.getOne);
router.patch('/:id', projectController.update);
router.delete('/:id', projectController.delete);
router.post('/:projectId/context/updates', contextController.handleRawUpdate);
router.get('/:projectId/context/latest', contextController.getLatestSnapshot);
router.post('/:projectId/context/export', aiLimiter, exportController.exportContext);
router.post('/:projectId/context/cleanup/preview', aiLimiter, contextController.previewCleanup);
router.post('/:projectId/context/cleanup/apply', aiLimiter, contextController.applyCleanup);
router.post('/:projectId/git-import/analyze', aiLimiter, contextController.analyzeGitImport);

router.post('/:projectId/git-import/apply', contextController.applyGitImport);
router.patch('/:projectId/git-import/:gitImportId/status', contextController.cancelGitImport);
router.get('/:projectId/git-import/history', contextController.getGitImportHistory);

export default router;
