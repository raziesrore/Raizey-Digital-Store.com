import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';
import { Landmark, Hash, DollarSign, Image as ImageIcon, Send, ShieldAlert } from 'lucide-react-native';

export default function DepositPortalScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('https://nyxteyfpdautvbmumawi.supabase.co/storage/v1/object/public/receipts/mock_receipt.jpg'); // رابط افتراضي للتجربة والـ OCR
  const [loading, setLoading] = useState(false);

  // منطق إرسال الإيداع البنكي لقاعدة البيانات
  const handleDepositSubmit = async () => {
    // 1. التحقق من إدخال البيانات الأساسية
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('تنبيه', 'الرجاء إدخال قيمة المبلغ المحول بشكل صحيح');
      return;
    }
    if (!transactionRef.trim()) {
      Alert.alert('تنبيه', 'الرجاء إدخال رقم المعاملة أو المرجع البنكي (Transaction Ref)');
      return;
    }

    setLoading(true);

    try {
      // جلب معرف المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
        setLoading(false);
        return;
      }

      // 2. إدخال المعاملة في جدول deposit_transactions
      // تنبيه أمني: قيد الـ UNIQUE على الـ transaction_ref هيمنع الإيصال من التكرار تلقائياً في السيرفر
      const { data, error } = await supabase
        .from('deposit_transactions')
        .insert([
          {
            user_id: user.id,
            transaction_ref: transactionRef.trim(),
            amount: parseFloat(amount),
            receipt_image_url: receiptUrl,
            status: 'Pending'
          }
        ]);

      if (error) {
        // إذا كان رقم المعاملة مكرر، السيستم هيرفض فوراً بفضل الـ UNIQUE constraint
        if (error.code === '23505') {
          Alert.alert('تحذير أمني ⚠️', 'رقم هذه العملية مسجل مسبقاً! لا يمكنك إعادة استخدام نفس الإيصال.');
        } else {
          throw error;
        }
        setLoading(false);
        return;
      }

      // 3. النجاح والتوجه للوحة التحكم
      Alert.alert(
        'تم إرسال الطلب بنجاح 📨', 
        'تم توجيه بيانات الإيصال إلى محرك التحقق الذكي، ستظهر المعاملة لدى الإدارة للمراجعة والشحن الفوري.',
        [{ text: 'حسناً', onPress: () => navigation.navigate('Wallet') }]
      );
      
      setAmount('');
      setTransactionRef('');

    } catch (err) {
      Alert.alert('خطأ في الإرسال', err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* رأس الصفحة */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>بوابة إيداع الأموال</Text>
        <Text style={styles.headerSubtitle}>شحن المحفظة عبر تطبيقات الدفع المحلية (بنكك / فوري)</Text>
      </View>

      {/* تعليمات الحسابات البنكية للمتجر */}
      <View style={styles.bankAccountsCard}>
        <View style={styles.bankHeaderRow}>
          <Landmark color={Theme.purpleNeon} size={20} />
          <Text style={styles.bankTitle}>حسابات المتجر الرسمية للتحويل</Text>
        </View>
        
        <View style={styles.accountBox}>
          <Text style={styles.bankName}>🏦 بنك الخرطوم (بنكك)</Text>
          <Text style={styles.accountNumber}>رقم الحساب: 1234567</Text>
          <Text style={styles.accountHolder}>الاسم: متجر RAIZ3Y STORE الرقمي</Text>
        </View>

        <View style={[styles.accountBox, { marginTop: 10 }]}>
          <Text style={styles.bankName}>📱 تطبيق فوري</Text>
          <Text style={styles.accountNumber}>رقم المشترك / الهاتف: 0912345678</Text>
        </View>
      </View>

      {/* نموذج إدخال بيانات الإيصال */}
      <View style={styles.formSection}>
        <Text style={styles.formTitle}>أدخل بيانات التحويل الفعلي</Text>

        {/* حقل المبلغ */}
        <Text style={styles.inputLabel}>المبلغ المحول بالجنيه السوداني (SDG)</Text>
        <View style={styles.inputWrapper}>
          <DollarSign color={Theme.textSecondary} size={18} />
          <TextInput
            style={styles.textInput}
            placeholder="مثال: 50000"
            placeholderTextColor={Theme.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* حقل رقم العملية البنكية */}
        <Text style={styles.inputLabel}>رقم المعاملة / المرجع البنكي (Transaction Ref)</Text>
        <View style={styles.inputWrapper}>
          <Hash color={Theme.textSecondary} size={18} />
          <TextInput
            style={styles.textInput}
            placeholder="أدخل رقم العملية المستخرج من الإيصال..."
            placeholderTextColor={Theme.textSecondary}
            value={transactionRef}
            onChangeText={setTransactionRef}
            keyboardType="default"
          />
        </View>

        {/* حاوية رفع صورة الإيصال التفاعلية */}
        <Text style={styles.inputLabel}>صورة إيصال الدفع (Screenshot)</Text>
        <TouchableOpacity style={styles.uploadContainer} activeOpacity={0.7}>
          <ImageIcon color={Theme.cyanBright} size={32} />
          <Text style={styles.uploadText}>تم اختيار لقطة الشاشة تلقائياً</Text>
          <Text style={styles.uploadSubtext}>سيقوم محرك الـ OCR بقراءة النص ومطابقته</Text>
        </TouchableOpacity>
      </View>

      {/* زر التأكيد والإرسال */}
      <View style={styles.btnSection}>
        <View style={styles.warningBox}>
          <ShieldAlert color={Theme.status.pending} size={16} />
          <Text style={styles.warningText}>إدخال بيانات مكررة أو وهمية يعرض حسابك للحظر الفوري.</Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.disabledBtn]} 
          onPress={handleDepositSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0B0F19" />
          ) : (
            <View style={styles.btnInner}>
              <Send color="#0B0F19" size={18} style={styles.btnIcon} />
              <Text style={styles.submitBtnText}>إرسال الإيصال للاعتماد</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  header: { padding: 20, paddingTop: 50, borderBottomWidth: 1, borderColor: Theme.border, alignItems: 'flex-end' },
  headerTitle: { color: Theme.textPrimary, fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: Theme.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'right' },
  
  bankAccountsCard: { margin: 20, backgroundColor: Theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Theme.border },
  bankHeaderRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15 },
  bankTitle: { color: Theme.textPrimary, fontSize: 15, fontWeight: 'bold', marginRight: 8 },
  accountBox: { backgroundColor: Theme.background, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Theme.border, alignItems: 'flex-end' },
  bankName: { color: Theme.cyanBright, fontSize: 14, fontWeight: 'bold' },
  accountNumber: { color: Theme.textPrimary, fontSize: 13, marginTop: 4, fontFamily: 'monospace' },
  accountHolder: { color: Theme.textSecondary, fontSize: 12, marginTop: 2 },
  
  formSection: { paddingHorizontal: 20 },
  formTitle: { color: Theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'right' },
  inputLabel: { color: Theme.textSecondary, fontSize: 13, marginBottom: 8, textAlign: 'right' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.surface, borderRadius: 12, borderWidth: 1, borderColor: Theme.border, paddingHorizontal: 15, marginBottom: 15 },
  textInput: { flex: 1, height: 48, color: Theme.textPrimary, textAlign: 'right', fontSize: 14 },
  
  uploadContainer: { backgroundColor: Theme.surface, borderRadius: 14, borderStyle: 'dashed', borderWidth: 1.5, borderColor: Theme.cyanBright + '80', padding: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  uploadText: { color: Theme.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 10 },
  uploadSubtext: { color: Theme.textSecondary, fontSize: 11, marginTop: 4 },
  
  btnSection: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  warningBox: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 10, borderRadius: 10, marginBottom: 15 },
  warningText: { color: Theme.status.pending, fontSize: 11, marginRight: 6, textAlign: 'right' },
  submitButton: { width: '100%', height: 52, backgroundColor: Theme.cyanBright, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  btnInner: { flexDirection: 'row-reverse', alignItems: 'center' },
  btnIcon: { marginLeft: 6 },
  submitBtnText: { color: '#0B0F19', fontSize: 15, fontWeight: 'bold' },
  disabledBtn: { backgroundColor: Theme.border }
});
