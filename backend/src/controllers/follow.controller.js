import mongoose from 'mongoose';
import User from '../models/user.model.js';

const uid = req => req.user?._id || req.user?.id;

// POST /users/:id/follow
export async function followUserHandler(req, res) {
  try {
    const me     = new mongoose.Types.ObjectId(uid(req));
    const target = new mongoose.Types.ObjectId(req.params.id);

    if (me.equals(target)) return res.status(400).json({ success: false, message: 'Cannot follow yourself' });

    await Promise.all([
      User.updateOne({ _id: me },     { $addToSet: { following: target } }),
      User.updateOne({ _id: target }, { $addToSet: { followers: me     } }),
    ]);

    res.json({ success: true, following: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /users/:id/follow
export async function unfollowUserHandler(req, res) {
  try {
    const me     = new mongoose.Types.ObjectId(uid(req));
    const target = new mongoose.Types.ObjectId(req.params.id);

    await Promise.all([
      User.updateOne({ _id: me },     { $pull: { following: target } }),
      User.updateOne({ _id: target }, { $pull: { followers: me     } }),
    ]);

    res.json({ success: true, following: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
