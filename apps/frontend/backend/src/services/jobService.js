// ======================================================
// 🧠 SAFE NUMBER CHECK
// ======================================================

const isValidNumber = (v) =>
  typeof v === "number" && !isNaN(v) && isFinite(v);

// ======================================================
// 📍 GET NEAREST JOBS
// ======================================================

export const getNearestJobs = (
  jobs,
  userLat,
  userLon,
  limit = 10,
  radiusKm = 10
) => {
  if (!Array.isArray(jobs)) throw new Error("Jobs must be an array");
  if (![userLat, userLon].every(isValidNumber)) return [];

  return filterJobsByDistance(jobs, userLat, userLon, radiusKm).slice(
    0,
    limit
  );
};

// ======================================================
// 📊 SCORE JOB (OPTIMIZED - NO DOUBLE CALCULATION)
// ======================================================

export const scoreJobMatch = (job, userLat, userLon, distanceKm = null) => {
  if (!job?.location) return 0;
  if (![userLat, userLon].every(isValidNumber)) return 0;

  const distance =
    distanceKm ??
    calculateDistanceKm(
      userLat,
      userLon,
      job.location.lat,
      job.location.lng
    );

  const distanceScore = Math.max(0, 100 - distance * 5);
  const ratingScore = Math.min(50, (job.rating ?? 0) * 10);
  const urgencyScore = job.urgent ? 20 : 0;

  return Math.round(distanceScore + ratingScore + urgencyScore);
};

// ======================================================
// 📈 RANK JOBS (PERFORMANCE OPTIMIZED)
// ======================================================

export const rankJobsByScore = (jobs, userLat, userLon) => {
  if (!Array.isArray(jobs)) throw new Error("Jobs must be an array");
  if (![userLat, userLon].every(isValidNumber)) return [];

  return jobs
    .map((job) => {
      let distance = null;

      if (
        job?.location &&
        isValidNumber(job.location.lat) &&
        isValidNumber(job.location.lng)
      ) {
        distance = calculateDistanceKm(
          userLat,
          userLon,
          job.location.lat,
          job.location.lng
        );
      }

      return {
        ...job,
        distanceKm: distance != null ? Number(distance.toFixed(2)) : null,
        matchScore: scoreJobMatch(job, userLat, userLon, distance),
      };
    })
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore ||
        (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
    );
};