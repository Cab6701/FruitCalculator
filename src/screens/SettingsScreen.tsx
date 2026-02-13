import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native-safe-area-context";
import { FruitPreset } from "../types/invoice";
import {
  getFruitPresets,
  saveFruitPresets,
} from "../storage/fruitPresetStorage";
import { generateId } from "../utils/id";

const createEmptyPreset = (): FruitPreset => ({
  id: generateId(),
  name: "",
  pricePerKg: 0,
});

export const SettingsScreen: React.FC = () => {
  const [presets, setPresets] = useState<FruitPreset[]>([]);
  const [saving, setSaving] = useState(false);
  const listRef = useRef<FlatList<FruitPreset> | null>(null);
  const insets = useSafeAreaInsets();

  const scrollToPresetIndex = useCallback((id: string) => {
    const index = presets.findIndex((p) => p.id === id);
    if (index === -1 || !listRef.current) return;
    setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.25,
        });
      } catch {
        listRef.current?.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [presets]);

  useEffect(() => {
    const load = async () => {
      const data = await getFruitPresets();
      if (data.length === 0) {
        setPresets([createEmptyPreset()]);
      } else {
        setPresets(data);
      }
    };
    load();
  }, []);

  const updatePresetField = useCallback(
    (id: string, field: keyof FruitPreset, value: string) => {
      setPresets((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          if (field === "pricePerKg") {
            const numeric = parseFloat(value) || 0;
            return { ...p, pricePerKg: Math.max(0, numeric * 1000) };
          }
          return { ...p, [field]: value };
        }),
      );
    },
    [],
  );

  const addPreset = useCallback(() => {
    setPresets((prev) => [...prev, createEmptyPreset()]);
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 0);
  }, []);

  const removePreset = useCallback((id: string) => {
    setPresets((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length === 0) return [createEmptyPreset()];
      return filtered;
    });
  }, []);

  const handleRemovePreset = useCallback(
    (id: string) => {
      Alert.alert(
        "Xoá loại quả",
        "Bạn có chắc chắn muốn xoá loại quả này không?",
        [
          { text: "Huỷ", style: "cancel" },
          {
            text: "Xoá",
            style: "destructive",
            onPress: () => removePreset(id),
          },
        ],
      );
    },
    [removePreset],
  );

  const handleSave = useCallback(async () => {
    const invalidIndex = presets.findIndex(
      (p) => !p.name.trim() || p.pricePerKg <= 0,
    );

    if (invalidIndex !== -1) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập tên quả và giá/kg cho tất cả loại quả trước khi lưu danh sách.",
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

    const cleaned = presets.filter((p) => p.name.trim() && p.pricePerKg > 0);
    setSaving(true);
    try {
      await saveFruitPresets(cleaned);
      setPresets(cleaned.length ? cleaned : [createEmptyPreset()]);
      Alert.alert("Đã lưu", "Đã lưu danh sách quả mặc định.");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu danh sách. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }, [presets]);

  const renderItem = ({ item }: { item: FruitPreset }) => (
    <View style={styles.itemContainer}>
      <View style={styles.row}>
        <Text style={styles.label}>Tên quả</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemovePreset(item.id)}
        >
          <Text style={styles.deleteText}>X</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.inputName}
          placeholder="Táo, Cam, Nho..."
          placeholderTextColor="#999"
          value={item.name}
          onChangeText={(text) => updatePresetField(item.id, "name", text)}
          onFocus={() => scrollToPresetIndex(item.id)}
        />
        <TextInput
          style={styles.inputPrice}
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          value={item.pricePerKg ? String(item.pricePerKg / 1000) : ""}
          onChangeText={(text) =>
            updatePresetField(item.id, "pricePerKg", text)
          }
          onFocus={() => scrollToPresetIndex(item.id)}
        />
      </View>
      <Text style={styles.hint}>
        Giá nhập đơn vị nghìn đồng (vd: 10 = 10.000đ/kg)
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.subtitle}>
          Thiết lập sẵn tên quả và giá/kg (đơn vị nghìn đồng). Khi tạo hoá đơn,
          bạn chỉ cần chọn quả và nhập số kg.
        </Text>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.listWrap}
          keyboardVerticalOffset={insets.top + 20}
        >
          <FlatList
            ref={listRef}
            data={presets}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScrollToIndexFailed={() => {
              listRef.current?.scrollToEnd({ animated: true });
            }}
          />
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.addButton} onPress={addPreset}>
            <Text style={styles.addButtonText}>+ Thêm loại quả</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Đang lưu..." : "Lưu danh sách"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  itemContainer: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: "#555",
  },
  inputRow: {
    flexDirection: "row",
    marginTop: 4,
    alignItems: "center",
  },
  inputName: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 40,
    maxHeight: 40,
  },
  inputPrice: {
    width: 88,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 40,
    maxHeight: 40,
  },
  hint: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#ff4d4f",
  },
  deleteText: {
    color: "#fff",
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  addButton: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1890ff",
    alignItems: "center",
    marginBottom: 8,
  },
  addButtonText: {
    color: "#1890ff",
    fontWeight: "600",
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#1890ff",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
