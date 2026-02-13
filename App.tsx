import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen, type HistoryStackParamList } from './src/screens/HistoryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { InvoiceDetailScreen } from './src/screens/InvoiceDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const HomeStack = createNativeStackNavigator();
const StatsStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator>
      <HistoryStack.Screen
        name="HistoryList"
        component={HistoryScreen}
        options={{ title: 'Lịch sử hoá đơn' }}
      />
      <HistoryStack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={{ title: 'Chi tiết hoá đơn' }}
      />
    </HistoryStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Hoá đơn hoa quả' }}
      />
    </HomeStack.Navigator>
  );
}

function StatsStackNavigator() {
  return (
    <StatsStack.Navigator>
      <StatsStack.Screen
        name="Stats"
        component={StatsScreen}
        options={{ title: 'Thống kê theo ngày' }}
      />
    </StatsStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Cài đặt danh sách quả' }}
      />
    </SettingsStack.Navigator>
  );
}

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    async function hideSplash() {
      await SplashScreen.hideAsync();
      setIsSplashVisible(false);
    }
    const t = setTimeout(hideSplash, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {isSplashVisible && (
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.splashOverlay}>
              <Image
                source={require('./assets/splash-icon.png')}
                style={styles.splashImage}
                resizeMode="contain"
              />
              <Text style={styles.splashCredit}>Phát triển bởi Trịnh Bắc</Text>
            </View>
          </View>
        )}
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap = 'receipt-outline';

                if (route.name === 'Hoá đơn') {
                  iconName = 'receipt-outline';
                } else if (route.name === 'Lịch sử') {
                  iconName = 'time-outline';
                } else if (route.name === 'Thống kê') {
                  iconName = 'stats-chart-outline';
                } else if (route.name === 'Cài đặt') {
                  iconName = 'settings-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Hoá đơn" component={HomeStackNavigator} />
            <Tab.Screen name="Lịch sử" component={HistoryStackNavigator} />
            <Tab.Screen name="Thống kê" component={StatsStackNavigator} />
            <Tab.Screen name="Cài đặt" component={SettingsStackNavigator} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: 200,
    height: 200,
  },
  splashCredit: {
    position: 'absolute',
    bottom: 48,
    fontSize: 14,
    color: '#666666',
  },
});
