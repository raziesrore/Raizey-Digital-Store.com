import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Clipboard, Share, Alert, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';
import { Wallet, Share2, Users, TrendingUp, History, ArrowUpRight, Copy } from 'lucide-react-native';

export default function WalletScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({ count: 0, earnings: 0 });
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchWalletAndReferrals = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. جلب بيانات المحفظة وكود الإحالة للمستخدم
        let { data: userData, error: userError } = await supabase
          .from('users')
          .select('wallet_balance_sdg, referral_code')
          .eq('id', user.id)
          .single();

        if (userData) {
          setWalletBalance(userData.wallet_balance_sdg);
          setReferralCode(userData.referral_code);
          
          // 2. حساب عدد الإحالات المشتقة من كود هذا المستخدم
          let { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by_code', userData.referral_code);
          
          // حساب أرباح وهمية أو تقديرية بناء على عدد الإحالات (مثلاً 500 جنيه لكل إحالة نشطة)
          setReferralStats({
            count: count || 0,
            earnings: (count || 0) * 500 
          });
        }

        // 3. جلب سجل المعاملات المالية (الإيداعات)
        let { data: txData, error: txError } = await supabase
          .from('deposit_transactions')
          .select('id, amount, status, created_at, transaction_ref')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (txData) setTransactions(txData);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAndReferrals();
  }, []);

  // دالة نسخ كود الإحالة
  const copyToClipboard = () => {
    Clipboard.setString(referralCode);
    Alert.alert('تم النسخ', 'تم نسخ كود الإحالة الخاص بك بنجاح!');
  };

  // دالة مشاركة رابط التطبيق والكود
  const shareReferral = async () => {
    try {
      await Share.share({
        message: `سجل في متجر RAIZ3Y STORE الرقمي واستخدم كود الإحالة الخاص بي لتفعيل محفظتك: ${referralCode}`,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  // تحديد لون حالة المعاملة المالية
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return Theme.status.completed;
      case 'pending': return Theme.status.pending;
      case 'rejected': return Theme.status.cancelled;
      default: return Theme.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Theme.cyanBright} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 1. قسم الرصيد الرئيسي والتحويل السريع */}
      <View style={styles.balanceSection}>
        <Text style={styles.sectionLabel}>إجمالي الرصيد المتوفر</Text>
        <Text style={styles.balanceText}>
          {Number(walletBalance).toLocaleString('en-US')} <Text style={styles.currencyText}>SDG</Text>
        </Text>
        
        <TouchableOpacity 
          style={styles.depositButton}
          onPress={() => navigation.navigate('DepositPortal')}
        >
          <ArrowUpRight color="#0B0F19" size={20} style={styles.btnIcon} />
          <Text style={styles.depositButtonText}>إيداع بنكي وشحن المحفظة</Text>
        </TouchableOpacity>
      </View>

      {/* 2. حاوية نظام الإحالات والتحليلات */}
      <View style={styles.referralCard}>
        <Text style={styles.referralTitle}>برنامج الإحالة والربح 🎁</Text>
        <Text style={styles.referralSubtitle}>شارك كود الإحالة الخاص بك مع أصدقائك واحصل على مكافآت فورية عند شحن محفظتهم.</Text>
        
        {/* صندوق الكود */}
        <View style={styles.codeRow}>
          <TouchableOpacity style={styles.shareButton} onPress={shareReferral}>
            <Share2 color={Theme.purpleNeon} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
            <Copy color={Theme.textSecondary} size={18} />
          </TouchableOpacity>
          <Text style={styles.codeText}>{referralCode || 'NOT_FOUND'}</Text>
        </View>

        {/* لوحة تحليلات صغيرة */}
        <View style={styles.analyticsRow}>
          <View style={styles.analyticBox}>
            <TrendingUp color={Theme.cyanBright} size={22} />
            <Text style={styles.analyticValue}>{referralStats.earnings} SDG</Text>
            <Text style={styles.analyticLabel}>أرباح الإحالة</Text>
          </View>
          <View style={styles.analyticBox}>
            <Users color={Theme.purpleNeon} size={22} />
            <Text style={styles.analyticValue}>{referralStats.count}</Text>
            <Text style={styles.analyticLabel}>الأصدقاء المسجلين</Text>
          </View>
        </View>
      </View>

      {/* 3. سجل الحركات المالية (Transactions History) */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <History color={Theme.textSecondary} size={18} />
          <Text style={styles.historyTitleText}>سجل العمليات المالية</Text>
        </View>

        {transactions.length === 0 ? (
          <Text style={styles.noTransactions}>لا توجد حركات مالية مسجلة حتى الآن.</Text>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txLeft}>
                <Text style={styles.txAmount}>+{Number(tx.amount).toLocaleString('en-US')} SDG</Text>
                <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString('ar-SD')}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txTitle}>شحن محفظة عبر إيداع</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tx.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(tx.status) }]}>
                    {tx.status === 'Approved' ? 'مكتمل' : tx.status === 'Pending' ? 'قيد المراجعة' : 'مرفوض'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  loaderContainer: { flex: 1, backgroundColor: Theme.background, justifyContent: 'center', alignItems: 'center' },
  
  balanceSection: { padding: 30, paddingTop: 50, alignItems: 'center', backgroundColor: Theme.surface, borderBottomWidth: 1, borderColor: Theme.border },
  sectionLabel: { color: Theme.textSecondary, fontSize: 14, marginBottom: 8 },
  balanceText: { color: Theme.cyanBright, fontSize: 36, fontWeight: '900' },
  currencyText: { fontSize: 18, color: Theme.textPrimary, fontWeight: '500' },
  depositButton: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Theme.cyanBright, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 20, width: '100%', justifyContent: 'center' },
  btnIcon: { marginLeft: 8 },
  depositButtonText: { color: '#0B0F19', fontSize: 15, fontWeight: 'bold' },
  
  referralCard: { margin: 20, backgroundColor: Theme.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Theme.purpleNeon + '30' },
  referralTitle: { color: Theme.textPrimary, fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 6 },
  referralSubtitle: { color: Theme.textSecondary, fontSize: 12, textAlign: 'right', lineHeight: 18, marginBottom: 15 },
  codeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.background, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: Theme.border, marginBottom: 20 },
  shareButton: { width: 40, height: 40, backgroundColor: Theme.purpleNeon + '15', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  copyButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
  codeText: { flex: 1, color: Theme.textPrimary, fontSize: 16, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 },
  
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  analyticBox: { width: '48%', backgroundColor: Theme.background, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Theme.border },
  analyticValue: { color: Theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  analyticLabel: { color: Theme.textSecondary, fontSize: 11, marginTop: 2 },

  historySection: { paddingHorizontal: 20, paddingBottom: 40 },
  historyHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15 },
  historyTitleText: { color: Theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  noTransactions: { color: Theme.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 20 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Theme.surface, padding: 15, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: Theme.border },
  txLeft: { alignItems: 'flex-start' },
  txAmount: { color: Theme.cyanBright, fontSize: 15, fontWeight: 'bold' },
  txDate: { color: Theme.textSecondary, fontSize: 11, marginTop: 4 },
  txRight: { alignItems: 'flex-end' },
  txTitle: { color: Theme.textPrimary, fontSize: 14, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold' }
});
