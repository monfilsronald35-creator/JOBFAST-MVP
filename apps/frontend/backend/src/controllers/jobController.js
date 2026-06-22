// ======================================================
// 📌 SAVE JOB
// ======================================================

export const saveJob = asyncHandler(async (req, res) => {
  const result = await jobService.saveJob({
    userId: req.user.id,
    jobId: req.params.id,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Job saved successfully",
    data: result,
  });
});

// ======================================================
// ❌ UNSAVE JOB
// ======================================================

export const unsaveJob = asyncHandler(async (req, res) => {
  const result = await jobService.unsaveJob({
    userId: req.user.id,
    jobId: req.params.id,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Job removed from saved list",
    data: result,
  });
});

// ======================================================
// ❤️ GET SAVED JOBS
// ======================================================

export const getSavedJobs = asyncHandler(async (req, res) => {
  const jobs = await jobService.getSavedJobs(req.user.id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: jobs,
  });
});

// ======================================================
// 📨 APPLY TO JOB
// ======================================================

export const applyToJob = asyncHandler(async (req, res) => {
  const application = await jobService.apply({
    jobId: req.params.id,
    workerId: req.user.id,
    coverLetter: req.body.coverLetter,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: "Application submitted successfully",
    data: application,
  });
});

// ======================================================
// 📋 GET JOB APPLICATIONS
// ======================================================

export const getJobApplications = asyncHandler(async (req, res) => {
  const applications =
    await jobService.getApplications(
      req.params.id
    );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: applications,
  });
});

// ======================================================
// ✅ ACCEPT APPLICATION
// ======================================================

export const acceptApplication =
  asyncHandler(async (req, res) => {
    const result =
      await jobService.acceptApplication({
        applicationId: req.params.applicationId,
        adminId: req.user.id,
      });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Application accepted",
      data: result,
    });
  });

// ======================================================
// ❌ REJECT APPLICATION
// ======================================================

export const rejectApplication =
  asyncHandler(async (req, res) => {
    const result =
      await jobService.rejectApplication({
        applicationId: req.params.applicationId,
        reason: req.body.reason,
        adminId: req.user.id,
      });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Application rejected",
      data: result,
    });
  });

// ======================================================
// 🚨 GET REPORTED JOBS
// ======================================================

export const getReportedJobs =
  asyncHandler(async (req, res) => {
    const jobs =
      await jobService.getReportedJobs(
        req.query
      );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: jobs,
    });
  });

// ======================================================
// 🧹 PERMANENT DELETE
// ======================================================

export const permanentlyDeleteJob =
  asyncHandler(async (req, res) => {
    await jobService.permanentlyDelete(
      req.params.id,
      req.user.id
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Job permanently deleted",
    });
  });

// ======================================================
// 📝 JOB AUDIT LOGS
// ======================================================

export const getJobAuditLogs =
  asyncHandler(async (req, res) => {
    const logs =
      await jobService.getAuditLogs(
        req.params.id
      );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: logs,
    });
  });

// ======================================================
// 📈 JOB ANALYTICS
// ======================================================

export const getJobAnalytics =
  asyncHandler(async (req, res) => {
    const analytics =
      await jobService.getAnalytics(
        req.params.id
      );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: analytics,
    });
  });

// ======================================================
// 👁️ INCREMENT VIEW COUNT
// ======================================================

export const incrementJobView =
  asyncHandler(async (req, res) => {
    await jobService.incrementView(
      req.params.id
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
    });
  });

// ======================================================
// 📌 PIN JOB
// ======================================================

export const pinJob = asyncHandler(async (req, res) => {
  const job = await jobService.pin(
    req.params.id,
    req.user.id
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Job pinned successfully",
    data: job,
  });
});

// ======================================================
// 📍 UNPIN JOB
// ======================================================

export const unpinJob = asyncHandler(async (req, res) => {
  const job = await jobService.unpin(
    req.params.id,
    req.user.id
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Job unpinned successfully",
    data: job,
  });
});