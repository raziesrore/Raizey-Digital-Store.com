import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';
import { ShieldCheck, ShoppingCart, User, Smartphone } from 'lucide-react-native';

export default function ServiceDetailsScreen({ route, navigation }) {
  // استقبال المعاملات المرسلة من الشاشة الرئيسية
  const { serviceId, serviceName } = route.params || { serviceId: 1, serviceName: 'خدمة رقمية' };

  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    // جلب الحزم الرقمية التابعة لهذه الخدمة فقط
    const fetchPackages = async () => {
      try {
        let { data, error } = await supabase
          .from('packages')
          .select('*')
          .eq('service_id', serviceId);
        
        if (data) setPackages(data);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };

    fetchPackages();
  }, [serviceId]);

  // منطق عملية الشراء الآمنة
  const handlePurchase = async () => {
    // 1. التحقق من المدخلات
    if (!playerId.trim()) {
      Alert.alert('تنبيه', 'الرجاء إدخال معرّف اللاعب (Player ID) أولاً');
      return;
    }
    if (!selectedPackage) {
      Alert.alert('تنبيه', 'الرجاء اختيار الحزمة المراد شحنها');
      return;
    }

    setLoading(true);

    try {
      // جلب معرف العميل الحالي الموثق
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('خطأ', 'يجب تسجيل الدخول لإتمام العملية');
        setLoading(false);
        return;
      }

      // 2. استدعاء الدالة الذكية الصامتة عبر RPC لحماية المحفظة من هجمات التزامن
      const { data, error } = await supabase.rpc('buy_package_securely', {
        p_user_id: user.id,
        p_package_id: selectedPackage.id,
        p_target_id: playerId
      });

      if (error) throw error;

      // 3. معالجة الرد القادم من السيرفر
      if (data.success) {
        Alert.alert('تمت العملية بنجاح 🎉', data.message, [
          { text: 'متتبع طلباتي', onPress: () => navigation.navigate('OrdersTracker') },
          { text: 'الرئيسية', onPress: () => navigation.navigate('Home') }
        ]);
        setPlayerId('');
        setSelectedPackage(null);
      } else {
        Alert.alert('فشلت العملية ❌', data.message);
      }

    } catch (err) {
      Alert.alert('خطأ في السيرفر', err.message || 'حدث خطأ غير متوقع أثناء المعالجة');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Theme.purpleNeon} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* رأس الصفحة */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{serviceName}</Text>
        <Text style={styles.headerSubtitle}>أدخل المعرّف واختر الباقة المناسبة للشحن الفوري</Text>
      </View>

      {/* حقل إدخال معرّف اللاعب */}
      <View style={styles.section}>
        <Text style={styles.inputLabel}>معرّف اللاعب / الحساب (Required ID)</Text>
        <View style={styles.inputWrapper}>
          <User color={Theme.textSecondary} size={20} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="أدخل الـ Player ID هنا..."
            placeholderTextColor={Theme.textSecondary}
            value={playerId}
            onChangeText={setPlayerId}
            keyboardType="default"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* شبكة الباقات المتاحة */}
      <View style={styles.section}>
        <Text style={styles.inputLabel}>اختر الحزمة الرقمية</Text>
        {packages.length === 0 ? (
          <Text style={styles.noDataText}>لا توجد باقات متوفرة لهذه الخدمة حالياً.</Text>
        ) : (
          <View style={styles.grid}>
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    isSelected && styles.packageCardSelected
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  <Smartphone color={isSelected ? Theme.cyanBright : Theme.purpleNeon} size={24} />
                  <Text style={[styles.packageTitle, isSelected && styles.textCyan]}>
                    {pkg.package_title}
                  </Text>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>
                      {Number(pkg.price_sdg).toLocaleString('en-US')} SDG
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* زر الشراء المحمي والآمن */}
      <View style={styles.footerSection}>
        <View style={styles.secureBadge}>
          <ShieldCheck color={Theme.status.completed} size={16} />
          <Text style={styles.secureText}>معاملة مالية محمية ومشفرة بالكامل</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.buyButton, loading && styles.disabledButton]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={styles.buttonInner}>
              <ShoppingCart color="#FFF" size={20} style={styles.btnIcon} />
              <Text style={styles.buyButtonText}>اشترِ الآن واشحن فوراً</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  loaderContainer: { flex: 1, backgroundColor: Theme.background, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 50, borderBottomWidth: 1, borderColor: Theme.border, alignItems: 'flex-end' },
  headerTitle: { color: Theme.textPrimary, fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: Theme.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'right' },
  
  section: { marginTop: 25, paddingHorizontal: 20 },
  inputLabel: { color: Theme.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 10, textAlign: 'right' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.surface, borderRadius: 12, borderWidth: 1, borderColor: Theme.border, paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, height: 50, color: Theme.textPrimary, textAlign: 'right', fontSize: 15 },
  
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 5 },
  packageCard: { width: '48%', backgroundColor: Theme.surface, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Theme.border, marginBottom: 15, position: 'relative' },
  packageCardSelected: { borderColor: Theme.cyanBright, shadowColor: Theme.cyanBright, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  packageTitle: { color: Theme.textPrimary, fontSize: 15, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  textCyan: { color: Theme.cyanBright },
  priceTag: { marginTop: 12, backgroundColor: 'rgba(6, 182, 212, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  priceText: { color: Theme.cyanBright, fontSize: 13, fontWeight: 'bold' },
  noDataText: { color: Theme.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 15 },
  
  footerSection: { marginTop: 30, paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  secureBadge: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15 },
  secureText: { color: Theme.textSecondary, fontSize: 12, marginRight: 6 },
  buyButton: { width: '100%', height: 55, backgroundColor: Theme.purpleNeon, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  buttonInner: { flexDirection: 'row-reverse', alignItems: 'center' },
  btnIcon: { marginLeft: 8 },
  buyButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { backgroundColor: Theme.border }
});
