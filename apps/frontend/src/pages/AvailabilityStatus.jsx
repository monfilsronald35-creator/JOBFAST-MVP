import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { CheckCircle, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import Button from "../components/Button";

/* ================= SOCKET ================= */
const socket = io("http://localhost:5000", {
  autoConnect: false,
  reconnection: true,
});

const STATUS_OPTIONS = [
  {
    id: "available",
    title: "DISPONIB",
    description: "Mwen disponib pou travay. M ap resevwa òf imedyatman.",
    icon: CheckCircle,
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  {
    id: "busy",
    title: "OKIPE",
    description: "M ap travay kounye a. Nouvo òf yo limite.",
    icon: Clock,
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  {
    id: "unavailable",
    title: "PA DISPONIB",
    description: "M pa disponib pou moman sa.",
    icon: AlertCircle,
    badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  },
];

export default function AvailabilityStatus() {
  const navigate = useNavigate();

  const [selectedStatus, setSelectedStatus] = useState("available");
  const [isSaving, setIsSaving] = useState(false);
  const [userId] = useState("USER_ID_MOCK"); // 🔐 replace with auth user

  /* ================= SOCKET CONNECT ================= */
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("🟢 Connected");
      socket.emit("join:user", userId);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  /* ================= SAVE STATUS ================= */
  const handleSaveStatus = useCallback(async () => {
    setIsSaving(true);

    try {
      // 1. API update (MongoDB)
      await fetch("http://localhost:5000/api/user/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          status: selectedStatus,
        }),
      });

      // 2. SOCKET broadcast real-time
      socket.emit("worker:status:update", {
        id: userId,
        status: selectedStatus,
      });

      // 3. UI feedback
      setTimeout(() => {
        setIsSaving(false);
        navigate("/dashboard");
      }, 600);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  }, [selectedStatus, userId, navigate]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-navy-900 text-white pb-10">

      {/* HEADER */}
      <header className="mx-auto flex max-w-sm w-full items-center justify-between px-5 pt-6 pb-4 border-b border-slate-800/50">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </button>

        <h1 className="text-xs font-black uppercase tracking-widest">
          Estati Disponibilite
        </h1>

        <div />
      </header>

      {/* CONTENT */}
      <main className="flex-1 max-w-sm mx-auto w-full px-5 py-6">
        <p className="text-xs text-slate-400 mb-5">
          Mete estati ou pou sistèm nan ka voye travay an tan reyèl.
        </p>

        <div className="flex flex-col gap-3">
          {STATUS_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = selectedStatus === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => setSelectedStatus(opt.id)}
                className={`flex gap-4 p-4 rounded-2xl border transition ${
                  active
                    ? "border-yellow-400 bg-navy-800/30"
                    : "border-slate-800/60"
                }`}
              >
                <div className={`p-2 rounded-xl ${opt.badgeClass}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="text-left">
                  <h3 className="text-xs font-bold">{opt.title}</h3>
                  <p className="text-[10px] text-slate-400">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-sm mx-auto w-full px-5">
        <Button
          loading={isSaving}
          onClick={handleSaveStatus}
          className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl"
        >
          Mete ajou
        </Button>
      </footer>
    </div>
  );
}