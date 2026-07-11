import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    conversationId: { type: String, required: true, index: true },
    senderId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message:        { type: String, maxlength: 2000, default: '' },
    type:           { type: String, enum: ['text', 'audio', 'image'], default: 'text' },
    clientId:       { type: String, unique: true, sparse: true },
    status:         { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    readAt:         { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });

export default model('Message', messageSchema);
