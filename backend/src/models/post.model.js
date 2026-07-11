import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const commentSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String, maxlength: 1000, required: true },
  createdAt:{ type: Date, default: Date.now },
}, { _id: true });

const postSchema = new Schema({
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:         { type: String, enum: ['photo', 'video', 'promotion', 'text'], default: 'photo' },
  mediaUrl:     { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  caption:      { type: String, maxlength: 500, default: '' },
  audience:     { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
  likes:        [{ type: Schema.Types.ObjectId, ref: 'User' }],
  likesCount:   { type: Number, default: 0 },
  comments:     [commentSchema],
  commentsCount:{ type: Number, default: 0 },
  duration:     { type: Number, default: null },
}, { timestamps: true });

postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ audience: 1, createdAt: -1 });

export default model('Post', postSchema);
