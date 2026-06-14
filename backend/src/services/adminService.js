// ======================================================
// 🛡️ ADMIN SERVICE (JOBFAST CORE POWER LAYER - PRO+ FINAL)
// ======================================================

import crypto from "crypto";

// ======================================================
// 🧠 INTERNAL HELPERS
// ======================================================

const throwIfNotFound = (item, name) => {
  if (!item) throw new Error(`${name} not found`);
};

const ensureId = (id, label) => {
  if (!id) throw new Error(`${label} is required`);
};

// ======================================================
// 👥 USER MANAGEMENT (UNCHANGED - CLEAN)
// ======================================================

export const banUserService = async (
  userId,
  reason,
  adminId,
  UserModel
) => {
  ensureId(userId, "User ID");

  const user = await UserModel.findById(userId);
  throwIfNotFound(user, "User");

  user.status = "banned";
  user.banReason = reason?.trim() || "No reason provided";
  user.bannedBy = adminId;
  user.bannedAt = new Date();

  await user.save();

  return { success: true, action: "ban_user", userId };
};

// ------------------------------------------------------

export const suspendUserService = async (
  userId,
  adminId,
  UserModel
) => {
  ensureId(userId, "User ID");

  const user = await UserModel.findById(userId);
  throwIfNotFound(user, "User");

  user.status = "suspended";
  user.suspendedBy = adminId;
  user.suspendedAt = new Date();

  await user.save();

  return { success: true, action: "suspend_user", userId };
};

// ------------------------------------------------------

export const verifyUserService = async (
  userId,
  adminId,
  UserModel
) => {
  ensureId(userId, "User ID");

  const user = await UserModel.findById(userId);
  throwIfNotFound(user, "User");

  user.isVerified = true;
  user.verifiedBy = adminId;
  user.verifiedAt = new Date();

  await user.save();

  return { success: true, action: "verify_user", userId };
};

// ======================================================
// 🗑️ CONTENT MODERATION (OPTIMIZED)
// ======================================================

export const deletePostService = async (postId, PostModel) => {
  ensureId(postId, "Post ID");

  const post = await PostModel.findByIdAndDelete(postId);
  throwIfNotFound(post, "Post");

  return { success: true, action: "delete_post", postId };
};

// ------------------------------------------------------

export const deleteCommentService = async (
  commentId,
  CommentModel
) => {
  ensureId(commentId, "Comment ID");

  const comment = await CommentModel.findByIdAndDelete(commentId);
  throwIfNotFound(comment, "Comment");

  return { success: true, action: "delete_comment", commentId };
};

// ======================================================
// 📊 DASHBOARD STATS (FAST + SAFE)
// ======================================================

export const getAdminStatsService = async (models) => {
  const { UserModel, PostModel, PaymentModel } = models;

  const [users, posts, payments] = await Promise.all([
    UserModel.countDocuments(),
    PostModel.countDocuments(),
    PaymentModel.countDocuments(),
  ]);

  return {
    success: true,
    data: { users, posts, payments },
    generatedAt: new Date().toISOString(),
  };
};

// ======================================================
// 🔔 GLOBAL NOTIFICATION SYSTEM (OOM SAFE + PRO HARDENED)
// ======================================================

export const sendGlobalNotificationService = async (
  message,
  adminId,
  NotificationModel,
  UserModel
) => {
  if (!message?.trim()) throw new Error("Message required");

  const cleanMessage = message.trim();

  const cursor = UserModel.find({}, "_id").lean().cursor();

  let batch = [];
  let sent = 0;

  for await (const user of cursor) {
    batch.push({
      userId: user._id,
      message: cleanMessage,
      type: "global",
      createdBy: adminId,
      createdAt: new Date(),
    });

    // 🔥 SAFE BATCH FLUSH
    if (batch.length >= 1000) {
      try {
        await NotificationModel.insertMany(batch, {
          ordered: false,
        });
        sent += batch.length;
      } catch (err) {
        // continue even if partial fail (enterprise resilience)
        console.error("[GLOBAL NOTIF BATCH ERROR]", err.message);
      }
      batch = [];
    }
  }

  // flush last batch
  if (batch.length > 0) {
    try {
      await NotificationModel.insertMany(batch, {
        ordered: false,
      });
      sent += batch.length;
    } catch (err) {
      console.error("[GLOBAL NOTIF FINAL BATCH ERROR]", err.message);
    }
  }

  return {
    success: true,
    action: "global_notification",
    sent,
  };
};

// ======================================================
// 🧠 AI ADMIN ENGINE (STRICT VALIDATION + SAFE EXECUTION)
// ======================================================

export const aiAdminDecisionService = async (input, AIEngine) => {
  if (!AIEngine || typeof AIEngine.process !== "function") {
    throw new Error("Invalid AI Engine");
  }

  if (!input || typeof input !== "object") {
    throw new Error("AI input required");
  }

  const result = await AIEngine.process(input);

  return {
    success: true,
    action: "ai_decision",
    result,
    processedAt: new Date().toISOString(),
  };
};