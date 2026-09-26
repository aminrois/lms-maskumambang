import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  FileDown,
  KeyRound,
  Shield,
  Copy,
  Check,
  Building2,
  Users,
} from "lucide-react";
import { restClient } from "../../../lib/api/axios";
import { getRoles, getUserById, updateUserAuth, createUserAuth } from "../../../lib/api/services/userService";
import { updatePegawai } from "../../../lib/api/services/masterService";
import { useAuthStore } from "../../../store/useAuthStore";
import { toast } from "sonner";

export default function MasterDataPegawaiDetail() {
  const { pegawai_id } = useParams<{ pegawai_id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userRole = useAuthStore((state) => state.role);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Fetch Pegawai Detail with relations
  const { data: pegawai, isLoading } = useQuery({
    queryKey: ["pegawai-detail", pegawai_id],
    queryFn: async () => {
      const res = await restClient.get("/pegawai", {
        params: {
          pegawai_id: `eq.${pegawai_id}`,
          select: "*, pegawai_lembaga(lembaga(lembaga_id, nama_lembaga, singkatan)), kelas_wali(kelas_id, nama_kelas), tahfidz_halaqah(halaqah_id, nama_halaqah)",
        },
      });
      return res.data?.[0] || null;
    },
    enabled: !!pegawai_id,
  });

  // Fetch User Account data if linked
  const userAccountQuery = useQuery({
    queryKey: ["userAccount", pegawai?.user_id],
    queryFn: () => getUserById(pegawai.user_id),
    enabled: !!pegawai?.user_id,
  });

  // Fetch all user roles relation
  const { data: userRolesData = [] } = useQuery({
    queryKey: ["user-roles-detail", pegawai?.user_id],
    queryFn: async () => {
      if (!pegawai?.user_id) return [];
      const res = await restClient.get("/user_role", {
        params: {
          user_id: `eq.${pegawai.user_id}`,
          select: "role(nama_role), lembaga(singkatan, nama_lembaga)",
        },
      });
      return res.data || [];
    },
    enabled: !!pegawai?.user_id,
  });

  // Fetch available roles for display
  useQuery({
    queryKey: ["roles-list"],
    queryFn: getRoles,
    staleTime: 10 * 60 * 1000,
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => updateUserAuth({ user_id: userId, password: "password123" }),
    onSuccess: () => toast.success("Password berhasil di-reset ke default (password123)"),
    onError: () => toast.error("Gagal me-reset password."),
  });

  // Create Account Mutation
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      if (!pegawai) return;
      const nig = pegawai.nig;
      if (!nig) throw new Error("NIG pegawai wajib ada untuk membuat akun.");
      const email = `${nig.trim()}@mlms.local`;
      const username = nig.trim();

      const createdUser = await createUserAuth({ email, password: "password123", username });
      const userId = createdUser?.user?.id || createdUser?.id || createdUser?.user_id;
      if (!userId) throw new Error("Gagal mendapatkan ID user dari server.");

      await updatePegawai(pegawai.pegawai_id, { user_id: userId });
      return userId;
    },
    onSuccess: () => {
      toast.success("Akun login pegawai berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["pegawai-detail", pegawai_id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal membuat akun login pegawai.");
    },
  });

  // Helper functions
  const fld = (v: any) => v || "—";
  const calculateAge = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const birth = new Date(dateStr);
    if (isNaN(birth.getTime())) return "—";
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age >= 0 ? `${age} tahun` : "—";
  };

  const totalAnak = (Number(pegawai?.jumlah_anak_laki || 0) + Number(pegawai?.jumlah_anak_perempuan || 0)) || 0;
  const lembagaListText = pegawai?.pegawai_lembaga?.map((pl: any) => pl.lembaga?.singkatan || pl.lembaga?.nama_lembaga).filter(Boolean).join(", ") || "Global / Seluruh Lembaga";

  // PDF Generator
  const handleDownloadPDF = () => {
    if (!pegawai) return;
    setIsDownloadingPDF(true);

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Profil Pegawai — ${fld(pegawai.nama)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
    body { padding: 32px; color: #1e293b; font-size: 11px; }
    h1 { font-size: 18px; font-weight: 800; color: #162E6E; margin-bottom: 2px; }
    h2 { font-size: 12px; font-weight: 700; color: #162E6E; background: #e0e7ff; padding: 6px 10px; border-radius: 6px; margin-bottom: 10px; margin-top: 18px; }
    .header { display: flex; gap: 20px; align-items: flex-start; border-bottom: 2px solid #162E6E; padding-bottom: 16px; margin-bottom: 4px; }
    .avatar-placeholder { width: 80px; height: 80px; border-radius: 10px; background: #162E6E; color: white; font-size: 28px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
    .row { border-bottom: 1px solid #f1f5f9; padding: 4px 0; }
    .label { color: #64748b; font-size: 10px; }
    .value { font-weight: 600; color: #1e293b; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="avatar-placeholder">${(pegawai.nama || "P").charAt(0)}</div>
    </div>
    <div>
      <h1>${fld(pegawai.nama)}</h1>
      <p style="color:#475569;margin-bottom:6px">NIG: <strong>${fld(pegawai.nig)}</strong> &nbsp;|&nbsp; NIP: ${fld(pegawai.nip)} &nbsp;|&nbsp; NIK: ${fld(pegawai.nik)}</p>
      <span class="badge ${pegawai.status === 'Aktif' ? 'badge-green' : 'badge-red'}">${fld(pegawai.status)}</span>
      &nbsp;
      <span class="badge badge-blue">Jabatan: ${fld(pegawai.jabatan)}</span>
      &nbsp;
      <span class="badge" style="background:#f1f5f9;color:#334155">Lembaga: ${lembagaListText}</span>
      <p style="color:#64748b;margin-top:6px;font-size:10px">Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>

  <h2>A. IDENTITAS PRIBADI</h2>
  <div class="grid">
    <div class="row"><div class="label">Nama Lengkap</div><div class="value">${fld(pegawai.nama)}</div></div>
    <div class="row"><div class="label">NIG (Nomor Induk Guru)</div><div class="value">${fld(pegawai.nig)}</div></div>
    <div class="row"><div class="label">NIP</div><div class="value">${fld(pegawai.nip)}</div></div>
    <div class="row"><div class="label">NIK (KTP)</div><div class="value">${fld(pegawai.nik)}</div></div>
    <div class="row"><div class="label">Jenis Kelamin</div><div class="value">${pegawai.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div></div>
    <div class="row"><div class="label">Tempat, Tanggal Lahir</div><div class="value">${fld(pegawai.tempat_lahir)}, ${fld(pegawai.tanggal_lahir)}</div></div>
    <div class="row"><div class="label">Umur</div><div class="value">${calculateAge(pegawai.tanggal_lahir)}</div></div>
    <div class="row"><div class="label">Golongan Darah</div><div class="value">${fld(pegawai.golongan_darah)}</div></div>
    <div class="row"><div class="label">No. Handphone / WhatsApp</div><div class="value">${fld(pegawai.no_hp)}</div></div>
  </div>
  <div class="row" style="margin-top:6px">
    <div class="label">Alamat Lengkap</div>
    <div class="value">${fld(pegawai.alamat)}</div>
  </div>

  <h2>B. KEPEGAWAIAN & TUGAS</h2>
  <div class="grid">
    <div class="row"><div class="label">Jabatan Utama</div><div class="value">${fld(pegawai.jabatan)}</div></div>
    <div class="row"><div class="label">Tugas Tambahan</div><div class="value">${fld(pegawai.tugas_tambahan)}</div></div>
    <div class="row"><div class="label">Status Kepegawaian</div><div class="value">${fld(pegawai.status)}</div></div>
    <div class="row"><div class="label">Penempatan Lembaga</div><div class="value">${lembagaListText}</div></div>
  </div>

  <h2>C. DATA KELUARGA</h2>
  <div class="grid">
    <div class="row"><div class="label">Nama Ayah</div><div class="value">${fld(pegawai.nama_ayah)}</div></div>
    <div class="row"><div class="label">Nama Ibu</div><div class="value">${fld(pegawai.nama_ibu)}</div></div>
    <div class="row"><div class="label">Jumlah Anak (Laki-laki)</div><div class="value">${pegawai.jumlah_anak_laki ?? 0} anak</div></div>
    <div class="row"><div class="label">Jumlah Anak (Perempuan)</div><div class="value">${pegawai.jumlah_anak_perempuan ?? 0} anak</div></div>
    <div class="row"><div class="label">Total Tanggungan Anak</div><div class="value">${totalAnak} anak</div></div>
  </div>

  <h2>D. INFORMASI AKUN SISTEM</h2>
  <div class="grid">
    <div class="row"><div class="label">Username Login</div><div class="value">${fld(userAccountQuery.data?.username || pegawai.nig)}</div></div>
    <div class="row"><div class="label">Status Akun</div><div class="value">${pegawai.user_id ? 'Terdaftar & Aktif' : 'Belum Memiliki Akun Login'}</div></div>
    <div class="row"><div class="label">Hak Akses / Roles</div><div class="value">${userRolesData.map((ur: any) => ur.role?.nama_role).filter(Boolean).join(', ') || 'Belum Ada Role'}</div></div>
  </div>

  <div style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center;color:#94a3b8;font-size:10px">
    Dicetak dari Sistem Informasi Manajemen Kepegawaian YKUI Maskumambang
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Popup diblokir browser. Izinkan popup untuk mencetak PDF.");
      setIsDownloadingPDF(false);
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      setIsDownloadingPDF(false);
    }, 600);
  };

  // Helper Section & Info Field
  const SectionHeader = ({ label, sub }: { label: string; sub?: string }) => (
    <div className="border-b border-slate-200 pb-3 mb-4">
      <h3 className="text-sm font-bold text-[#162E6E]">{label}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );

  const InfoField = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5 uppercase tracking-wide">{label}</span>
      <span className="text-xs font-bold text-slate-800">{value || "—"}</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[#162E6E] border-t-amber-400 animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Memuat profil pegawai...</span>
      </div>
    );
  }

  if (!pegawai) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-slate-600 font-semibold">Data pegawai tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-[#162E6E] text-white rounded-xl text-xs font-bold">
          Kembali ke Daftar Pegawai
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all cursor-pointer shrink-0 self-start"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-gradient-to-tr from-[#162E6E] to-[#254ea8] text-white font-bold text-3xl flex items-center justify-center shrink-0">
            {pegawai?.nama?.charAt(0) || "P"}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold text-slate-800">{pegawai.nama}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  pegawai.status === "Aktif"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {pegawai.status || "Aktif"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              NIG: <b className="text-slate-700 font-semibold">{pegawai.nig || "—"}</b>
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="bg-[#162E6E]/10 text-[#162E6E] px-2.5 py-1 rounded-lg text-xs font-bold">
                {pegawai.jabatan || "Pegawai"}
              </span>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                {lembagaListText}
              </span>
              {pegawai.tugas_tambahan && (
                <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-semibold border border-amber-200">
                  {pegawai.tugas_tambahan}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            {isDownloadingPDF ? "Menyiapkan..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* ── DETAIL PROFILE CONTENT (ALL-IN-ONE) ────────────────────────────── */}
      <div className="space-y-6">
        {/* A. IDENTITAS PRIBADI */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <SectionHeader label="A. Identitas Pribadi" sub="Data identitas pokok terdaftar di database kepegawaian" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <InfoField label="Nama Lengkap" value={pegawai.nama} />
            <InfoField label="NIG (Nomor Induk Guru)" value={pegawai.nig} />
            <InfoField label="NIP" value={pegawai.nip} />
            <InfoField label="NIK (KTP)" value={pegawai.nik} />
            <InfoField label="Jenis Kelamin" value={pegawai.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} />
            <InfoField label="Tempat Lahir" value={pegawai.tempat_lahir} />
            <InfoField
              label="Tanggal Lahir"
              value={
                pegawai.tanggal_lahir
                  ? new Date(pegawai.tanggal_lahir).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"
              }
            />
            <InfoField label="Umur" value={calculateAge(pegawai.tanggal_lahir)} />
            <InfoField label="Golongan Darah" value={pegawai.golongan_darah} />
            <InfoField label="No. Handphone / WA" value={pegawai.no_hp} />
            <InfoField label="Status Kepegawaian" value={pegawai.status} />
            <div className="sm:col-span-2 md:col-span-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5 uppercase tracking-wide">
                Alamat Lengkap
              </span>
              <span className="text-xs font-bold text-slate-800">{pegawai.alamat || "—"}</span>
            </div>
          </div>
        </div>

        {/* B. KEPEGAWAIAN & TUGAS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <SectionHeader label="B. Kepegawaian & Tugas Lembaga" sub="Penempatan unit lembaga dan beban tugas" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <InfoField label="Jabatan Utama" value={pegawai.jabatan} />
            <InfoField label="Tugas Tambahan" value={pegawai.tugas_tambahan} />
            <InfoField label="Penempatan Lembaga" value={lembagaListText} />
            {pegawai.kelas_wali && pegawai.kelas_wali.length > 0 && (
              <div className="sm:col-span-2 md:col-span-3 bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
                <span className="text-[10px] font-bold text-blue-700 block mb-1 uppercase tracking-wide flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Amanah Wali Kelas
                </span>
                <span className="text-xs font-bold text-blue-950">
                  {pegawai.kelas_wali.map((k: any) => k.nama_kelas).join(", ")}
                </span>
              </div>
            )}
            {pegawai.tahfidz_halaqah && pegawai.tahfidz_halaqah.length > 0 && (
              <div className="sm:col-span-2 md:col-span-3 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 block mb-1 uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Pengampu Halaqah Tahfidz
                </span>
                <span className="text-xs font-bold text-emerald-950">
                  {pegawai.tahfidz_halaqah.map((h: any) => h.nama_halaqah).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* C. DATA KELUARGA */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <SectionHeader label="C. Data Keluarga" sub="Informasi orang tua kandung dan tanggungan anak" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <InfoField label="Nama Ayah" value={pegawai.nama_ayah} />
            <InfoField label="Nama Ibu" value={pegawai.nama_ibu} />
            <InfoField label="Jumlah Anak (Laki-laki)" value={`${pegawai.jumlah_anak_laki ?? 0} anak`} />
            <InfoField label="Jumlah Anak (Perempuan)" value={`${pegawai.jumlah_anak_perempuan ?? 0} anak`} />
            <InfoField label="Total Anak" value={`${totalAnak} anak`} />
          </div>
        </div>

        {/* D. INFORMASI AKUN LOGIN & HAK AKSES SISTEM */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <SectionHeader label="D. Akun Login & Hak Akses Sistem" sub="Kredensial login ke portal LMS / SIAKAD" />
          <div className="space-y-4">
            {pegawai.user_id ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-0.5 uppercase tracking-wide">
                      Username Login
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {userAccountQuery.data?.username || pegawai.nig}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-0.5 uppercase tracking-wide">
                      Status Akun
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      Aktif & Terhubung
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-0.5 uppercase tracking-wide">
                      User ID
                    </span>
                    <div className="flex items-center gap-1.5">
                      <code className="text-[11px] font-mono text-slate-700 truncate max-w-[140px]">
                        {pegawai.user_id}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pegawai.user_id);
                          setCopiedUserId(true);
                          setTimeout(() => setCopiedUserId(false), 2000);
                        }}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                        title="Salin User ID"
                      >
                        {copiedUserId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role / Hak Akses List */}
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" /> Hak Akses / Roles Terdaftar:
                  </span>
                  {userRolesData.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userRolesData.map((ur: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold"
                        >
                          {ur.role?.nama_role} {ur.lembaga ? `(${ur.lembaga.singkatan || ur.lembaga.nama_lembaga})` : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Belum ada role khusus yang diberikan.</span>
                  )}
                </div>

                {/* Reset Password Button for Admin */}
                {(userRole === "Super Admin" || userRole === "Direktur") && (
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Lupa password akun pegawai ini?</span>
                    <button
                      onClick={() => {
                        if (window.confirm("Reset password pegawai ini ke password123?")) {
                          resetPasswordMutation.mutate(pegawai.user_id);
                        }
                      }}
                      disabled={resetPasswordMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      {resetPasswordMutation.isPending ? "Memproses..." : "Reset ke Password Default"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="font-bold text-xs text-amber-900 block">Pegawai Ini Belum Memiliki Akun Login</span>
                  <p className="text-xs text-amber-700">
                    Buat akun login agar pegawai dapat mengakses LMS dengan username berupa NIG dan password awal{" "}
                    <code>password123</code>.
                  </p>
                </div>
                {(userRole === "Super Admin" || userRole === "Direktur") && (
                  <button
                    onClick={() => createAccountMutation.mutate()}
                    disabled={createAccountMutation.isPending}
                    className="px-4 py-2 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    {createAccountMutation.isPending ? "Membuat Akun..." : "Buat Akun Login Sekarang"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
