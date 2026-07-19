import userRepo from '../repositories/user.repository.js';

const uid = (req) => req.user?._id || req.user?.id;

// POST /users/:id/follow
export async function followUserHandler(req, res) {
  try {
    const me     = String(uid(req));
    const target = String(req.params.id);

    if (me === target) return res.status(400).json({ success: false, message: 'Cannot follow yourself' });

    await userRepo.follow(me, target);
    res.json({ success: true, following: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /users/:id/follow
export async function unfollowUserHandler(req, res) {
  try {
    const me     = String(uid(req));
    const target = String(req.params.id);

    await userRepo.unfollow(me, target);
    res.json({ success: true, following: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}