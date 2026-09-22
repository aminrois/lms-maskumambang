// mobile/src/screens/Berita/BeritaScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Share,
  Linking,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Search,
  Bell,
  Calendar,
  GraduationCap,
  Megaphone,
  Trophy,
  Landmark,
  Newspaper,
  SlidersHorizontal,
  Bookmark,
  Share2,
  X,
  Clock,
  User,
  Sparkles,
  ArrowRight,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { newsService, WordPressPost } from "../../api/newsService";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { id: "all", label: "Semua", icon: null },
  { id: "pesantren", label: "Pesantren", icon: <Landmark size={14} color="#1D4ED8" /> },
  { id: "kegiatan", label: "Kegiatan", icon: <Calendar size={14} color="#1D4ED8" /> },
  { id: "akademik", label: "Akademik", icon: <GraduationCap size={14} color="#1D4ED8" /> },
  { id: "pengumuman", label: "Pengumuman", icon: <Megaphone size={14} color="#1D4ED8" /> },
  { id: "prestasi", label: "Prestasi", icon: <Trophy size={14} color="#1D4ED8" /> },
];

export const BeritaScreen = () => {
  const navigation = useNavigation<any>();

  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<{ [key: number]: boolean }>({});
  const [selectedArticle, setSelectedArticle] = useState<WordPressPost | null>(null);

  const fetchNews = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      const data = await newsService.getPosts({ search: query, per_page: 20 });
      setPosts(data);
    } catch (e) {
      console.warn("Error loading news:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNews(searchQuery);
    setRefreshing(false);
  };

  const handleSearchSubmit = () => {
    fetchNews(searchQuery);
  };

  const handleToggleBookmark = (id: number) => {
    setBookmarkedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleShare = async (article: WordPressPost) => {
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\nBaca selengkapnya di Portal Maskumambang:\n${article.link}`,
      });
    } catch (e) {
      console.warn("Share failed:", e);
    }
  };

  const handleOpenBrowser = (url: string) => {
    Linking.openURL(url);
  };

  // Filtered Posts berdasarkan Kategori & Search
  const filteredPosts = useMemo(() => {
    let result = posts;

    if (selectedCategory !== "all") {
      const targetCat = selectedCategory.toLowerCase();
      result = result.filter((p) => {
        const cat = p.category.toLowerCase();
        if (targetCat === "pesantren") return cat.includes("pesantren") || cat.includes("artikel") || cat.includes("berita");
        if (targetCat === "kegiatan") return cat.includes("kegiatan") || cat.includes("event") || cat.includes("ramadan");
        if (targetCat === "akademik") return cat.includes("akademik") || cat.includes("kurikulum") || cat.includes("psb");
        if (targetCat === "pengumuman") return cat.includes("pengumuman") || cat.includes("info");
        if (targetCat === "prestasi") return cat.includes("prestasi") || cat.includes("juara");
        return cat.includes(targetCat);
      });
    }

    return result;
  }, [posts, selectedCategory]);

  const featuredPost = posts[0] || null;
  const regularPosts = filteredPosts.length > 0 ? (selectedCategory === "all" ? filteredPosts.slice(1) : filteredPosts) : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* ═══════════════════════════════════════════════════════
          1. TOP NAVIGATION HEADER
      ════════════════════════════════════════════════════════ */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ChevronLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Berita & Informasi</Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setIsSearchOpen(!isSearchOpen)}
            activeOpacity={0.8}
          >
            <Search size={19} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => onRefresh()}
            activeOpacity={0.8}
          >
            <Bell size={19} color="#0F172A" />
            <View style={styles.unreadDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Search Bar */}
      {isSearchOpen && (
        <View style={styles.searchBarWrapper}>
          <Search size={16} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari artikel di maskumambang.ac.id..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                fetchNews("");
              }}
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════
          2. CATEGORY TABS (Horizontal Scroll)
      ════════════════════════════════════════════════════════ */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                {cat.icon && !isSelected && <View style={{ marginRight: 5 }}>{cat.icon}</View>}
                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1D4ED8"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1D4ED8" />
            <Text style={styles.loadingText}>Memuat artikel dari maskumambang.ac.id...</Text>
          </View>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════════
                3. HERO / FEATURED BIG BANNER
            ════════════════════════════════════════════════════════ */}
            {selectedCategory === "all" && featuredPost && !searchQuery && (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => setSelectedArticle(featuredPost)}
                activeOpacity={0.92}
              >
                <Image
                  source={{ uri: featuredPost.imageUrl }}
                  style={styles.featuredImage}
                  resizeMode="cover"
                />
                <View style={styles.featuredOverlay} />

                {/* Badge Terbaru */}
                <View style={styles.featuredBadge}>
                  <Sparkles size={11} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.featuredBadgeText}>TERBARU</Text>
                </View>

                {/* Title & Meta */}
                <View style={styles.featuredContent}>
                  <Text style={styles.featuredTitle} numberOfLines={2}>
                    {featuredPost.title}
                  </Text>
                  <View style={styles.featuredMetaRow}>
                    <View style={styles.metaItem}>
                      <Calendar size={13} color="#E2E8F0" />
                      <Text style={styles.featuredMetaText}>{featuredPost.dateFormatted}</Text>
                    </View>
                    <Text style={styles.metaDivider}>|</Text>
                    <View style={styles.metaItem}>
                      <Landmark size={13} color="#E2E8F0" />
                      <Text style={styles.featuredMetaText}>{featuredPost.category}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* ═══════════════════════════════════════════════════════
                4. SECTION TITLE ("Berita Terbaru" + Filter)
            ════════════════════════════════════════════════════════ */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIconBox}>
                  <Newspaper size={17} color="#1D4ED8" />
                </View>
                <Text style={styles.sectionTitleText}>Berita Terbaru</Text>
              </View>

              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => onRefresh()}
                activeOpacity={0.7}
              >
                <SlidersHorizontal size={14} color="#0F172A" style={{ marginRight: 5 }} />
                <Text style={styles.filterBtnText}>Filter</Text>
              </TouchableOpacity>
            </View>

            {/* ═══════════════════════════════════════════════════════
                5. ARTICLE LIST CARDS
            ════════════════════════════════════════════════════════ */}
            {filteredPosts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Newspaper size={44} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Tidak ada artikel ditemukan</Text>
                <Text style={styles.emptySub}>
                  Coba gunakan kata kunci pencarian atau kategori lain.
                </Text>
              </View>
            ) : (
              (selectedCategory === "all" && !searchQuery ? regularPosts : filteredPosts).map(
                (item) => {
                  const isBookmarked = !!bookmarkedIds[item.id];
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.newsCard}
                      onPress={() => setSelectedArticle(item)}
                      activeOpacity={0.88}
                    >
                      {/* Image Thumbnail */}
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.newsThumb}
                        resizeMode="cover"
                      />

                      {/* Content Right */}
                      <View style={styles.newsContent}>
                        {/* Top: Category Tag & Bookmark */}
                        <View style={styles.newsTopRow}>
                          <View style={styles.catBadge}>
                            <Text style={styles.catBadgeText}>{item.category}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleToggleBookmark(item.id)}
                            style={styles.bookmarkBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Bookmark
                              size={16}
                              color={isBookmarked ? "#1D4ED8" : "#94A3B8"}
                              fill={isBookmarked ? "#1D4ED8" : "transparent"}
                            />
                          </TouchableOpacity>
                        </View>

                        {/* Title */}
                        <Text style={styles.newsTitle} numberOfLines={2}>
                          {item.title}
                        </Text>

                        {/* Meta Date & Category */}
                        <View style={styles.newsMetaRow}>
                          <View style={styles.newsMetaItem}>
                            <Calendar size={11} color="#64748B" />
                            <Text style={styles.newsMetaText}>{item.dateFormatted}</Text>
                          </View>
                          <Text style={styles.newsMetaDivider}>|</Text>
                          <View style={styles.newsMetaItem}>
                            <Landmark size={11} color="#64748B" />
                            <Text style={styles.newsMetaText}>{item.category}</Text>
                          </View>
                        </View>

                        {/* Excerpt Snippet */}
                        <Text style={styles.newsExcerpt} numberOfLines={2}>
                          {item.excerpt}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }
              )
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════
          MODAL: FULL ARTICLE READER
      ════════════════════════════════════════════════════════ */}
      <Modal
        visible={selectedArticle !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedArticle(null)}
      >
        {selectedArticle && (
          <SafeAreaView style={styles.readerSafeArea}>
            {/* Reader Top Bar */}
            <View style={styles.readerTopBar}>
              <TouchableOpacity
                style={styles.readerBackBtn}
                onPress={() => setSelectedArticle(null)}
                activeOpacity={0.8}
              >
                <ChevronLeft size={22} color="#0F172A" />
              </TouchableOpacity>

              <Text style={styles.readerBarTitle} numberOfLines={1}>
                {selectedArticle.category}
              </Text>

              <View style={styles.readerRightActions}>
                <TouchableOpacity
                  style={styles.readerActionBtn}
                  onPress={() => handleShare(selectedArticle)}
                  activeOpacity={0.8}
                >
                  <Share2 size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Reader Content */}
            <ScrollView
              contentContainerStyle={styles.readerScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.readerCatTag}>
                <Text style={styles.readerCatText}>{selectedArticle.category}</Text>
              </View>

              <Text style={styles.readerHeadline}>{selectedArticle.title}</Text>

              {/* Author & Date Bar */}
              <View style={styles.readerMetaBar}>
                <View style={styles.readerMetaItem}>
                  <User size={13} color="#64748B" />
                  <Text style={styles.readerMetaText}>{selectedArticle.author}</Text>
                </View>
                <Text style={styles.readerMetaDivider}>•</Text>
                <View style={styles.readerMetaItem}>
                  <Calendar size={13} color="#64748B" />
                  <Text style={styles.readerMetaText}>{selectedArticle.dateFormatted}</Text>
                </View>
              </View>

              {/* Featured Image */}
              <Image
                source={{ uri: selectedArticle.imageUrl }}
                style={styles.readerCoverImage}
                resizeMode="cover"
              />

              {/* Body Text with distinct paragraphs */}
              <View style={styles.articleBodyContainer}>
                {selectedArticle.paragraphs && selectedArticle.paragraphs.length > 0 ? (
                  selectedArticle.paragraphs.map((para, idx) => (
                    <Text
                      key={idx}
                      style={[
                        styles.articleParagraph,
                        idx === 0 && styles.articleLeadParagraph,
                      ]}
                    >
                      {para}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.articleParagraph}>{selectedArticle.content}</Text>
                )}
              </View>

              {/* Share Article Action Button */}
              <TouchableOpacity
                style={styles.shareArticleBtn}
                onPress={() => handleShare(selectedArticle)}
                activeOpacity={0.85}
              >
                <Share2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.shareArticleBtnText}>Bagikan Berita</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    paddingVertical: 4,
  },
  categoryBar: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  categoryPillActive: {
    backgroundColor: "#1D4ED8",
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  categoryLabelActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 12,
    fontWeight: "600",
  },

  // Hero Featured Banner
  featuredCard: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    marginBottom: 20,
    backgroundColor: "#0F172A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  featuredImage: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  featuredBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  featuredContent: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
  },
  featuredTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 23,
    marginBottom: 8,
  },
  featuredMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaDivider: {
    color: "rgba(255, 255, 255, 0.6)",
    marginHorizontal: 8,
    fontSize: 11,
  },
  featuredMetaText: {
    fontSize: 11,
    color: "#E2E8F0",
    fontWeight: "600",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0F172A",
  },

  // News Cards
  newsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  newsThumb: {
    width: 95,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  newsContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  newsTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  catBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#15803D",
  },
  bookmarkBtn: {
    padding: 2,
  },
  newsTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 17,
  },
  newsMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  newsMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  newsMetaDivider: {
    color: "#94A3B8",
    marginHorizontal: 5,
    fontSize: 10,
  },
  newsMetaText: {
    fontSize: 9.5,
    color: "#64748B",
    fontWeight: "600",
  },
  newsExcerpt: {
    fontSize: 10,
    color: "#64748B",
    lineHeight: 14,
    marginTop: 4,
  },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 10,
  },
  emptySub: {
    fontSize: 11.5,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },

  // Reader Modal
  readerSafeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  readerTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  readerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  readerBarTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    maxWidth: width * 0.5,
  },
  readerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  readerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  readerScrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  readerCatTag: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  readerCatText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  readerHeadline: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    lineHeight: 28,
  },
  readerMetaBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  readerMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  readerMetaDivider: {
    color: "#CBD5E1",
    marginHorizontal: 8,
    fontSize: 12,
  },
  readerMetaText: {
    fontSize: 11.5,
    color: "#64748B",
    fontWeight: "600",
  },
  readerCoverImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 18,
  },
  articleBodyContainer: {
    marginTop: 4,
    marginBottom: 10,
  },
  articleParagraph: {
    fontSize: 15.5,
    lineHeight: 26,
    color: "#334155",
    marginBottom: 16,
    letterSpacing: 0.15,
  },
  articleLeadParagraph: {
    fontSize: 16.5,
    lineHeight: 27,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 18,
  },
  shareArticleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D4ED8",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
    marginBottom: 30,
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  shareArticleBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
