import { Request, Response } from 'express';
import prisma from '../config/prisma';

// ═══════════════════════════════════════════════════════
// 1. DETAIL PROFIL GUIDANCE SANTRI (360° HOLISTIK)
// ═══════════════════════════════════════════════════════

export async function getGuidanceSiswaList(req: Request, res: Response) {
  try {
    const { kelas_id, search, limit = 50 } = req.query;

    const whereSiswa: any = { status: 'Aktif' };
    if (kelas_id) {
      whereSiswa.kelas_id = parseInt(kelas_id as string, 10);
    }
    if (search) {
      whereSiswa.OR = [
        { nama: { contains: search as string, mode: 'insensitive' } },
        { nis: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.siswa.findMany({
      where: whereSiswa,
      include: {
        kelas: {
          select: {
            kelas_id: true,
            nama_kelas: true,
            lembaga: { select: { nama_lembaga: true } },
          },
        },
        guidance_detail: true,
        konseling_sesi: {
          orderBy: { tanggal_sesi: 'desc' },
          take: 1,
          select: {
            konseling_id: true,
            tanggal_sesi: true,
            kategori: true,
            status_follow_up: true,
          },
        },
      },
      orderBy: { nama: 'asc' },
      take: parseInt(limit as string, 10),
    });

    const data = students.map((s) => {
      const g = s.guidance_detail;
      const skorArray = g
        ? [
            g.skor_wudhu,
            g.skor_doa_sholat,
            g.skor_praktik_sholat,
            g.skor_jamaah_masjid,
            g.skor_alquran,
            g.skor_hafalan_juz30,
            g.skor_disiplin,
            g.skor_rapi,
            g.skor_adab,
          ].filter((v): v is number => typeof v === 'number' && v > 0)
        : [];

      const avgFundamental = skorArray.length > 0 
        ? parseFloat((skorArray.reduce((a, b) => a + b, 0) / skorArray.length).toFixed(1))
        : 0;

      const isProfileFilled = Boolean(g && (g.transportasi || g.no_hp_siswa || g.lanjut_kuliah));

      return {
        siswa_id: s.siswa_id,
        nama: s.nama,
        nis: s.nis,
        kelas: s.kelas?.nama_kelas || '-',
        lembaga: s.kelas?.lembaga?.nama_lembaga || '-',
        is_profile_filled: isProfileFilled,
        avg_fundamental: avgFundamental,
        rencana_kuliah: g?.lanjut_kuliah || 'Belum Diisi',
        target_pendidikan: g?.target_pendidikan || '-',
        universitas_tujuan: g?.universitas_tujuan || '-',
        last_konseling: s.konseling_sesi[0] || null,
      };
    });

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in getGuidanceSiswaList:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getGuidanceDetailBySiswaId(req: Request, res: Response) {
  try {
    const siswa_id = parseInt(String(req.params.siswa_id), 10);

    const siswa = await prisma.siswa.findUnique({
      where: { siswa_id },
      include: {
        kelas: {
          include: {
            wali_kelas: true,
            lembaga: true,
          },
        },
        wali_murid: true,
        guidance_detail: true,
        konseling_sesi: {
          include: {
            pegawai: { select: { nama: true, jabatan: true } },
          },
          orderBy: { tanggal_sesi: 'desc' },
        },
      },
    });

    if (!siswa) {
      return res.status(404).json({ success: false, message: 'Data santri tidak ditemukan' });
    }

    return res.json({ success: true, data: siswa });
  } catch (error: any) {
    console.error('Error in getGuidanceDetailBySiswaId:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function upsertGuidanceDetail(req: Request, res: Response) {
  try {
    const siswa_id = parseInt(String(req.params.siswa_id), 10);
    const body = req.body;

    const guidance = await prisma.siswaGuidanceDetail.upsert({
      where: { siswa_id },
      create: {
        siswa_id,
        // Tempat Tinggal & Fasilitas
        jarak_rumah_sekolah: body.jarak_rumah_sekolah || null,
        transportasi: body.transportasi || null,
        kepemilikan_rumah: body.kepemilikan_rumah || null,
        daya_listrik: body.daya_listrik || null,
        sumber_air: body.sumber_air || null,
        akses_internet: body.akses_internet || null,
        perangkat_belajar: body.perangkat_belajar || null,

        // Data Sosial
        no_hp_siswa: body.no_hp_siswa || null,
        email_siswa: body.email_siswa || null,
        instagram: body.instagram || null,
        facebook: body.facebook || null,
        tiktok: body.tiktok || null,
        twitter_x: body.twitter_x || null,

        // Riwayat Kesehatan
        merokok: body.merokok || null,
        riwayat_penyakit: body.riwayat_penyakit || null,
        riwayat_alergi: body.riwayat_alergi || null,
        riwayat_operasi: body.riwayat_operasi || null,
        gangguan_kesehatan: body.gangguan_kesehatan || null,
        dalam_masa_pengobatan: body.dalam_masa_pengobatan || null,
        asuransi_kesehatan: body.asuransi_kesehatan || null,
        kontak_darurat_nama: body.kontak_darurat_nama || null,
        kontak_darurat_hubungan: body.kontak_darurat_hubungan || null,
        kontak_darurat_hp: body.kontak_darurat_hp || null,

        // Rencana Internship / Dakwah
        internship_nama: body.internship_nama || null,
        internship_alamat: body.internship_alamat || null,
        internship_bidang: body.internship_bidang || null,
        internship_divisi: body.internship_divisi || null,
        internship_kompetensi: body.internship_kompetensi || null,

        // Rencana Pendidikan Lanjutan
        lanjut_kuliah: body.lanjut_kuliah || null,
        target_pendidikan: body.target_pendidikan || null,
        prodi_pilihan: body.prodi_pilihan || null,
        universitas_tujuan: body.universitas_tujuan || null,
        persiapan: body.persiapan || null,
        sumber_biaya: body.sumber_biaya || null,
        jalur_masuk: body.jalur_masuk || null,
        dukungan_diharapkan: body.dukungan_diharapkan || null,

        // 9 Aspek Fundamental
        skor_wudhu: body.skor_wudhu ? parseInt(body.skor_wudhu, 10) : 1,
        skor_doa_sholat: body.skor_doa_sholat ? parseInt(body.skor_doa_sholat, 10) : 1,
        skor_praktik_sholat: body.skor_praktik_sholat ? parseInt(body.skor_praktik_sholat, 10) : 1,
        skor_jamaah_masjid: body.skor_jamaah_masjid ? parseInt(body.skor_jamaah_masjid, 10) : 1,
        skor_alquran: body.skor_alquran ? parseInt(body.skor_alquran, 10) : 1,
        skor_hafalan_juz30: body.skor_hafalan_juz30 ? parseInt(body.skor_hafalan_juz30, 10) : 1,
        skor_disiplin: body.skor_disiplin ? parseInt(body.skor_disiplin, 10) : 1,
        skor_rapi: body.skor_rapi ? parseInt(body.skor_rapi, 10) : 1,
        skor_adab: body.skor_adab ? parseInt(body.skor_adab, 10) : 1,
        catatan_fundamental: body.catatan_fundamental || null,
      },
      update: {
        jarak_rumah_sekolah: body.jarak_rumah_sekolah,
        transportasi: body.transportasi,
        kepemilikan_rumah: body.kepemilikan_rumah,
        daya_listrik: body.daya_listrik,
        sumber_air: body.sumber_air,
        akses_internet: body.akses_internet,
        perangkat_belajar: body.perangkat_belajar,

        no_hp_siswa: body.no_hp_siswa,
        email_siswa: body.email_siswa,
        instagram: body.instagram,
        facebook: body.facebook,
        tiktok: body.tiktok,
        twitter_x: body.twitter_x,

        merokok: body.merokok,
        riwayat_penyakit: body.riwayat_penyakit,
        riwayat_alergi: body.riwayat_alergi,
        riwayat_operasi: body.riwayat_operasi,
        gangguan_kesehatan: body.gangguan_kesehatan,
        dalam_masa_pengobatan: body.dalam_masa_pengobatan,
        asuransi_kesehatan: body.asuransi_kesehatan,
        kontak_darurat_nama: body.kontak_darurat_nama,
        kontak_darurat_hubungan: body.kontak_darurat_hubungan,
        kontak_darurat_hp: body.kontak_darurat_hp,

        internship_nama: body.internship_nama,
        internship_alamat: body.internship_alamat,
        internship_bidang: body.internship_bidang,
        internship_divisi: body.internship_divisi,
        internship_kompetensi: body.internship_kompetensi,

        lanjut_kuliah: body.lanjut_kuliah,
        target_pendidikan: body.target_pendidikan,
        prodi_pilihan: body.prodi_pilihan,
        universitas_tujuan: body.universitas_tujuan,
        persiapan: body.persiapan,
        sumber_biaya: body.sumber_biaya,
        jalur_masuk: body.jalur_masuk,
        dukungan_diharapkan: body.dukungan_diharapkan,

        skor_wudhu: body.skor_wudhu !== undefined ? parseInt(body.skor_wudhu, 10) : undefined,
        skor_doa_sholat: body.skor_doa_sholat !== undefined ? parseInt(body.skor_doa_sholat, 10) : undefined,
        skor_praktik_sholat: body.skor_praktik_sholat !== undefined ? parseInt(body.skor_praktik_sholat, 10) : undefined,
        skor_jamaah_masjid: body.skor_jamaah_masjid !== undefined ? parseInt(body.skor_jamaah_masjid, 10) : undefined,
        skor_alquran: body.skor_alquran !== undefined ? parseInt(body.skor_alquran, 10) : undefined,
        skor_hafalan_juz30: body.skor_hafalan_juz30 !== undefined ? parseInt(body.skor_hafalan_juz30, 10) : undefined,
        skor_disiplin: body.skor_disiplin !== undefined ? parseInt(body.skor_disiplin, 10) : undefined,
        skor_rapi: body.skor_rapi !== undefined ? parseInt(body.skor_rapi, 10) : undefined,
        skor_adab: body.skor_adab !== undefined ? parseInt(body.skor_adab, 10) : undefined,
        catatan_fundamental: body.catatan_fundamental,
      },
    });

    return res.json({
      success: true,
      message: 'Detail bimbingan & profil santri berhasil disimpan.',
      data: guidance,
    });
  } catch (error: any) {
    console.error('Error in upsertGuidanceDetail:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ═══════════════════════════════════════════════════════
// 2. SESI KONSULTASI / KONSELING
// ═══════════════════════════════════════════════════════

export async function getKonselingSesiList(req: Request, res: Response) {
  try {
    const { siswa_id, kategori, status_follow_up, search } = req.query;

    const where: any = {};
    if (siswa_id) {
      where.siswa_id = parseInt(siswa_id as string, 10);
    }
    if (kategori) {
      where.kategori = kategori as string;
    }
    if (status_follow_up) {
      where.status_follow_up = status_follow_up as string;
    }
    if (search) {
      where.OR = [
        { topik_konseling: { contains: search as string, mode: 'insensitive' } },
        { keluhan_masalah: { contains: search as string, mode: 'insensitive' } },
        { siswa: { nama: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const sesiList = await prisma.siswaKonselingSesi.findMany({
      where,
      include: {
        siswa: {
          select: {
            siswa_id: true,
            nama: true,
            nis: true,
            kelas: { select: { nama_kelas: true } },
          },
        },
        pegawai: {
          select: {
            pegawai_id: true,
            nama: true,
            jabatan: true,
          },
        },
      },
      orderBy: { tanggal_sesi: 'desc' },
    });

    return res.json({ success: true, data: sesiList });
  } catch (error: any) {
    console.error('Error in getKonselingSesiList:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createKonselingSesi(req: Request, res: Response) {
  try {
    const {
      siswa_id,
      pegawai_id,
      tanggal_sesi,
      kategori,
      topik_konseling,
      keluhan_masalah,
      dinamika_konseling,
      solusi_kesepakatan,
      status_follow_up,
      sifat_rahasia,
      catatan_tindak_lanjut,
    } = req.body;

    if (!siswa_id || !topik_konseling || !keluhan_masalah) {
      return res.status(400).json({
        success: false,
        message: 'Santri, topik konseling, dan keluhan/masalah wajib diisi.',
      });
    }

    // Default pegawai ke konselor yang login jika pegawai_id tidak diisi
    const user = (req as any).user;
    let targetPegawaiId = pegawai_id ? parseInt(pegawai_id, 10) : null;

    if (!targetPegawaiId && user?.user_id) {
      const p = await prisma.pegawai.findFirst({ where: { user_id: user.user_id } });
      if (p) targetPegawaiId = p.pegawai_id;
    }

    if (!targetPegawaiId) {
      const fallbackP = await prisma.pegawai.findFirst();
      targetPegawaiId = fallbackP?.pegawai_id || 1;
    }

    const sesi = await prisma.siswaKonselingSesi.create({
      data: {
        siswa_id: parseInt(siswa_id, 10),
        pegawai_id: targetPegawaiId,
        tanggal_sesi: tanggal_sesi || new Date().toISOString().slice(0, 10),
        kategori: kategori || 'Akademik',
        topik_konseling,
        keluhan_masalah,
        dinamika_konseling: dinamika_konseling || null,
        solusi_kesepakatan: solusi_kesepakatan || null,
        status_follow_up: status_follow_up || 'Dalam Pemantauan',
        sifat_rahasia: sifat_rahasia || 'Internal Guru/Wali Kelas',
        catatan_tindak_lanjut: catatan_tindak_lanjut || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Sesi konsultasi santri berhasil dicatat.',
      data: sesi,
    });
  } catch (error: any) {
    console.error('Error in createKonselingSesi:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteKonselingSesi(req: Request, res: Response) {
  try {
    const konseling_id = parseInt(String(req.params.konseling_id), 10);
    await prisma.siswaKonselingSesi.delete({
      where: { konseling_id },
    });
    return res.json({ success: true, message: 'Catatan konsultasi berhasil dihapus.' });
  } catch (error: any) {
    console.error('Error in deleteKonselingSesi:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
