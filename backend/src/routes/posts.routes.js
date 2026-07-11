import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getFeed, getUserPosts, createPost, likePost, unlikePost, addComment, getComments } from '../controllers/posts.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/feed',              getFeed);
router.get('/user/:userId',      getUserPosts);
router.post('/',                 createPost);
router.post('/:id/like',         likePost);
router.delete('/:id/like',       unlikePost);
router.get('/:id/comments',      getComments);
router.post('/:id/comments',     addComment);

export default router;
