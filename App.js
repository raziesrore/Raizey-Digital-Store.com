import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Theme } from './src/theme';

// استيراد الشاشات الخمس التي قمنا ببنائها
import HomeScreen from './src/screens/HomeScreen';
import ServiceDetailsScreen from './src/screens/ServiceDetailsScreen';
import WalletScreen from './src/screens/WalletScreen';
import OrdersTrackerScreen from './src/screens/OrdersTrackerScreen';
import DepositPortalScreen from './src/screens/DepositPortalScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {/* شريط الحالة العلوي للهاتف متوافق مع الثيم المظلم */}
        <StatusBar style="light" backgroundColor={Theme.background} />
        
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: Theme.surface },
            headerTintColor: Theme.textPrimary,
            headerTitleStyle: { fontWeight: 'bold', fontSize: 16 },
            headerTitleAlign: 'center',
            contentStyle: { backgroundColor: Theme.background },
            animation: 'slide_from_left' // حركة سلسة وتأثير سينمائي عند الانتقال
          }}
        >
          {/* 1. الواجهة الرئيسية للمتجر */}
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }} // إخفاء الهيدر الافتراضي لأننا صممنا هيدر مخصص
          />
          
          {/* 2. تفاصيل الخدمة وشحن المعرف */}
          <Stack.Screen 
            name="ServiceDetails" 
            component={ServiceDetailsScreen} 
            options={{ title: 'تفاصيل الخدمة الرقمية' }}
          />
          
          {/* 3. لوحة المحفظة ونظام الإحالات */}
          <Stack.Screen 
            name="Wallet" 
            component={WalletScreen} 
            options={{ title: 'محفظتي الإلكترونية' }}
          />
          
          {/* 4. متتبع الطلبات الذكي */}
          <Stack.Screen 
            name="OrdersTracker" 
            component={OrdersTrackerScreen} 
            options={{ title: 'متتبع الطلبات الحالي' }}
          />
          
          {/* 5. بوابة رفع الإيداعات البنكية المأمنة */}
          <Stack.Screen 
            name="DepositPortal" 
            component={DepositPortalScreen} 
            options={{ title: 'بوابة إيداع الأموال' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
