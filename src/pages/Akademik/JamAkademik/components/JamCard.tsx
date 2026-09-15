import React from "react";
import { Card } from "@/components/ui/card";
import { Edit2, Trash2, BookOpen, Coffee, Moon, Flag, Star, Zap, HelpCircle } from "lucide-react";
import type { JamAkademikUI } from "../hooks/useJamAkademik";

interface JamCardProps {
  jam: JamAkademikUI;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const JamCard: React.FC<JamCardProps> = ({
  jam,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}) => {
  const getTipeBadge = (tipe: string) => {
    switch (tipe) {
      case "Belajar":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-100",
          icon: <BookOpen className="w-3.5 h-3.5 mr-1" />
        };
      case "Istirahat":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-100",
          icon: <Coffee className="w-3.5 h-3.5 mr-1" />
        };
      case "Sholat Dhuha & Halaqoh":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
          icon: <Moon className="w-3.5 h-3.5 mr-1" />
        };
      case "Apel":
        return {
          bg: "bg-sky-50 text-sky-700 border-sky-100",
          icon: <Flag className="w-3.5 h-3.5 mr-1" />
        };
      case "Mapel Pilihan / Bimbingan TKA":
        return {
          bg: "bg-violet-50 text-violet-700 border-violet-100",
          icon: <Star className="w-3.5 h-3.5 mr-1" />
        };
      case "Bonding / Life Skill":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-100",
          icon: <Zap className="w-3.5 h-3.5 mr-1" />
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-100",
          icon: <HelpCircle className="w-3.5 h-3.5 mr-1" />
        };
    }
  };

  const badge = getTipeBadge(jam.tipe);

  return (
    <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-150 hover:shadow-md transition-shadow bg-white rounded-xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 text-[#243B7A] rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100/50">
          {jam.urutanJam}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-800">
              Jam Ke-{jam.urutanJam}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
              {badge.icon}
              {jam.tipe}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mt-1">
            {jam.jamMulai}–{jam.jamSelesai} WIB
          </p>
          <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
            {jam.lembagaSingkatan && jam.lembaga !== jam.lembagaSingkatan ? `${jam.lembaga} (${jam.lembagaSingkatan})` : jam.lembaga}
          </span>
        </div>
      </div>

      {(canUpdate || canDelete) && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t md:border-t-0 md:pt-0 border-gray-100 shrink-0">
          {canUpdate && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Edit Jam"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Hapus Jam"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus</span>
            </button>
          )}
        </div>
      )}
    </Card>
  );
};
