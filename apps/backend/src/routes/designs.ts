import { Router } from 'express';
import { designController } from '../controllers/design.controller';
import { fileService } from '../services/file.service';

const router: Router = Router();
const upload = fileService.createUploader();

router.get('/', designController.list);
router.post('/', upload.single('file'), designController.upload);
router.get('/:id', designController.getById);
router.delete('/:id', designController.delete);
router.post('/:id/reprocess', designController.reprocess);

export { router as designRoutes };
