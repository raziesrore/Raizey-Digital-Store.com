import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';
import { Clock, CheckCircle2, AlertTriangle, XCircle, Gamepad2 } from 'lucide-react-native';

export default function OrdersTrackerScreen() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // active | completed
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // جلب الطلبات مع تفاصيل الحزمة والخدمة المرتبطة بها عبر العلاقات
        let { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            target_player_id,
            total_paid_sdg,
            status,
            created_at,
            packages (
              package_title,
              services (
                service_name,
                icon_url
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // تصفية الطلبات بناءً على التبويب النشط
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'active') {
      return order.status === 'Pending' || order.status === 'Processing';
    } else {
      return order.status === 'Completed' || order.status === 'Cancelled';
    }
  });

  // دالة لجلب تفاصيل شارة الحالة (اللون، الأيقونة، النص العربي)
  const getStatusDetails = (status) => {
    switch (status) {
      case 'Pending':
        return { color: Theme.status.pending, text: 'قيد الانتظار', icon: Clock };
      case 'Processing':
        return { color: Theme.status.processing, text: 'جاري التنفيذ', icon: Gamepad2 };
      case 'Completed':
        return { color: Theme.status.completed, text: 'مكتمل بنجاح', icon: CheckCircle2 };
      case 'Cancelled':
        return { color: Theme.status.cancelled, text: 'ملغي', icon: XCircle };
      default:
        return { color: Theme.textSecondary, text: status, icon: AlertTriangle };
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Theme.purpleNeon} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* رأس الصفحة */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>متتبع طلباتي الذكي</Text>
        <Text style={styles.headerSubtitle}>تابع حالة شحن حزمك الرقمية أولاً بأول</Text>
      </View>

      {/* التبويبات (Tabs) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTabBorder]} 
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>الطلبات المكتملة</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTabBorder]} 
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>الطلبات النشطة</Text>
        </TouchableOpacity>
      </View>

      {/* قائمة الطلبات */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AlertTriangle color={Theme.textSecondary} size={40} />
            <Text style={styles.emptyText}>لا توجد طلبات في هذا القسم حالياً</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusInfo = getStatusDetails(order.status);
            const StatusIcon = statusInfo.icon;
            const serviceData = order.packages?.services;
            
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  {/* شارة الحالة الملونة أوتوماتيكياً */}
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                    <StatusIcon color={statusInfo.color} size={14} style={styles.badgeIcon} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                  </View>
                  
                  {/* الطابع الزمني */}
                  <Text style={styles.orderDate}>
                    {new Date(order.created_at).toLocaleDateString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.gameName}>{serviceData?.service_name || 'خدمة رقمية'}</Text>
                    <Text style={styles.packageName}>{order.packages?.package_title}</Text>
                    
                    <View style={styles.idRow}>
                      <Text style={styles.idValue}>{order.target_player_id}</Text>
                      <Text style={styles.idLabel}> :Player ID</Text>
                    </View>
                  </View>

                  {/* أيقونة اللعبة أو الخدمة */}
                  <Image 
                    source={{ uri: serviceData?.icon_url || 'https://api.aifindy.com/placeholder/60' }} 
                    style={styles.gameIcon} 
                  />
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.priceValue}>{Number(order.total_paid_sdg).toLocaleString('en-US')} SDG</Text>
                  <Text style={styles.priceLabel}>المبلغ المدفوع:</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  loaderContainer: { flex: 1, backgroundColor: Theme.background, justifyContent: 'center', alignItems: 'center' },
  
  header: { padding: 20, paddingTop: 50, borderBottomWidth: 1, borderColor: Theme.border, alignItems: 'flex-end' },
  headerTitle: { color: Theme.textPrimary, fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: Theme.textSecondary, fontSize: 13, marginTop: 4 },
  
  tabsContainer: { flexDirection: 'row', backgroundColor: Theme.surface, borderBottomWidth: 1, borderColor: Theme.border },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  activeTabBorder: { borderBottomWidth: 2, borderColor: Theme.purpleNeon },
  tabText: { color: Theme.textSecondary, fontSize: 14, fontWeight: '600' },
  activeTabText: { color: Theme.purpleNeon, fontWeight: 'bold' },
  
  scrollContainer: { padding: 20, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: Theme.textSecondary, fontSize: 14, marginTop: 10 },
  
  orderCard: { backgroundColor: Theme.surface, borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: Theme.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: Theme.border, paddingBottom: 10, marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeIcon: { marginRight: 5 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  orderDate: { color: Theme.textSecondary, fontSize: 11 },
  
  cardBody: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  orderInfo: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
  gameName: { color: Theme.textPrimary, fontSize: 16, fontWeight: 'bold' },
  packageName: { color: Theme.cyanBright, fontSize: 13, marginTop: 2, fontWeight: '500' },
  idRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: Theme.background, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  idValue: { color: Theme.textPrimary, fontSize: 13, fontFamily: 'monospace' },
  idLabel: { color: Theme.textSecondary, fontSize: 12 },
  gameIcon: { width: 55, height: 55, borderRadius: 12, borderWidth: 1, borderColor: Theme.border },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: Theme.border },
  priceLabel: { color: Theme.textSecondary, fontSize: 12, marginLeft: 5 },
  priceValue: { color: Theme.textPrimary, fontSize: 14, fontWeight: 'bold' }
});
