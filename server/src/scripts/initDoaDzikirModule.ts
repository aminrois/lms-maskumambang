// server/src/scripts/initDoaDzikirModule.ts
import prisma from '../config/prisma';

export async function initDoaDzikirModule(): Promise<void> {
  try {
    console.log('🔄 Initializing Doa & Dzikir Module Schema...');

    // 1. Create table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."doa_dzikir" (
        "id" SERIAL PRIMARY KEY,
        "judul" TEXT NOT NULL,
        "kategori" TEXT NOT NULL,
        "arab" TEXT NOT NULL,
        "latin" TEXT,
        "arti" TEXT NOT NULL,
        "riwayat" TEXT,
        "urutan" INTEGER NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "doa_dzikir_kategori_idx" ON "public"."doa_dzikir"("kategori");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "doa_dzikir_is_active_idx" ON "public"."doa_dzikir"("is_active");
    `);

    console.log('✅ Table "doa_dzikir" verified/created.');

    // 2. Seed initial data if table is empty
    const count = await prisma.doaDzikir.count();
    if (count === 0) {
      console.log('🌱 Seeding initial Doa & Dzikir items...');

      const initialItems = [
        {
          judul: "Sayyidul Istighfar",
          kategori: "Dzikir Pagi & Petang",
          arab: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
          latin: "Allahumma anta rabbi laa ilaaha illaa anta khalaqtanii wa anaa 'abduka wa anaa 'alaa 'ahdika wa wa'dika mastatha'tu, a'uudzu bika min syarri maa shana'tu, abuu-u laka bini'matika 'alayya wa abuu-u bidzanbii faghfirlii fa-innahu laa yaghfirudz-dzunuuba illaa anta.",
          arti: "Ya Allah, Engkau adalah Tuhanku, tidak ada Tuhan yang berhak disembah selain Engkau. Engkaulah yang menciptakanku dan aku adalah hamba-Mu. Aku akan setia pada janji-Mu semampuku. Aku berlindung kepada-Mu dari keburukan apa yang telah kuperbuat. Aku mengakui segala nikmat-Mu kepadaku dan aku mengakui dosaku, maka ampunilah aku. Sungguh tiada yang mengampuni dosa selain Engkau.",
          riwayat: "HR. Bukhari no. 6306",
          urutan: 1,
          is_active: true,
        },
        {
          judul: "Doa Sebelum Belajar / Menuntut Ilmu",
          kategori: "KBM & Pelajaran",
          arab: "رَبِّ زِدْنِي عِلْمًا وَارْزُقْنِي فَهْمًا وَاجْعَلْنِي مِنَ الصَّالِحِينَ",
          latin: "Robbi zidnii 'ilman warzuqnii fahman waj'alnii minash-shoolihiin.",
          arti: "Ya Tuhanku, tambahkanlah kepadaku ilmu pengetahuan, dan berilah aku karunia untuk memahaminya, serta jadikanlah aku termasuk golongan orang-orang yang shaleh.",
          riwayat: "QS. Thaha: 114 & Doa Salaf",
          urutan: 2,
          is_active: true,
        },
        {
          judul: "Doa Memohon Kemudahan Segala Urusan",
          kategori: "Doa Harian",
          arab: "اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا",
          latin: "Allahumma laa sahla illaa maa ja'altahu sahlaa, wa anta taj'alul hazna idza syi'ta sahlaa.",
          arti: "Ya Allah, tidak ada kemudahan kecuali apa yang Engkau jadikan mudah. Dan Engkau menjadikan kesulitan, jika Engkau kehendaki, menjadi mudah.",
          riwayat: "HR. Ibnu Hibban no. 327",
          urutan: 3,
          is_active: true,
        },
        {
          judul: "Doa Perlindungan Pagi & Petang",
          kategori: "Dzikir Pagi & Petang",
          arab: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
          latin: "Bismillahilladzi laa yadhurru ma'asmihi syai-un fil ardhi wa laa fis-samaa-i wa huwas-samii'ul 'aliim. (3x)",
          arti: "Dengan menyebut nama Allah yang dengan sebab nama-Nya tidak ada sesuatu pun di bumi maupun di langit yang dapat membahayakan, dan Dia Maha Mendengar lagi Maha Mengetahui.",
          riwayat: "HR. Abu Dawud & Tirmidzi",
          urutan: 4,
          is_active: true,
        },
        {
          judul: "Doa untuk Kedua Orang Tua & Guru",
          kategori: "Doa Harian",
          arab: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا وَلِمَشَايِخِنَا وَمُعَلِّمِينَا",
          latin: "Rabbighfirlii waliwaalidayya warhamhumaa kamaa rabbayaanii shaghiiraa, wali masyaayikhinaa wa mu'allimiinaa.",
          arti: "Ya Tuhanku, ampunilah aku dan kedua orang tuaku, sayangilah mereka sebagaimana mereka telah menyayangiku di waktu kecil, serta ampunilah guru-guru dan masyayikh kami.",
          riwayat: "QS. Al-Isra: 24",
          urutan: 5,
          is_active: true,
        },
        {
          judul: "Doa Masuk Masjid",
          kategori: "Sholat & Wudhu",
          arab: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
          latin: "Allahummaftah lii abwaaba rahmatik.",
          arti: "Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu.",
          riwayat: "HR. Muslim no. 713",
          urutan: 6,
          is_active: true,
        },
        {
          judul: "Doa Keluar Masjid",
          kategori: "Sholat & Wudhu",
          arab: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
          latin: "Allahumma innii as-aluka min fadhlik.",
          arti: "Ya Allah, sesungguhnya aku memohon keutamaan dari karunia-Mu.",
          riwayat: "HR. Muslim no. 713",
          urutan: 7,
          is_active: true,
        },
        {
          judul: "Doa Sebelum Tidur",
          kategori: "Doa Harian",
          arab: "بِاسْمِكَ اللَّهُمَّ أَحْيَا وَأَمُوتُ",
          latin: "Bismika Allahumma ahyaa wa amuut.",
          arti: "Dengan menyebut nama-Mu ya Allah, aku hidup dan aku mati.",
          riwayat: "HR. Bukhari & Muslim",
          urutan: 8,
          is_active: true,
        },
        {
          judul: "Doa Bangun Tidur",
          kategori: "Doa Harian",
          arab: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
          latin: "Alhamdulillahilladzi ahyaanaa ba'da maa amaatanaa wa ilaihin-nusyuur.",
          arti: "Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan hanya kepada-Nya kami akan dibangkitkan.",
          riwayat: "HR. Bukhari no. 6312",
          urutan: 9,
          is_active: true,
        },
        {
          judul: "Dzikir Setelah Sholat Fardhu (Tasbih, Tahmid, Takbir)",
          kategori: "Sholat & Wudhu",
          arab: "سُبْحَانَ اللَّهِ (٣٣x) الْحَمْدُ لِلَّهِ (٣٣x) اللَّهُ أَكْبَرُ (٣٣x)",
          latin: "Subhanallah (33x), Alhamdulillah (33x), Allahu Akbar (33x)",
          arti: "Maha Suci Allah (33x), Segala puji bagi Allah (33x), Allah Maha Besar (33x).",
          riwayat: "HR. Muslim no. 597",
          urutan: 10,
          is_active: true,
        }
      ];

      for (const item of initialItems) {
        await prisma.doaDzikir.create({ data: item });
      }

      console.log(`✅ Seeded ${initialItems.length} Doa & Dzikir items successfully.`);
    }
  } catch (error) {
    console.error('❌ Error initializing Doa & Dzikir Module:', error);
  }
}
