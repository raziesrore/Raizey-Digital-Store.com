import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';
import { Wallet, Gamepad2, Tv, AppWindow, CreditCard, Bell, ChevronRight, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  // حالات البيانات
  const [userProfile, setUserProfile] = useState({ full_name: 'محمد', wallet_balance_sdg: 0 });
  const [topServices, setTopServices] = useState([]);
  
  // بيانات الشريط الإعلاني الدوار (Carousel)
  const banners = [
    { id: 1, title: 'عرض الأسبوع: شدات ببجي بأرخص سعر!', discount: 'خصم 10%', color: '#6B21A8' },
    { id: 2, title: 'جواهر فري فاير - شحن فوري بالمعرف', discount: 'شحن تلقائي', color: '#047857' },
  ];

  // أقسام المتجر الأربعة الرئيسية
  const categories = [
    { id: 'games', name: 'شحن ألعاب', icon: Gamepad2 },
    { id: 'subs', name: 'اشتراكات', icon: Tv },
    { id: 'apps', name: 'تطبيقات', icon: AppWindow },
    { id: 'cards', name: 'بطاقات هدايا', icon: CreditCard },
  ];

  useEffect(() => {
    // 1. جلب بيانات المستخدم الأساسية والمحفظة عند فتح الشاشة
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let { data, error } = await supabase
          .from('users')
          .select('full_name, wallet_balance_sdg')
          .eq('id', user.id)
          .single();
        
        if (data) setUserProfile(data);
      }
    };

    // 2. جلب الخدمات الأكثر طلباً من قاعدة البيانات
    const fetchServices = async () => {
      let { data, error } = await supabase
        .from('services')
        .select('*')
        .limit(5);
      if (data) setTopServices(data);
    };

    fetchUserData();
    fetchServices();

    // 3. ⚡ تفعيل الاستماع اللحظي (Supabase Realtime) لتحديث الرصيد فوراً دون إعادة تحميل الشاشة
    const balanceSubscription = supabase
      .channel('public:users')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
        if (payload.new) {
          setUserProfile(prev => ({
            ...prev,
            wallet_balance_sdg: payload.new.wallet_balance_sdg
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(balanceSubscription);
    };
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 1. الكتلة العلوية الديناميكية (Header & Wallet) */}
      <View style={styles.headerBlock}>
        <View style={styles.userInfoRow}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://api.aifindy.com/placeholder/100' }} 
              style={styles.avatar} 
            />
            <View style={styles.onlineBadge} />
          </View>
          <View style={styles.welcomeTextColumn}>
            <Text style={styles.welcomeLabel}>مرحباً بك،</Text>
            <Text style={styles.userName}>{userProfile.full_name}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell color={Theme.textPrimary} size={22} />
          </TouchableOpacity>
        </View>

        {/* كارت المحفظة النيوني الرقمي */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={styles.walletTitleRow}>
              <Wallet color={Theme.cyanBright} size={20} />
              <Text style={styles.walletTitleText}>رصيد محفظتك الحالي</Text>
            </View>
            <Sparkles color={Theme.purpleNeon} size={18} />
          </View>
          <Text style={styles.balanceText}>
            {Number(userProfile.wallet_balance_sdg).toLocaleString('en-US')} <Text style={styles.currencyText}>SDG</Text>
          </Text>
        </View>
      </View>

      {/* 2. الشريط الإعلاني الدوار (Offers Carousel) */}
      <View style={styles.carouselSection}>
        <Text style={styles.sectionTitle}>أحدث العروض الحصرية</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled snapToInterval={width - 32} decelerationRate="fast">
          {banners.map((banner) => (
            <View key={banner.id} style={[styles.bannerCard, { backgroundColor: banner.color }]}>
              <View style={styles.bannerBadge}><Text style={styles.bannerBadgeText}>{banner.discount}</Text></View>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 3. شبكة عرض الأقسام (Categories Grid) */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>أقسام المتجر</Text>
        <View style={styles.gridContainer}>
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <TouchableOpacity key={cat.id} style={styles.categoryItem}>
                <View style={styles.categoryIconWrapper}>
                  <IconComponent color={Theme.purpleNeon} size={26} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. قائمة الخدمات الأكثر طلباً (Most Requested Services) */}
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>الخدمات الأكثر طلباً</Text>
        {topServices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>سيتم تفعيل الخدمات قريباً من الآدمن</Text>
          </View>
        ) : (
          topServices.map((service) => (
            <TouchableOpacity 
              key={service.id} 
              style={styles.serviceRow}
              onPress={() => navigation.navigate('ServiceDetails', { serviceId: service.id, serviceName: service.service_name })}
            >
              <Image source={{ uri: service.icon_url || 'https://api.aifindy.com/placeholder/50' }} style={styles.serviceIcon} />
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceNameText}>{service.service_name}</Text>
                <Text style={styles.serviceCategoryText}>{service.category}</Text>
              </View>
              <ChevronRight color={Theme.textSecondary} size={20} />
            </TouchableOpacity>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  headerBlock: { padding: 20, paddingTop: 50, borderBottomWidth: 1, borderColor: Theme.border },
  userInfoRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 20 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: Theme.purpleNeon },
  onlineBadge: { width: 12, height: 12, backgroundColor: Theme.status.completed, borderRadius: 6, position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: Theme.background },
  welcomeTextColumn: { flex: 1, marginRight: 12, alignItems: 'flex-end' },
  welcomeLabel: { color: Theme.textSecondary, fontSize: 13 },
  userName: { color: Theme.textPrimary, fontSize: 18, fontWeight: 'bold' },
  notificationButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.surface, justifyContent: 'center', alignItems: 'center' },
  
  walletCard: { backgroundColor: Theme.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Theme.purpleNeon + '40', elevation: 8, shadowColor: Theme.purpleNeon, shadowOpacity: 0.1, shadowRadius: 10 },
  walletHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  walletTitleRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  walletTitleText: { color: Theme.textSecondary, fontSize: 14, marginRight: 8 },
  balanceText: { color: Theme.cyanBright, fontSize: 32, fontWeight: '900', textAlign: 'right' },
  currencyText: { fontSize: 16, fontWeight: '500', color: Theme.textPrimary },
  
  sectionTitle: { color: Theme.textPrimary, fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 12, textAlign: 'right' },
  carouselSection: { marginTop: 25 },
  bannerCard: { width: width - 40, height: 130, borderRadius: 16, marginHorizontal: 20, padding: 20, justifyContent: 'center', alignItems: 'flex-end', position: 'relative', overflow: 'hidden' },
  bannerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  bannerBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  bannerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
  
  categoriesSection: { marginTop: 25, paddingHorizontal: 20 },
  gridContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryItem: { width: '23%', backgroundColor: Theme.surface, paddingVertical: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Theme.border, marginBottom: 10 },
  categoryIconWrapper: { marginBottom: 8 },
  categoryName: { color: Theme.textPrimary, fontSize: 11, fontWeight: '600' },
  
  servicesSection: { marginTop: 25, paddingHorizontal: 20, paddingBottom: 40 },
  serviceRow: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Theme.surface, padding: 12, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: Theme.border },
  serviceIcon: { width: 45, height: 45, borderRadius: 10 },
  serviceInfo: { flex: 1, marginRight: 12, alignItems: 'flex-end' },
  serviceNameText: { color: Theme.textPrimary, fontSize: 15, fontWeight: 'bold' },
  serviceCategoryText: { color: Theme.textSecondary, fontSize: 12, marginTop: 2 },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { color: Theme.textSecondary, fontSize: 14 }
});
