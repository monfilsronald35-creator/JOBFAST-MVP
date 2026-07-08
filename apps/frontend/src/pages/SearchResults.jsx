import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* ======================================================
   🟢 SOCKET PLACEHOLDER (READY FOR BACKEND)
====================================================== */
const socket = {
  on: (_event, _cb) => {},
  off: (_event) => {},
};

/* ======================================================
   MOCK DATA
====================================================== */
const MOCK_RESULTS = [
  {
    id: 1,
    name: "Mason",
    distance: 2.5,
    location: "Bavaro",
    rate: "USD 50 / jou",
    status: "available",
    rating: 4.7,
    reviews: 120,
    phone: "+1 809 000 1111",
    lat: 18.685,
    lng: -68.419,
  },
  {
    id: 2,
    name: "Mason",
    distance: 2.8,
    location: "Veron",
    rate: "USD 45 / jou",
    status: "busy",
    rating: 4.2,
    reviews: 88,
    phone: "+1 809 000 2222",
    lat: 18.7,
    lng: -68.43,
  },
];

/* ======================================================
   COMPONENT
====================================================== */
export default function SearchResults() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("Mason");
  const [maxDistance, setMaxDistance] = useState(10);
  const [availableOnly, setAvailableOnly] = useState(false);

  const [workers, setWorkers] = useState(MOCK_RESULTS);
  const [callingId, setCallingId] = useState(null);

  /* ================= SOCKET LIVE ================= */
  useEffect(() => {
    const handler = (updated) => {
      setWorkers((prev) =>
        prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w))
      );
    };

    socket.on("worker_status_change", handler);

    return () => {
      socket.off("worker_status_change");
    };
  }, []);

  /* ================= FILTER ENGINE ================= */
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    return workers.filter((w) => {
      const matchQuery = w.name?.toLowerCase().includes(q);
      const matchDistance = Number(w.distance || 0) <= maxDistance;
      const matchStatus = availableOnly ? w.status === "available" : true;

      return matchQuery && matchDistance && matchStatus;
    });
  }, [query, maxDistance, availableOnly, workers]);

  /* ================= ACTIONS ================= */
  const callWorker = useCallback((phone, id) => {
    if (!phone) return;

    setCallingId(id);

    setTimeout(() => {
      window.location.href = `tel:${phone}`;
      setCallingId(null);
    }, 300);
  }, []);

  const openChat = useCallback((id) => navigate(`/chat/${id}`), [navigate]);
  const openRating = useCallback((id) => navigate(`/rating/${id}`), [navigate]);
  const openBooking = useCallback((id) => navigate(`/booking/${id}`), [navigate]);
  const openMap = useCallback(
    (lat, lng) => navigate(`/map?lat=${lat}&lng=${lng}`),
    [navigate]
  );

  return (
    <div className="min-h-screen w-full bg-[#0B1528] text-white flex flex-col pb-28">

      {/* SEARCH */}
      <div className="px-5 pt-6 pb-3 max-w-md mx-auto">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 bg-[#162238] rounded-xl text-xs"
          placeholder="Search workers..."
        />
      </div>

      {/* FILTERS */}
      <div className="px-5 flex gap-2 text-[11px] max-w-md mx-auto">
        <button
          onClick={() => setAvailableOnly((p) => !p)}
          className={`px-3 py-2 rounded-lg ${
            availableOnly ? "bg-emerald-500 text-black" : "bg-[#162238]"
          }`}
        >
          🟢 Available
        </button>

        {[2, 5, 10].map((d) => (
          <button
            key={d}
            onClick={() => setMaxDistance(d)}
            className={`px-3 py-2 rounded-lg ${
              maxDistance === d ? "bg-amber-500 text-black" : "bg-[#162238]"
            }`}
          >
            📍 {d} km
          </button>
        ))}
      </div>

      {/* RESULTS */}
      <div className="px-5 mt-4 flex-1 flex flex-col gap-3 max-w-md mx-auto overflow-y-auto">

        {filtered.length === 0 ? (
          <div className="text-center text-slate-400 mt-10">
            <p>No mason found 😕</p>
          </div>
        ) : (
          filtered.map((w) => (
            <div
              key={w.id}
              className="p-4 bg-[#162238] rounded-xl flex justify-between"
            >

              {/* LEFT */}
              <div>
                <h3 className="font-bold">{w.name}</h3>

                <p className="text-[10px] text-slate-400">
                  📍 {w.distance} km • {w.location}
                </p>

                <button
                  onClick={() => openMap(w.lat, w.lng)}
                  className="text-blue-400 text-[10px] mt-2"
                >
                  🗺 Map
                </button>
              </div>

              {/* RIGHT */}
              <div className="flex flex-col items-end gap-1">

                <span className="text-yellow-400 text-xs font-bold">
                  ⭐ {w.rating} ({w.reviews})
                </span>

                <span className={`text-[10px] ${
                  w.status === "available"
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}>
                  {w.status}
                </span>

                <span className="text-amber-400 text-xs font-bold">
                  {w.rate}
                </span>

                <button
                  onClick={() => callWorker(w.phone, w.id)}
                  className={`px-2 py-1 text-[10px] rounded font-bold ${
                    callingId === w.id
                      ? "bg-gray-500"
                      : "bg-green-500 text-black"
                  }`}
                >
                  {callingId === w.id ? "Calling..." : "📞 Call"}
                </button>

                <button onClick={() => openChat(w.id)} className="text-blue-400 text-[10px]">
                  💬 Chat
                </button>

                <button onClick={() => openRating(w.id)} className="text-yellow-400 text-[10px]">
                  ⭐ Rate
                </button>

                <button onClick={() => openBooking(w.id)} className="text-purple-400 text-[10px]">
                  💳 Book
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}