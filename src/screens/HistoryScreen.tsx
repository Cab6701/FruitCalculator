import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { clearAllInvoices, deleteInvoiceById, getInvoices } from '../storage/invoiceStorage';
import { Invoice } from '../types/invoice';
import { formatCurrencyVND, formatDateTime } from '../utils/format';

export type HistoryStackParamList = {
  HistoryList: undefined;
  InvoiceDetail: { invoice: Invoice };
};

type HistoryScreenNavigationProp = NativeStackNavigationProp<
  HistoryStackParamList,
  'HistoryList'
>;

export const HistoryScreen: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<HistoryScreenNavigationProp>();

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    const data = await getInvoices();
    setInvoices(data);
    setLoading(false);
  }, []);

  const handleDeleteInvoice = (id: string) => {
    Alert.alert('Xoá hoá đơn', 'Bạn có chắc chắn muốn xoá hoá đơn này không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          await deleteInvoiceById(id);
          setInvoices((prev) => prev.filter((inv) => inv.id !== id));
        },
      },
    ]);
  };

  const handleClearAll = () => {
    if (!invoices.length) {
      return;
    }

    Alert.alert(
      'Xoá tất cả hoá đơn',
      'Bạn có chắc chắn muốn xoá toàn bộ lịch sử hoá đơn không?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            await clearAllInvoices();
            setInvoices([]);
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices]),
  );

  const renderItem = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('InvoiceDetail', { invoice: item })}
    >
      <View style={styles.itemRow}>
        <Text style={styles.itemTitle}>{formatDateTime(item.createdAt)}</Text>
        <Text style={styles.itemAmount}>{formatCurrencyVND(item.totalAmount)}</Text>
      </View>
      <View style={styles.itemFooterRow}>
        <Text style={styles.itemSubtitle}>{item.items.length} mặt hàng</Text>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteInvoice(item.id);
          }}
        >
          <Text style={styles.deleteText}>Xoá</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : invoices.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Chưa có hoá đơn nào.</Text>
          <Text style={styles.emptySubText}>Hãy tạo hoá đơn mới ở tab Hoá đơn.</Text>
        </View>
      ) : (
        <>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearText}>Xoá tất cả</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={invoices}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
          />
        </>
      )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  clearText: {
    fontSize: 14,
    color: '#ff4d4f',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemFooterRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fa541c',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  deleteText: {
    fontSize: 13,
    color: '#ff4d4f',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

