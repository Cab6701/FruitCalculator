import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Invoice, InvoiceItem } from '../types/invoice';
import { formatCurrencyVND, formatDateTime } from '../utils/format';

type Props = {
  route: {
    params: {
      invoice: Invoice;
    };
  };
};

export const InvoiceDetailScreen: React.FC<Props> = ({ route }) => {
  const { invoice } = route.params;

  const renderItem = ({ item }: { item: InvoiceItem }) => {
    const lineTotal = item.pricePerKg * item.weightKg;

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemHeaderRow}>
          <Text style={styles.itemName}>{item.name || 'Mặt hàng'}</Text>
          <Text style={styles.itemLineTotal}>{formatCurrencyVND(lineTotal)}</Text>
        </View>
        <Text style={styles.itemMeta}>
          Giá/kg: {formatCurrencyVND(item.pricePerKg)} · Số kg: {item.weightKg}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatDateTime(invoice.createdAt)}</Text>
        <Text style={styles.totalText}>{formatCurrencyVND(invoice.totalAmount)}</Text>
        <Text style={styles.countText}>{invoice.items.length} mặt hàng</Text>
        {invoice.note?.trim() ? (
          <Text style={styles.noteText}>{invoice.note.trim()}</Text>
        ) : null}
      </View>

      <FlatList
        data={invoice.items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateText: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fa541c',
  },
  countText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  noteText: {
    marginTop: 8,
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
  },
  listContent: {
    padding: 16,
  },
  itemRow: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemLineTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  itemMeta: {
    fontSize: 12,
    color: '#666',
  },
});

