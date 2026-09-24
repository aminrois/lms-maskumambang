import prisma from '../config/prisma';

export async function initKeuanganModule() {
  try {
    console.log('🔄 Checking & Initializing Keuangan Module...');

    // 1. Inisialisasi Rekening Pesantren Resmi
    const countRekening = await prisma.rekeningPesantren.count();
    if (countRekening === 0) {
      await prisma.rekeningPesantren.createMany({
        data: [
          {
            nama_bank: 'Bank Syariah Indonesia (BSI)',
            nomor_rekening: '7123456789',
            atas_nama: 'YAYASAN KEBANGKITAN ISLAM MASKUMAMBANG',
            cabang: 'Gresik Dukun',
            is_active: true,
          },
          {
            nama_bank: 'Bank Rakyat Indonesia (BRI)',
            nomor_rekening: '003201001234538',
            atas_nama: 'YAYASAN MASKUMAMBANG DUKUN GRESIK',
            cabang: 'Gresik Sedayu',
            is_active: true,
          },
          {
            nama_bank: 'Bank Mandiri',
            nomor_rekening: '1410098765432',
            atas_nama: 'PONTREN MASKUMAMBANG',
            cabang: 'Gresik Kartini',
            is_active: true,
          },
        ],
      });
      console.log('✅ Default Rekening Pesantren initialized.');
    }

    // 2. Inisialisasi Pos Pembayaran Standar
    const defaultPos = [
      {
        nama_pos: 'Uang Pangkal (DSP / Gedung)',
        kode_pos: 'PANGKAL',
        tipe_pembayaran: 'Bebas',
        deskripsi: 'Dana Sumbangan Pendidikan / Uang Masuk Santri Baru (Bisa Dicicil)',
        tarifs: [
          { nama_tarif: 'Uang Pangkal - Kuota 1 (Early Bird)', kuota: 'Kuota 1', nominal: 12000000 },
          { nama_tarif: 'Uang Pangkal - Kuota 2 (Reguler Gel. 1)', kuota: 'Kuota 2', nominal: 13500000 },
          { nama_tarif: 'Uang Pangkal - Kuota 3 (Reguler Gel. 2)', kuota: 'Kuota 3', nominal: 15000000 },
        ],
      },
      {
        nama_pos: 'SPP Bulanan',
        kode_pos: 'SPP',
        tipe_pembayaran: 'Bulanan',
        deskripsi: 'Iuran Pembinaan Pendidikan (SPP) & Biaya Makan/Asrama Bulanan',
        tarifs: [
          { nama_tarif: 'SPP Jenjang MI / SD', nominal: 650000 },
          { nama_tarif: 'SPP Jenjang MTs / SMP (Reguler/Asrama)', nominal: 950000 },
          { nama_tarif: 'SPP Jenjang MA / SMA / SMK', nominal: 1100000 },
        ],
      },
      {
        nama_pos: 'Kegiatan & Ujian Tahunan',
        kode_pos: 'KEGIATAN',
        tipe_pembayaran: 'Tahunan',
        deskripsi: 'Biaya Ujian Semester (PAS/PAT), PHBI, Ekstrakurikuler, dan Rihlah Ilmiah 1 Tahun',
        tarifs: [
          { nama_tarif: 'Kegiatan & Ujian Tingkat 7 / X (Tahun I)', nominal: 1250000 },
          { nama_tarif: 'Kegiatan & Ujian Tingkat 8 / XI (Tahun II)', nominal: 1150000 },
          { nama_tarif: 'Kegiatan & Ujian Tingkat 9 / XII (Tahun III + Wisuda)', nominal: 1750000 },
        ],
      },
      {
        nama_pos: 'Seragam & Perlengkapan Santri',
        kode_pos: 'SERAGAM',
        tipe_pembayaran: 'Sekali',
        deskripsi: 'Paket Seragam Resmi, Almamater, Buku Pegangan, dan Kitab Awal Santri',
        tarifs: [
          { nama_tarif: 'Paket Seragam Lengkap Santri Putra', nominal: 1850000 },
          { nama_tarif: 'Paket Seragam Lengkap Santri Putri', nominal: 1950000 },
        ],
      },
    ];

    for (const item of defaultPos) {
      const existing = await prisma.posPembayaran.findFirst({
        where: { kode_pos: item.kode_pos },
      });

      if (!existing) {
        const createdPos = await prisma.posPembayaran.create({
          data: {
            nama_pos: item.nama_pos,
            kode_pos: item.kode_pos,
            tipe_pembayaran: item.tipe_pembayaran,
            deskripsi: item.deskripsi,
            is_active: true,
          },
        });

        for (const tarif of item.tarifs) {
          await prisma.tarifPembayaran.create({
            data: {
              pos_id: createdPos.pos_id,
              nama_tarif: tarif.nama_tarif,
              kuota: (tarif as any).kuota || null,
              nominal: tarif.nominal,
            },
          });
        }
        console.log(`✅ Pos Pembayaran '${item.nama_pos}' created with default tariffs.`);
      }
    }

    // 3. Generate sample tagihan untuk beberapa santri jika belum ada tagihan
    const totalTagihan = await prisma.tagihanSiswa.count();
    if (totalTagihan === 0) {
      console.log('📦 Generating sample initial tagihan for testing...');
      const students = await prisma.siswa.findMany({
        take: 15,
        orderBy: { siswa_id: 'asc' },
      });

      const posPangkal = await prisma.posPembayaran.findFirst({ where: { kode_pos: 'PANGKAL' } });
      const posSpp = await prisma.posPembayaran.findFirst({ where: { kode_pos: 'SPP' } });
      const posKegiatan = await prisma.posPembayaran.findFirst({ where: { kode_pos: 'KEGIATAN' } });
      const posSeragam = await prisma.posPembayaran.findFirst({ where: { kode_pos: 'SERAGAM' } });

      const activeTahun = await prisma.tahunAjaran.findFirst({ where: { is_active: true } }) 
        || await prisma.tahunAjaran.findFirst({ orderBy: { tahun_id: 'desc' } });

      for (let i = 0; i < students.length; i++) {
        const s = students[i];
        
        // 1. Uang Pangkal (Kuota 1 atau 2, dengan simulasi cicilan)
        if (posPangkal) {
          const kuotaNominal = (i % 2 === 0) ? 12000000 : 13500000;
          const kuotaNama = (i % 2 === 0) ? 'Kuota 1' : 'Kuota 2';
          const terbayar = (i % 3 === 0) ? 5000000 : (i % 3 === 1 ? kuotaNominal : 0);
          const sisa = kuotaNominal - terbayar;
          const status = sisa === 0 ? 'Lunas' : (terbayar > 0 ? 'Sebagian' : 'Belum Bayar');

          await prisma.tagihanSiswa.create({
            data: {
              siswa_id: s.siswa_id,
              pos_id: posPangkal.pos_id,
              tahun_id: activeTahun?.tahun_id || null,
              nama_tagihan: `Uang Pangkal (${kuotaNama})`,
              nominal_total: kuotaNominal,
              nominal_terbayar: terbayar,
              sisa_tagihan: sisa,
              status,
              jatuh_tempo: '2026-12-31',
              keterangan: `Tagihan Uang Pangkal ${kuotaNama}`,
            },
          });
        }

        // 2. SPP Juli, Agustus, September 2026
        if (posSpp) {
          const nominalSpp = 950000;
          const bulanList = [
            { no: 7, nama: 'Juli 2026', terbayar: nominalSpp, status: 'Lunas' },
            { no: 8, nama: 'Agustus 2026', terbayar: nominalSpp, status: 'Lunas' },
            { no: 9, nama: 'September 2026', terbayar: (i % 2 === 0 ? nominalSpp : 0), status: (i % 2 === 0 ? 'Lunas' : 'Belum Bayar') },
            { no: 10, nama: 'Oktober 2026', terbayar: 0, status: 'Belum Bayar' },
          ];

          for (const b of bulanList) {
            await prisma.tagihanSiswa.create({
              data: {
                siswa_id: s.siswa_id,
                pos_id: posSpp.pos_id,
                tahun_id: activeTahun?.tahun_id || null,
                bulan: b.no,
                tahun_periode: 2026,
                nama_tagihan: `SPP ${b.nama}`,
                nominal_total: nominalSpp,
                nominal_terbayar: b.terbayar,
                sisa_tagihan: nominalSpp - b.terbayar,
                status: b.status,
                jatuh_tempo: `2026-${String(b.no).padStart(2, '0')}-10`,
              },
            });
          }
        }

        // 3. Kegiatan & Ujian
        if (posKegiatan) {
          await prisma.tagihanSiswa.create({
            data: {
              siswa_id: s.siswa_id,
              pos_id: posKegiatan.pos_id,
              tahun_id: activeTahun?.tahun_id || null,
              nama_tagihan: 'Kegiatan & Ujian TA 2026/2027',
              nominal_total: 1250000,
              nominal_terbayar: 0,
              sisa_tagihan: 1250000,
              status: 'Belum Bayar',
              jatuh_tempo: '2026-11-20',
            },
          });
        }

        // 4. Seragam & Perlengkapan
        if (posSeragam) {
          const nominalSeragam = s.jenis_kelamin === 'P' ? 1950000 : 1850000;
          await prisma.tagihanSiswa.create({
            data: {
              siswa_id: s.siswa_id,
              pos_id: posSeragam.pos_id,
              tahun_id: activeTahun?.tahun_id || null,
              nama_tagihan: `Seragam Santri (${s.jenis_kelamin === 'P' ? 'Putri' : 'Putra'})`,
              nominal_total: nominalSeragam,
              nominal_terbayar: nominalSeragam,
              sisa_tagihan: 0,
              status: 'Lunas',
              jatuh_tempo: '2026-07-31',
            },
          });
        }
      }
      console.log('✅ Sample tagihan generated for testing.');
    }

    console.log('🎉 Keuangan Module initialization complete!');
  } catch (err) {
    console.error('❌ Error initializing Keuangan Module:', err);
  }
}
