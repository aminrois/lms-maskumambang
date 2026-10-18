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
  Pencil,
  GraduationCap,
  School,
} from "lucide-react";
import { restClient } from "../../../lib/api/axios";
import { getRoles, getUserById, updateUserAuth, createUserAuth } from "../../../lib/api/services/userService";
import { updatePegawai } from "../../../lib/api/services/masterService";
import { useAuthStore } from "../../../store/useAuthStore";
import { usePermissions } from "../../../hooks/usePermissions";
import type { PEGAWAI_CREATE } from "../../../types/database";
import type { PegawaiUI } from "./hooks/usePegawaiData";
import AssignRoleModal from "./components/AssignRoleModal";
import PegawaiFormModal from "./components/PegawaiFormModal";
import { toast } from "sonner";

export default function MasterDataPegawaiDetail() {
  const { pegawai_id } = useParams<{ pegawai_id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userRole = useAuthStore((state) => state.role);
  const loggedInUser = useAuthStore((state) => state.user);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const { canUpdate } = usePermissions('pegawai');
  const { canRead: canReadRole } = usePermissions('user_role');

  const [formData, setFormData] = useState<PEGAWAI_CREATE & { lembaga_ids: number[] }>({
    nig: "",
    nip: "",
    nik: "",
    nama: "",
    jenis_kelamin: "L",
    tempat_lahir: "",
    tanggal_lahir: "",
    alamat: "",
    no_hp: "",
    email: "",
    status: "Aktif",
    jabatan: "Guru",
    tugas_tambahan: "",
    jumlah_anak_laki: undefined,
    jumlah_anak_perempuan: undefined,
    nama_ayah: "",
    nama_ibu: "",
    nama_pasangan: "",
    golongan_darah: "",
    pendidikan_tk_nama: "",
    pendidikan_tk_tahun_masuk: "",
    pendidikan_tk_tahun_lulus: "",
    pendidikan_sd_nama: "",
    pendidikan_sd_tahun_masuk: "",
    pendidikan_sd_tahun_lulus: "",
    pendidikan_smp_nama: "",
    pendidikan_smp_tahun_masuk: "",
    pendidikan_smp_tahun_lulus: "",
    pendidikan_sma_nama: "",
    pendidikan_sma_tahun_masuk: "",
    pendidikan_sma_tahun_lulus: "",
    pt_jenjang: "",
    pt_universitas: "",
    pt_fakultas: "",
    pt_jurusan: "",
    pt_prodi: "",
    pt_tahun_masuk: "",
    pt_tahun_lulus: "",
    user_id: "",
    lembaga_ids: [],
  });

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

  const isSelf = Boolean(
    (loggedInUser?.pegawai_id && Number(loggedInUser.pegawai_id) === Number(pegawai_id)) ||
    (pegawai?.user_id && loggedInUser?.user_id && pegawai.user_id === loggedInUser.user_id)
  );
  const canEdit = canUpdate || isSelf;

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

  // Edit Pegawai Mutation
  const updatePegawaiMutation = useMutation({
    mutationFn: async (data: PEGAWAI_CREATE & { lembaga_ids: number[] }) => {
      const { lembaga_ids, ...payload } = data;
      const editPayload: any = { ...payload };
      // Jika self-edit tanpa hak admin, kirim hanya field yang diperbolehkan
      if (!canUpdate && isSelf) {
        delete editPayload.status;
        delete editPayload.user_id;
        delete editPayload.nig;
        delete editPayload.jabatan;
        delete editPayload.tugas_tambahan;
      }
      // Jangan pernah kirim user_id kosong ke database
      if (!editPayload.user_id) {
        delete editPayload.user_id;
      }
      if (editPayload.tanggal_lahir === "") {
        editPayload.tanggal_lahir = null;
      }
      if (editPayload.jumlah_anak_laki === undefined || editPayload.jumlah_anak_laki === "" || editPayload.jumlah_anak_laki === null) {
        editPayload.jumlah_anak_laki = null;
      } else {
        editPayload.jumlah_anak_laki = Number(editPayload.jumlah_anak_laki);
      }
      if (editPayload.jumlah_anak_perempuan === undefined || editPayload.jumlah_anak_perempuan === "" || editPayload.jumlah_anak_perempuan === null) {
        editPayload.jumlah_anak_perempuan = null;
      } else {
        editPayload.jumlah_anak_perempuan = Number(editPayload.jumlah_anak_perempuan);
      }
      await updatePegawai(Number(pegawai_id), editPayload);
      if (canUpdate && lembaga_ids !== undefined) {
        await restClient.delete(`/pegawai_lembaga?pegawai_id=eq.${pegawai_id}`);
        if (lembaga_ids.length > 0) {
          const inserts = lembaga_ids.map((lid: number) => ({
            pegawai_id: Number(pegawai_id),
            lembaga_id: lid,
          }));
          await restClient.post('/pegawai_lembaga', inserts);
        }
      }
    },
    onSuccess: () => {
      toast.success(isSelf && !canUpdate ? "Profil Anda berhasil diperbarui!" : "Data pegawai berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["pegawai-detail", pegawai_id] });
      queryClient.invalidateQueries({ queryKey: ["master-data", "pegawai-all"] });
      queryClient.invalidateQueries({ queryKey: ["mainlayout", "pegawai-profile"] });
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Gagal menyimpan perubahan data pegawai.");
    },
  });

  const handleOpenEdit = () => {
    if (!pegawai) return;
    const lembagaIds = (pegawai.pegawai_lembaga || [])
      .map((pl: any) => pl.lembaga?.lembaga_id)
      .filter(Boolean);
    setFormData({
      nig: pegawai.nig || "",
      nip: pegawai.nip || "",
      nik: pegawai.nik || "",
      nama: pegawai.nama || "",
      jenis_kelamin: pegawai.jenis_kelamin || "L",
      tempat_lahir: pegawai.tempat_lahir || "",
      tanggal_lahir: pegawai.tanggal_lahir || "",
      alamat: pegawai.alamat || "",
      no_hp: pegawai.no_hp || "",
      email: pegawai.email || "",
      status: pegawai.status || "Aktif",
      jabatan: pegawai.jabatan || "Guru",
      tugas_tambahan: pegawai.tugas_tambahan || "",
      user_id: pegawai.user_id || "",
      nama_ayah: pegawai.nama_ayah || "",
      nama_ibu: pegawai.nama_ibu || "",
      nama_pasangan: pegawai.nama_pasangan || "",
      jumlah_anak_laki: pegawai.jumlah_anak_laki ?? undefined,
      jumlah_anak_perempuan: pegawai.jumlah_anak_perempuan ?? undefined,
      golongan_darah: pegawai.golongan_darah || "",
      pendidikan_tk_nama: pegawai.pendidikan_tk_nama || "",
      pendidikan_tk_tahun_masuk: pegawai.pendidikan_tk_tahun_masuk || "",
      pendidikan_tk_tahun_lulus: pegawai.pendidikan_tk_tahun_lulus || "",
      pendidikan_sd_nama: pegawai.pendidikan_sd_nama || "",
      pendidikan_sd_tahun_masuk: pegawai.pendidikan_sd_tahun_masuk || "",
      pendidikan_sd_tahun_lulus: pegawai.pendidikan_sd_tahun_lulus || "",
      pendidikan_smp_nama: pegawai.pendidikan_smp_nama || "",
      pendidikan_smp_tahun_masuk: pegawai.pendidikan_smp_tahun_masuk || "",
      pendidikan_smp_tahun_lulus: pegawai.pendidikan_smp_tahun_lulus || "",
      pendidikan_sma_nama: pegawai.pendidikan_sma_nama || "",
      pendidikan_sma_tahun_masuk: pegawai.pendidikan_sma_tahun_masuk || "",
      pendidikan_sma_tahun_lulus: pegawai.pendidikan_sma_tahun_lulus || "",
      pt_jenjang: pegawai.pt_jenjang || "",
      pt_universitas: pegawai.pt_universitas || "",
      pt_fakultas: pegawai.pt_fakultas || "",
      pt_jurusan: pegawai.pt_jurusan || "",
      pt_prodi: pegawai.pt_prodi || "",
      pt_tahun_masuk: pegawai.pt_tahun_masuk || "",
      pt_tahun_lulus: pegawai.pt_tahun_lulus || "",
      lembaga_ids: lembagaIds,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePegawaiMutation.mutate(formData);
  };

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
    <div class="row"><div class="label">Email Pegawai</div><div class="value">${fld(pegawai.email)}</div></div>
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
    <div class="row"><div class="label">Nama Pasangan (Istri / Suami)</div><div class="value">${fld(pegawai.nama_pasangan)}</div></div>
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

  <h2>E. RIWAYAT PENDIDIKAN</h2>
  <div style="margin-bottom:8px">
    <strong style="color:#162E6E;font-size:10px;text-transform:uppercase">Pendidikan Dasar & Menengah</strong>
    <table style="width:100%;border-collapse:collapse;margin-top:4px;font-size:10px">
      <thead>
        <tr style="background:#f8fafc;border-bottom:1px solid #cbd5e1">
          <th style="padding:4px;text-align:left;width:25%">Tingkat</th>
          <th style="padding:4px;text-align:left">Nama Lembaga / Sekolah</th>
          <th style="padding:4px;text-align:center;width:15%">Tahun Masuk</th>
          <th style="padding:4px;text-align:center;width:15%">Tahun Lulus</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #f1f5f9">
          <td style="padding:4px;font-weight:600">TK / RA</td>
          <td style="padding:4px">${fld(pegawai.pendidikan_tk_nama)}</td>
          <td style="padding:4px;text-align:center">${fld(pegawai.pendidikan_tk_tahun_masuk)}</td>
          <td style="padding:4px;text-align:center">${fld(pegawai.pendidikan_tk_tahun_lulus)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9">
          <td style="padding:4px;font-weight:600">SD / MI</td>
          <td style="padding:4px">${fld(pegawai.pendidikan_sd_nama)}</td>
          <td style="padding:4px;text-align:center">${fld(pegawai.pendidikan_sd_tahun_masuk)}</td>
          <td style="padding:4px;text-align:center">${fld(pegawai.pendidikan_sd_tahun_lulus)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9">
          <td style="padding:4px;font-weight:600">SMP / MTs</td>
          <td style="padding:4px">${fld(pegawai.pendidikan_smp_nama)}</td>
          <td style="padding:4px;text-align:center">${fld(pegawai.pendidikan_smp_tahun_masuk)}</td>
          <td style="padding:4px;text-align:center">${fld(pegawai.pendidikan_smp_tahun_lulus)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9">
          <td style="padding:4px;font-weight:600">SMA / MA / SMK</td>
          <td style="padding:4px">${fld(pegawai.pendidikan_sma_nama)}</td>
          <td style="padding:4px;text-align:center">${fld(pegawai.pendidikan_sma_tahun_masuk)}</td>
          <td style="padding:4px;text-align:center">${fld(pegawai.pendidikan_sma_tahun_lulus)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div style="margin-top:10px">
    <strong style="color:#162E6E;font-size:10px;text-transform:uppercase">Pendidikan Tinggi</strong>
    <div class="grid" style="margin-top:4px">
      <div class="row"><div class="label">Jenjang</div><div class="value">${fld(pegawai.pt_jenjang)}</div></div>
      <div class="row"><div class="label">Universitas / Institut</div><div class="value">${fld(pegawai.pt_universitas)}</div></div>
      <div class="row"><div class="label">Fakultas</div><div class="value">${fld(pegawai.pt_fakultas)}</div></div>
      <div class="row"><div class="label">Jurusan</div><div class="value">${fld(pegawai.pt_jurusan)}</div></div>
      <div class="row"><div class="label">Program Studi</div><div class="value">${fld(pegawai.pt_prodi)}</div></div>
      <div class="row"><div class="label">Periode Masuk - Lulus</div><div class="value">${pegawai.pt_tahun_masuk || '—'} s/d ${pegawai.pt_tahun_lulus || '—'}</div></div>
    </div>
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

  const selectedPegawaiUI: PegawaiUI | null = pegawai
    ? {
        id: pegawai.pegawai_id,
        nama: pegawai.nama || "—",
        nig: pegawai.nig || "—",
        nip: pegawai.nip || "—",
        jabatan: pegawai.jabatan || "—",
        jenisKelamin: pegawai.jenis_kelamin === "L" ? "Laki-laki" : pegawai.jenis_kelamin === "P" ? "Perempuan" : "—",
        status: pegawai.status || "Aktif",
        lembagaList: lembagaListText,
        raw: pegawai,
      }
    : null;

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
        <div className="flex items-center justify-center sm:justify-end gap-2.5 flex-wrap">
          {/* Atur Role Pengguna */}
          {canReadRole && (
            <button
              onClick={() => {
                if (!pegawai.user_id) {
                  toast.info("Pegawai ini belum memiliki akun login. Silakan buat akun terlebih dahulu di bagian D (Informasi Akun).");
                  return;
                }
                setIsRoleModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              Atur Role Pengguna
            </button>
          )}

          {/* Edit Data Pegawai */}
          {canEdit && (
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              {isSelf && !canUpdate ? "Edit Data Saya" : "Edit Pegawai"}
            </button>
          )}

          {/* Download PDF */}
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
            <InfoField label="Email" value={pegawai.email} />
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
          <SectionHeader label="C. Data Keluarga" sub="Informasi pasangan, orang tua kandung, dan tanggungan anak" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <InfoField label="Nama Pasangan (Istri / Suami)" value={pegawai.nama_pasangan} />
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-600" /> Hak Akses / Roles Terdaftar:
                    </span>
                    {canReadRole && pegawai.user_id && (
                      <button
                        type="button"
                        onClick={() => setIsRoleModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Atur Role Pengguna
                      </button>
                    )}
                  </div>
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

        {/* E. RIWAYAT PENDIDIKAN */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <SectionHeader label="E. Riwayat Pendidikan" sub="Riwayat pendidikan formal dasar, menengah, hingga jenjang tinggi" />
          
          <div className="space-y-6">
            {/* Pendidikan Dasar & Menengah */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <School className="w-4 h-4 text-blue-600" />
                Pendidikan Dasar & Menengah
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3.5 w-1/4">Tingkat</th>
                      <th className="py-2.5 px-3.5">Nama Lembaga / Sekolah</th>
                      <th className="py-2.5 px-3.5 text-center w-28">Tahun Masuk</th>
                      <th className="py-2.5 px-3.5 text-center w-28">Tahun Lulus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900">TK / RA</td>
                      <td className="py-2.5 px-3.5">{pegawai.pendidikan_tk_nama || "—"}</td>
                      <td className="py-2.5 px-3.5 text-center">{pegawai.pendidikan_tk_tahun_masuk || "—"}</td>
                      <td className="py-2.5 px-3.5 text-center">{pegawai.pendidikan_tk_tahun_lulus || "—"}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900">SD / MI</td>
                      <td className="py-2.5 px-3.5">{pegawai.pendidikan_sd_nama || "—"}</td>
                      <td className="py-2.5 px-3.5 text-center">{pegawai.pendidikan_sd_tahun_masuk || "—"}</td>
                      <td className="py-2.5 px-3.5 text-center">{pegawai.pendidikan_sd_tahun_lulus || "—"}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900">SMP / MTs</td>
                      <td className="py-2.5 px-3.5">{pegawai.pendidikan_smp_nama || "—"}</td>
                      <td className="py-2.5 px-3.5 text-center">{pegawai.pendidikan_smp_tahun_masuk || "—"}</td>
                      <td className="py-2.5 px-3.5 text-center">{pegawai.pendidikan_smp_tahun_lulus || "—"}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900">SMA / MA / SMK</td>
                      <td className="py-2.5 px-3.5">{pegawai.pendidikan_sma_nama || "—"}</td>
                      <td className="py-2.5 px-3.5 text-center">{pegawai.pendidikan_sma_tahun_masuk || "—"}</td>
                      <td className="py-2.5 px-3.5 text-center">{pegawai.pendidikan_sma_tahun_lulus || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Perguruan Tinggi */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Pendidikan Tinggi
              </h4>
              <div className="bg-gradient-to-r from-indigo-50/50 via-slate-50 to-blue-50/40 p-4 rounded-xl border border-indigo-100/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-0.5 uppercase tracking-wide">
                      Jenjang
                    </span>
                    {pegawai.pt_jenjang ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {pegawai.pt_jenjang}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">—</span>
                    )}
                  </div>
                  <InfoField label="Universitas / Institut" value={pegawai.pt_universitas} />
                  <InfoField label="Fakultas" value={pegawai.pt_fakultas} />
                  <InfoField label="Jurusan" value={pegawai.pt_jurusan} />
                  <InfoField label="Program Studi (Prodi)" value={pegawai.pt_prodi} />
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-0.5 uppercase tracking-wide">
                      Periode Masuk - Lulus
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {pegawai.pt_tahun_masuk || pegawai.pt_tahun_lulus
                        ? `${pegawai.pt_tahun_masuk || "—"} s/d ${pegawai.pt_tahun_lulus || "—"}`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      <AssignRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["user-roles-detail", pegawai?.user_id] });
          queryClient.invalidateQueries({ queryKey: ["pegawai-detail", pegawai_id] });
        }}
        userId={pegawai?.user_id || null}
        pegawaiId={pegawai?.pegawai_id ? Number(pegawai.pegawai_id) : null}
        pegawaiName={pegawai?.nama || ""}
      />

      <PegawaiFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        selectedPegawai={selectedPegawaiUI}
        formData={formData}
        setFormData={setFormData}
        isNigDuplikat={false}
        isNamaDuplikat={false}
        hasDuplicateError={false}
        isSaving={updatePegawaiMutation.isPending}
        isPending={updatePegawaiMutation.isPending}
        onSubmit={handleSaveEdit}
        isSelfOnly={!canUpdate && isSelf}
      />
    </div>
  );
}
