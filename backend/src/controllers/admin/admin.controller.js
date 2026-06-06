// =========================================================================
// 👑 JOBFAST ENTERPRISE SYSTEM — ADMINISTRATIVE CORE CONTROLLER (WAR ROOM)
// =========================================================================
import crypto from 'crypto';
import { usersDatabase } from '../auth/register.controller.js'; // Koneksyon dirèkteman ak baz done memwa a

/**
 * @desc    Mwayen Sekirite Entèn pou verifye si se vrèman Admin lan k ap gade done yo
 */
const verifyAdminAccess = (req) => {
  // Nan yon sistèm pwodiksyon avanse, nou tcheke req.user.role ki soti nan authMiddleware lan
  // Pou kounye a, nou ka pase imèl la nan headers oswa query pou tès rapid
  const adminEmail = req.headers['x-admin-email'] || req.query.adminEmail;
  return adminEmail === 'ronald@jobfast.com' || adminEmail === 'admin@jobfast.com';
};

/**
 * @desc    📊 Rekipere Estatistik Global ak Dashboard Dashboard an tan reyèl
 * @route   GET /api/v1/admin/stats
 * @access  Private (Admin Only)
 */
export const getAdminStats = async (req, res, next) => {
  const requestId = req.id || crypto.randomUUID();

  try {
    // 🛡️ Tcheke si se Ronald oswa Admin lan k ap gade
    if (!verifyAdminAccess(req)) {
      return res.status(403).json({
        success: false,
        error: { code: "UNAUTHORIZED_ADMIN_ACCESS", message: "Aksè refize. Ou pa gen pèmisyon pou w antre nan sant kontwòl sa a.", requestId }
      });
    }

    const allUsers = Array.from(usersDatabase.values());

    // Kalkile estatistik yo dinamikman daprè moun ki anrejistre yo
    const totalUsers = allUsers.length;
    const constructionUsers = allUsers.filter(u => u.accountType === 'individual').length;
    const businessUsers = allUsers.filter(u => u.accountType === 'business').length;
    
    const activeWorkers = allUsers.filter(u => u.availability === 'available').length;
    const busyWorkers = allUsers.filter(u => u.availability === 'busy' || u.availability === 'working').length;

    return res.status(200).json({
      success: true,
      meta: { version: "1.0.0", timestamp: new Date().toISOString(), requestId },
      data: {
        summary: {
          totalRegistered: totalUsers,
          constructionSystem: constructionUsers,
          businessDirectory: businessUsers,
          liveMetrics: {
            availableNow: activeWorkers,
            busyOrOnChantier: busyWorkers
          }
        }
      }
    });

  } catch (error) {
    console.error(`[ADMIN STATS FATAL] [RID: ${requestId}] ${error.message}`);
    next(error);
  }
};

/**
 * @desc    👥 Kontwòl Jeneral: Gade TOUT moun ki anrejistre, KI KOTE yo ye, ak KI LÈ
 * @route   GET /api/v1/admin/users
 * @access  Private (Admin Only)
 */
export const getAllUsers = async (req, res, next) => {
  const requestId = req.id || crypto.randomUUID();

  try {
    // 🛡️ Tcheke sekirite Admin
    if (!verifyAdminAccess(req)) {
      return res.status(403).json({
        success: false,
        error: { code: "UNAUTHORIZED_ADMIN_ACCESS", message: "Aksè refize. Zòn sa a pwoteje.", requestId }
      });
    }

    const allUsers = Array.from(usersDatabase.values());

    // Katografye done yo yon fason pou yo klè net vizyèlman pou panèl la
    const userAuditList = allUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      status: user.availability,
      
      // 📍 KI KOTE: Detay GPS Nèt ale
      trackingLocation: {
        city: user.location.city,
        state: user.location.state,
        country: user.location.country,
        exactGPS: {
          lat: user.location.coordinates.latitude,
          lng: user.location.coordinates.longitude
        }
      },

      // ⏱️ KI LÈ: Dat Kreyasyon ak Dènye Koneksyon
      timeline: {
        registeredAt: user.createdAt, // Lè li te kreye kont lan
        lastActivity: user.lastLogin,  // Lè li te konekte pou dènye fwa
        accountAgeDays: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
      }
    }));

    console.log(`[ADMIN AUDIT] [RID: ${requestId}] Ronald checked user directory. Total records: ${userAuditList.length}`);

    return res.status(200).json({
      success: true,
      meta: {
        totalRecords: userAuditList.length,
        requestId
      },
      data: userAuditList
    });

  } catch (error) {
    console.error(`[ADMIN AUDIT FATAL] [RID: ${requestId}] ${error.message}`);
    next(error);
  }
};

/**
 * @desc    🚫 MODERATION ENGINE: Efase oswa bloke yon kont ki sispèk imedyatman
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private (Admin Only)
 */
export const kickUser = async (req, res, next) => {
  const requestId = req.id || crypto.randomUUID();
  const { id } = req.params;

  try {
    if (!verifyAdminAccess(req)) {
      return res.status(403).json({ success: false, error: { message: "Aksè refize.", requestId } });
    }

    if (!usersDatabase.has(id)) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "Itilizatè sa a pa egziste nan sistèm lan.", requestId }
      });
    }

    const userDetails = usersDatabase.get(id);
    usersDatabase.delete(id); // Efase kont lan nan memwa a nèt ale

    console.log(`[ADMIN ACTION] User ${userDetails.name} (${userDetails.email}) has been kicked out by Admin.`);

    return res.status(200).json({
      success: true,
      message: `Kont ${userDetails.name} lan efase nan sistèm lan ak siksè nèt vizib.`
    });

  } catch (error) {
    next(error);
  }
};

