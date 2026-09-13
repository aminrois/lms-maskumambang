import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Users
router.get('/', authenticate, userController.getUsers);
router.get('/:id', authenticate, userController.getUserById);
router.post('/', authenticate, userController.createUser);
router.patch('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, userController.deleteUser);

// Roles
router.get('/roles/list', authenticate, userController.getRoles);
router.get('/roles/:id', authenticate, userController.getRoleById);

// User Roles
router.get('/user-roles/list', authenticate, userController.getUserRoles);
router.post('/user-roles', authenticate, userController.createUserRole);
router.delete('/user-roles/:id', authenticate, userController.deleteUserRole);

export default router;
