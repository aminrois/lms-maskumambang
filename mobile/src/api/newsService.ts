// mobile/src/api/newsService.ts
import axios from "axios";

export interface WordPressPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  paragraphs: string[];
  dateFormatted: string;
  category: string;
  imageUrl: string;
  link: string;
  author: string;
}

const WP_API_URL = "https://maskumambang.ac.id/wp-json/wp/v2";

// Helper decode HTML entities
export function decodeHtmlEntities(text: string = ""): string {
  if (!text) return "";
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "—")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8230;/g, "...")
    .replace(/&#8217;s/g, "'s");
}

// Helper membersihkan tag HTML satu baris
export function stripHtml(html: string = ""): string {
  if (!html) return "";
  const noTags = html.replace(/<[^>]*>?/gm, " ");
  return decodeHtmlEntities(noTags).replace(/\s+/g, " ").trim();
}

// Helper memecah isi artikel menjadi paragraf-paragraf yang rapi dan nyaman dibaca
export function parseArticleParagraphs(htmlContent: string = ""): string[] {
  if (!htmlContent) return [];

  // Ganti tag penutup paragraf dan br dengan delimiter khusus
  const formatted = htmlContent
    .replace(/<br\s*\/?>/gi, "\n\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, ""); // Hapus sisa tag HTML

  const decoded = decodeHtmlEntities(formatted);

  // Pisahkan berdasarkan enter ganda dan bersihkan spasi berlebih per paragraf
  const paragraphs = decoded
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0 && !p.startsWith("function(") && !p.includes("wp-image-"));

  return paragraphs.length > 0 ? paragraphs : [stripHtml(htmlContent)];
}

// Format tanggal ke Bahasa Indonesia
export function formatNewsDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return isoDate;
  }
}

// Fallback jika offline atau server lambat
const FALLBACK_NEWS: WordPressPost[] = [
  {
    id: 101,
    title: "Semangat Belajar dan Berkarya Bersama Maskumambang",
    excerpt: "Santri Pondok Pesantren Maskumambang terus mengukir prestasi dalam bidang akademik, keagamaan, dan tahfidz Al-Qur'an.",
    content: "Pondok Pesantren Maskumambang Gresik terus berkomitmen memberikan pendidikan terbaik dengan kurikulum terpadu yang memadukan ilmu agama, tahfidz, dan sains modern.",
    paragraphs: [
      "Pondok Pesantren Maskumambang Gresik terus berkomitmen memberikan pendidikan terbaik dengan kurikulum terpadu yang memadukan ilmu agama, tahfidz, dan sains modern.",
      "Melalui berbagai program unggulan, santri didorong untuk tidak hanya menguasai literatur keislaman klasik dan hafalan Al-Qur'an, tetapi juga memiliki keterampilan kepemimpinan dan wawasan teknologi.",
      "Semangat belajar ini tercermin dari antusiasme santri dalam mengikuti berbagai kegiatan akademik maupun ekstrakurikuler setiap harinya."
    ],
    dateFormatted: "23 September 2025",
    category: "Pesantren",
    imageUrl: "https://maskumambang.ac.id/wp-content/uploads/2026/09/WhatsApp-Image-2026-09-15-at-8.01.03-AM.jpeg",
    link: "https://maskumambang.ac.id",
    author: "Humas Pesantren",
  },
  {
    id: 102,
    title: "Jadwal Kegiatan Santri Bulan Ini",
    excerpt: "Berikut adalah jadwal kegiatan santri Pondok Pesantren Maskumambang untuk bulan ini, mencakup kegiatan harian, mingguan, dan bulanan.",
    content: "Agenda santri meliputi pembinaan tahfidz subuh, KBM formal, kajian kitab kuning sore, dan ekstrakurikuler kepemimpinan santri.",
    paragraphs: [
      "Berikut adalah jadwal kegiatan santri Pondok Pesantren Maskumambang untuk bulan ini, mencakup kegiatan harian, mingguan, dan bulanan.",
      "Agenda santri dimulai dengan pembinaan tahfidz Al-Qur'an ba'da Subuh, dilanjutkan KBM formal hingga siang hari.",
      "Pada sore dan malam hari, santri mengikuti kajian kitab kuning serta kegiatan mandiri dan mudzakarah bersama para pembina asrama."
    ],
    dateFormatted: "20 September 2025",
    category: "Kegiatan",
    imageUrl: "https://maskumambang.ac.id/wp-content/uploads/2026/09/STS-Prog-1.jpg",
    link: "https://maskumambang.ac.id",
    author: "Bagian Pengasuhan",
  },
];

export const newsService = {
  /**
   * Ambil daftar artikel terbaru dari WordPress maskumambang.ac.id
   */
  getPosts: async (params?: { search?: string; per_page?: number }): Promise<WordPressPost[]> => {
    try {
      const perPage = params?.per_page || 15;
      let url = `${WP_API_URL}/posts?_embed=1&per_page=${perPage}`;

      if (params?.search && params.search.trim()) {
        url += `&search=${encodeURIComponent(params.search.trim())}`;
      }

      const res = await axios.get(url, { timeout: 10000 });
      const rawPosts = res.data;

      if (!Array.isArray(rawPosts) || rawPosts.length === 0) {
        return FALLBACK_NEWS;
      }

      const formatted: WordPressPost[] = rawPosts.map((p: any) => {
        // Ambil Featured Image URL jika ada
        const featuredMedia = p._embedded?.["wp:featuredmedia"]?.[0];
        const imageUrl =
          featuredMedia?.source_url ||
          featuredMedia?.media_details?.sizes?.medium_large?.source_url ||
          featuredMedia?.media_details?.sizes?.full?.source_url ||
          "https://maskumambang.ac.id/wp-content/uploads/2026/09/STS-Prog-1.jpg";

        // Ambil Nama Kategori
        const terms = p._embedded?.["wp:term"]?.[0];
        let category = "Berita";
        if (Array.isArray(terms) && terms.length > 0) {
          const rawCat = terms[0]?.name || "Berita";
          category = rawCat.replace("@id", "").trim();
        }

        // Ambil Nama Penulis
        const authorObj = p._embedded?.author?.[0];
        const author = authorObj?.name || "Humas Maskumambang";

        const rawContent = p.content?.rendered || p.excerpt?.rendered || "";
        const paragraphs = parseArticleParagraphs(rawContent);

        return {
          id: p.id,
          title: stripHtml(p.title?.rendered || "Tanpa Judul"),
          excerpt: stripHtml(p.excerpt?.rendered || ""),
          content: stripHtml(rawContent),
          paragraphs,
          dateFormatted: formatNewsDate(p.date),
          category,
          imageUrl,
          link: p.link || "https://maskumambang.ac.id",
          author,
        };
      });

      return formatted;
    } catch (err: any) {
      console.warn("Failed fetching WP news from maskumambang.ac.id:", err.message);
      return FALLBACK_NEWS;
    }
  },
};
