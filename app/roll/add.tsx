import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
import { loadRolls, saveRoll } from '@/lib/storage';
import { ThermalRoll } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ROLL_TITLE_OPTIONS = [
  '40 Meter Thermal Roll',
  '50 Meter Thermal Roll',
  '60 Meter Thermal Roll',
  '80 Meter Thermal Roll',
  '38 * 28 BarCode Stickers',
];

const BARCODE_COLUMNS: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

export default function AddOrEditRollScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
  const { top } = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [meterLength, setMeterLength] = useState('40');
  const [paperWidth, setPaperWidth] = useState('80mm Standard POS');
  const [stickerWidth, setStickerWidth] = useState('38');
  const [stickerHeight, setStickerHeight] = useState('28');
  const [stickerCount, setStickerCount] = useState('1000');
  const [barcodeColumns, setBarcodeColumns] = useState<1 | 2 | 3 | 4>(1);
  const [showTitleOptions, setShowTitleOptions] = useState(false);
  const [purchaseRate, setPurchaseRate] = useState('120');
  const [wholesaleRate, setWholesaleRate] = useState('140');
  const [stockCount, setStockCount] = useState('50');
  const [minStockAlert, setMinStockAlert] = useState('10');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      
      loadRolls().then((rolls) => {
        const found = rolls.find((r) => r.id === id);
        
        if (found) {
          console.log('found.title', found.title);
          setTitle(found.title);
          setMeterLength(String(found.meterLength));
          setPaperWidth(found.paperWidth);
          setStickerWidth(String(found.stickerWidth || 38));
          setStickerHeight(String(found.stickerHeight || 28));
          setStickerCount(String(found.stickerCount || 1000));
          setBarcodeColumns(found.barcodeColumns || 1);
          setPurchaseRate(String(found.purchaseRate));
          setWholesaleRate(String(found.wholesaleRate));
          setStockCount(String(found.stockCount));
          setMinStockAlert(String(found.minStockAlert));
          setDescription(found.description || '');
        }
      });
    }
  }, [id]);

  const pRate = parseFloat(purchaseRate) || 0;
  const wRate = parseFloat(wholesaleRate) || 0;
  const margin = wRate - pRate;
  const isBarcode = title.toLowerCase().includes('barcode') || title.toLowerCase().includes('sticker');

  const handleTitleSelect = (selectedTitle: string) => {
    setTitle(selectedTitle);
    setShowTitleOptions(false);
    if (selectedTitle.toLowerCase().includes('barcode') || selectedTitle.toLowerCase().includes('sticker')) {
      setPaperWidth('38mm x 28mm');
      setStickerWidth('38');
      setStickerHeight('28');
      setStickerCount('4000');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter thermal roll title.');
      return;
    }

    setLoading(true);

    try {
      const rollData: ThermalRoll = {
        id: isEditMode && id ? id : `roll-${Date.now()}`,
        title: title.trim(),
        productType: isBarcode ? 'barcode' : 'thermal',
        meterLength: isBarcode ? 0 : parseInt(meterLength, 10) || 40,
        paperWidth: isBarcode ? `${parseInt(stickerWidth, 10) || 38}mm x ${parseInt(stickerHeight, 10) || 28}mm` : paperWidth.trim() || '80mm POS',
        stickerWidth: isBarcode ? parseInt(stickerWidth, 10) || 38 : undefined,
        stickerHeight: isBarcode ? parseInt(stickerHeight, 10) || 28 : undefined,
        stickerCount: isBarcode ? parseInt(stickerCount, 10) || 0 : undefined,
        barcodeColumns: isBarcode ? barcodeColumns : undefined,
        purchaseRate: pRate,
        wholesaleRate: wRate,
        stockCount: parseInt(stockCount, 10) || 0,
        minStockAlert: parseInt(minStockAlert, 10) || 10,
        description: description.trim(),
      };

      await saveRoll(rollData);
      setLoading(false);
      router.back()
      // Alert.alert('Success', `Thermal Roll "${title}" saved successfully!`, [
      //   { text: 'OK', onPress: () => router.back() },
      // ]);
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save roll details.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, {marginTop: top, backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isEditMode ? 'Edit Thermal Roll' : 'Add Roll Category'}
          </Text>
        </View>

        {/* Card Form */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.tint }]}>Roll Specification</Text>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Roll Title *</Text>
          <TouchableOpacity
            style={[styles.dropdown, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={() => setShowTitleOptions((visible) => !visible)}
          >
            <Text style={{ color: title ? theme.text : theme.textSecondary, flex: 1 }}>
              {title || 'Select roll or sticker type'}
            </Text>
            <Ionicons name={showTitleOptions ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {showTitleOptions && (
            <View style={[styles.dropdownOptions, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              {ROLL_TITLE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.dropdownOption, { borderBottomColor: theme.border }]}
                  onPress={() => handleTitleSelect(option)}
                >
                  <Text style={{ color: theme.text }}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!isBarcode ? <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Meter Length *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="40"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={meterLength}
                onChangeText={setMeterLength}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Paper Width *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="80mm Standard POS"
                placeholderTextColor={theme.textSecondary}
                value={paperWidth}
                onChangeText={setPaperWidth}
              />
            </View>
          </View> : (
            <>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Sticker Width (mm) *</Text>
                  <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]} keyboardType="numeric" value={stickerWidth} onChangeText={setStickerWidth} />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Sticker Height (mm) *</Text>
                  <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]} keyboardType="numeric" value={stickerHeight} onChangeText={setStickerHeight} />
                </View>
              </View>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Stickers Per Roll *</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]} keyboardType="numeric" value={stickerCount} onChangeText={setStickerCount} />
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Barcode Columns *</Text>
              <View style={styles.columnOptions}>
                {BARCODE_COLUMNS.map((columns) => (
                  <TouchableOpacity key={columns} style={styles.columnOption} onPress={() => setBarcodeColumns(columns)}>
                    <Ionicons name={barcodeColumns === columns ? 'checkbox' : 'square-outline'} size={22} color={barcodeColumns === columns ? theme.tint : theme.textSecondary} />
                    <Text style={{ color: theme.text, marginLeft: 6 }}>{columns === 1 ? 'Single' : columns === 2 ? 'Double' : columns === 3 ? 'Triple' : '4 columns'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.sectionHeader, { color: theme.tint, marginTop: 16 }]}>Rates & Inventory Stock</Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Purchase Rate (Cost) *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="120"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={purchaseRate}
                onChangeText={setPurchaseRate}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Wholesale Rate *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="140"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={wholesaleRate}
                onChangeText={setWholesaleRate}
              />
            </View>
          </View>

          {/* Wholesale Profit Preview */}
          <View style={[styles.profitBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.profitText, { color: margin >= 0 ? Palette.success : Palette.danger }]}>
              Standard Wholesale Profit: <Text style={{ fontWeight: '700' }}>₨{margin}</Text> per roll
            </Text>
          </View>

          <View style={[styles.row, { marginTop: 8 }]}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Available Stock Count *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="50"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={stockCount}
                onChangeText={setStockCount}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Low Stock Alert Threshold</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="10"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={minStockAlert}
                onChangeText={setMinStockAlert}
              />
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Description / Specifications</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
            ]}
            placeholder="Paper weight, print quality notes..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.tint }, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>
            {loading ? 'Saving...' : isEditMode ? 'Update Thermal Roll' : 'Save Roll Category'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  card: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  sectionHeader: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  input: { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
  dropdown: { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  dropdownOptions: { borderWidth: 1, borderRadius: 8, marginTop: 4, overflow: 'hidden' },
  dropdownOption: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  columnOptions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  columnOption: { flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 8 },
  textArea: { height: 70, textAlignVertical: 'top', paddingTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  profitBanner: { padding: 10, borderRadius: 8, marginTop: 10, borderWidth: 1 },
  profitText: { fontSize: 13 },
  saveBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
