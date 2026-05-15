import { Router } from 'express';
import { githubIntegrationController } from './github.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { githubLimiter } from '../../middleware/rateLimit.middleware';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/status', githubLimiter, githubIntegrationController.getStatus);
router.get('/repositories', githubLimiter, githubIntegrationController.getRepositories);
router.post('/diff', githubLimiter, githubIntegrationController.getDiff);
router.get('/changes/preview', githubLimiter, githubIntegrationController.getChangesPreview);
router.post('/repository/select', githubLimiter, githubIntegrationController.selectRepository);
router.get('/branches', githubLimiter, githubIntegrationController.getBranches);
router.post('/branch/select', githubLimiter, githubIntegrationController.selectBranch);
router.post('/install/start', githubLimiter, githubIntegrationController.startInstall);
router.delete('/disconnect', githubLimiter, githubIntegrationController.disconnect);

export default router;
