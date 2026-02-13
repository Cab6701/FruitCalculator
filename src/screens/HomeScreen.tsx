import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInvoice } from "../hooks/useInvoice";
import { InvoiceItemRow } from "../components/InvoiceItemRow";
import { formatCurrencyVND } from "../utils/format";
import { FruitPreset } from "../types/invoice";
import { getFruitPresets } from "../storage/fruitPresetStorage";
import type { InvoiceItem } from "../types/invoice";

export const HomeScreen: React.FC = () => {
  const {
    items,
    totalAmount,
    isSaving,
    addItem,
    addItemFromPreset,
    applyPresetToItem,
    removeItem,
    updateItemField,
    resetInvoice,
    saveCurrentInvoice,
  } = useInvoice();

  const [presets, setPresets] = useState<FruitPreset[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTargetId, setPickerTargetId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const listRef = useRef<FlatList<InvoiceItem> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        const data = await getFruitPresets();
        if (!cancelled) setPresets(data);
      };
      load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const openFruitPicker = (id: string) => {
    if (!presets.length) {
      Alert.alert(
        "Chưa có danh sách quả",
        "Hãy cài đặt danh sách quả trong màn Cài đặt trước.",
        [{ text: "Đóng", style: "cancel" }],
      );
      return;
    }
    setPickerTargetId(id);
    setPickerVisible(true);
  };

  const closePicker = () => {
    setPickerVisible(false);
    setPickerTargetId(null);
  };

  const handleRemoveItem = (id: string) => {
    Alert.alert(
      "Xoá mặt hàng",
      "Bạn có chắc chắn muốn xoá mặt hàng này không?",
      [
        { text: "Huỷ", style: "cancel" },
        { text: "Xoá", style: "destructive", onPress: () => removeItem(id) },
      ],
    );
  };

  const handleResetInvoice = () => {
    Alert.alert(
      "Làm mới hoá đơn",
      "Bạn có chắc chắn muốn làm mới? Toàn bộ mặt hàng hiện tại sẽ bị xoá.",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Làm mới",
          style: "destructive",
          onPress: () => resetInvoice(),
        },
      ],
    );
  };

  const handleSelectPresetForItem = (preset: FruitPreset) => {
    if (!pickerTargetId) return;
    const applied = applyPresetToItem(pickerTargetId, preset);
    if (!applied) {
      Alert.alert(
        "Đã có trong hoá đơn",
        "Loại quả này đã có trong hoá đơn.",
        [{ text: "OK" }],
      );
      const index = items.findIndex((item) => item.presetId === preset.id);
      if (index !== -1 && listRef.current) {
        setTimeout(() => {
          try {
            listRef.current?.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.5,
            });
          } catch {
            listRef.current?.scrollToEnd({ animated: true });
          }
        }, 0);
      }
    }
    closePicker();
  };

  const handleSaveWithValidation = () => {
    const invalidIndex = items.findIndex(
      (item) =>
        !item.name ||
        item.pricePerKg <= 0 ||
        item.weightKg <= 0,
    );

    if (invalidIndex !== -1) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng chọn loại quả, nhập giá/kg và số kg cho tất cả mặt hàng trước khi lưu hoá đơn.",
      );

      if (listRef.current) {
        try {
          listRef.current.scrollToIndex({
            index: invalidIndex,
            animated: true,
            viewPosition: 0.5,
          });
        } catch {
          listRef.current.scrollToEnd({ animated: true });
        }
      }
      return;
    }

    Alert.alert("Lưu hoá đơn", "Bạn có chắc chắn muốn lưu hoá đơn này không?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Lưu",
        onPress: () => saveCurrentInvoice(note, () => setNote("")),
      },
    ]);
  };

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => (
              <Swipeable
                renderRightActions={() => (
                  <View style={styles.swipeDeleteWrap}>
                    <TouchableOpacity
                      style={styles.swipeDelete}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      <Text style={styles.swipeDeleteText}>Xoá</Text>
                    </TouchableOpacity>
                  </View>
                )}
              >
                <InvoiceItemRow
                  item={item}
                  hasPresets={presets.length > 0}
                  onPressChooseFruit={openFruitPicker}
                  onChangeName={(id, value) => updateItemField(id, "name", value)}
                  onChangePricePerKg={(id, value) =>
                    updateItemField(id, "pricePerKg", value)
                  }
                  onChangeWeightKg={(id, value) =>
                    updateItemField(id, "weightKg", value)
                  }
                  onRemove={handleRemoveItem}
                />
              </Swipeable>
            )}
          />

          <TouchableOpacity
            style={styles.addRowButton}
            onPress={() => {
              addItem();
              if (listRef.current) {
                setTimeout(
                  () => listRef.current?.scrollToEnd({ animated: true }),
                  0,
                );
              }
            }}
          >
            <Text style={styles.addRowText}>+ Thêm mặt hàng</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>

        <Modal
          visible={pickerVisible}
          transparent
          animationType="slide"
          onRequestClose={closePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn loại quả</Text>
              <ScrollView style={styles.modalList}>
                {presets.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={styles.modalItem}
                    onPress={() => handleSelectPresetForItem(preset)}
                  >
                    <Text style={styles.modalItemName}>{preset.name}</Text>
                    <Text style={styles.modalItemPrice}>
                      {formatCurrencyVND(preset.pricePerKg)}/kg
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closePicker}
              >
                <Text style={styles.modalCloseText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.footer}>
          <TextInput
            style={styles.noteInput}
            placeholder="Ghi chú (tuỳ chọn)"
            placeholderTextColor="#999"
            value={note}
            onChangeText={setNote}
          />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalValue}>
              {formatCurrencyVND(totalAmount)}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleResetInvoice}
            >
              <Text style={styles.secondaryButtonText}>Làm mới</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSaveWithValidation}
              disabled={isSaving}
            >
              <Text style={styles.primaryButtonText}>
                {isSaving ? "Đang lưu..." : "Lưu hoá đơn"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  presetsSection: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  presetsLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  presetsRow: {
    paddingBottom: 4,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#e6f4ff",
    marginRight: 8,
  },
  presetName: {
    fontSize: 12,
    fontWeight: "600",
  },
  presetPrice: {
    fontSize: 11,
    color: "#555",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  swipeDeleteWrap: {
    justifyContent: "center",
    alignItems: "center",
    width: 72,
  },
  swipeDelete: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#ff4d4f",
  },
  swipeDeleteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  addRowButton: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#e6f4ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  addRowText: {
    color: "#1890ff",
    fontWeight: "700",
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalList: {
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalItemPrice: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#1890ff",
  },
  modalCloseText: {
    color: "#fff",
    fontWeight: "600",
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fa541c",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  secondaryButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#999",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#1890ff",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
