import Colors, { Palette } from '@/constants/Colors';
import { saveInvestment } from '@/lib/storage';
import { Investment } from '@/lib/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Investor = {
  id: string;
  name: string;
};


const AddInvestmentScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];
  const { top } = useSafeAreaInsets();

  const [investor, setInvestor] = useState<Investor | null>(null);

  const [amount, setAmount] = useState('');

  const [transactionType, setTransactionType] = useState<
    'Investment' | 'Withdrawal'
  >('Investment');

  const [investmentDate, setInvestmentDate] = useState(
    new Date(),
  );

  const [status, setStatus] = useState<
    'Active' | 'Completed' | 'Pending'
  >('Active');

  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);

  /**
   * Replace this with your Firestore investors collection.
   */
  const investors: Investor[] = [
    {
      id: 'investor-usman',
      name: 'Usman',
    },
    {
      id: 'investor-bilal',
      name: 'Bilal',
    },
  ];

  const formatCurrency = (value: string) => {
    const numericValue = Number(value.replace(/,/g, ''));

    if (!numericValue) {
      return '';
    }

    return numericValue.toLocaleString('en-PK');
  };

  const handleAmountChange = (value: string) => {
    // Only numbers
    const numericValue = value.replace(/[^0-9]/g, '');

    setAmount(numericValue);
  };

  const handleSave = async () => {
    if (!investor) {
      Alert.alert(
        'Required',
        'Please select an investor.',
      );
      return;
    }

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid investment amount.',
      );
      return;
    }

    try {
      setLoading(true);

      const now = new Date().toISOString();
      const investment: Investment = {
        id: `investment-${Date.now()}`,
        investorId: investor.id,
        investorName: investor.name,
        amount: numericAmount,
        investmentDate: investmentDate.toISOString(),
        transactionType,
        status,
        notes: notes.trim(),
        createdAt: now,
        updatedAt: now,
      };

      await saveInvestment(investment);

      Alert.alert(
        'Success',
        `${transactionType} successfully added.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Unable to save investment. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}

      <View style={[styles.header, {marginTop: top}]}>
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.text}
          />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text
            style={[
              styles.title,
              {
                color: theme.text,
              },
            ]}
          >
            Add Investment
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            Add a new business transaction
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* Transaction Type */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.text,
            },
          ]}
        >
          Transaction Type
        </Text>

        <View style={styles.typeContainer}>
          {/* Investment */}

          <TouchableOpacity
            style={[
              styles.typeCard,
              {
                backgroundColor: theme.card,
                borderColor:
                  transactionType === 'Investment'
                    ? Palette.success
                    : theme.border,
              },
            ]}
            onPress={() =>
              setTransactionType('Investment')
            }
          >
            <View
              style={[
                styles.typeIcon,
                {
                  backgroundColor: `${Palette.success}18`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="cash-plus"
                size={23}
                color={Palette.success}
              />
            </View>

            <Text
              style={[
                styles.typeText,
                {
                  color: theme.text,
                },
              ]}
            >
              Investment
            </Text>

            {transactionType === 'Investment' && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Palette.success}
                style={styles.checkIcon}
              />
            )}
          </TouchableOpacity>

          {/* Withdrawal */}

          <TouchableOpacity
            style={[
              styles.typeCard,
              {
                backgroundColor: theme.card,
                borderColor:
                  transactionType === 'Withdrawal'
                    ? Palette.danger
                    : theme.border,
              },
            ]}
            onPress={() =>
              setTransactionType('Withdrawal')
            }
          >
            <View
              style={[
                styles.typeIcon,
                {
                  backgroundColor: `${Palette.danger}18`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="cash-minus"
                size={23}
                color={Palette.danger}
              />
            </View>

            <Text
              style={[
                styles.typeText,
                {
                  color: theme.text,
                },
              ]}
            >
              Withdrawal
            </Text>

            {transactionType === 'Withdrawal' && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Palette.danger}
                style={styles.checkIcon}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Investor */}

        <Text
          style={[
            styles.label,
            {
              color: theme.text,
            },
          ]}
        >
          Investor
        </Text>

        <View style={styles.investorList}>
          {investors.map(item => {
            const selected =
              investor?.id === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.investorCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: selected
                      ? theme.tint
                      : theme.border,
                  },
                ]}
                onPress={() => setInvestor(item)}
              >
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: `${theme.tint}18`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      {
                        color: theme.tint,
                      },
                    ]}
                  >
                    {item.name
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.investorName,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {item.name}
                </Text>

                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={theme.tint}
                    style={styles.selectedIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Amount */}

        <Text
          style={[
            styles.label,
            {
              color: theme.text,
            },
          ]}
        >
          Amount
        </Text>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.currency,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            ₨
          </Text>

          <TextInput
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="0"
            placeholderTextColor={
              theme.textSecondary
            }
            keyboardType="number-pad"
            style={[
              styles.amountInput,
              {
                color: theme.text,
              },
            ]}
          />
        </View>

        {amount ? (
          <Text
            style={[
              styles.amountPreview,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            ₨{formatCurrency(amount)}
          </Text>
        ) : null}

        {/* Date */}

        <Text
          style={[
            styles.label,
            {
              color: theme.text,
            },
          ]}
        >
          Investment Date
        </Text>

        <TouchableOpacity
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
          onPress={() => {
            /**
             * Open DateTimePicker here.
             *
             * Example library:
             * @react-native-community/datetimepicker
             */
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={theme.textSecondary}
          />

          <Text
            style={[
              styles.inputText,
              {
                color: theme.text,
              },
            ]}
          >
            {investmentDate.toLocaleDateString(
              'en-PK',
              {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              },
            )}
          </Text>

          <Ionicons
            name="chevron-down"
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        {/* Status */}

        <Text
          style={[
            styles.label,
            {
              color: theme.text,
            },
          ]}
        >
          Status
        </Text>

        <View style={styles.statusContainer}>
          {(
            ['Active', 'Completed', 'Pending'] as const
          ).map(item => {
            const selected = status === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.statusButton,
                  {
                    backgroundColor: selected
                      ? `${theme.tint}15`
                      : theme.card,
                    borderColor: selected
                      ? theme.tint
                      : theme.border,
                  },
                ]}
                onPress={() => setStatus(item)}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    {
                      color: selected
                        ? theme.tint
                        : theme.textSecondary,
                    },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}

        <Text
          style={[
            styles.label,
            {
              color: theme.text,
            },
          ]}
        >
          Notes
          <Text
            style={{
              color: theme.textSecondary,
              fontWeight: '400',
            }}
          >
            {' '}
            (Optional)
          </Text>
        </Text>

        <View
          style={[
            styles.notesContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a note..."
            placeholderTextColor={
              theme.textSecondary
            }
            multiline
            textAlignVertical="top"
            style={[
              styles.notesInput,
              {
                color: theme.text,
              },
            ]}
          />
        </View>

        {/* Save Button */}

        <TouchableOpacity
          disabled={loading}
          style={[
            styles.saveButton,
            {
              backgroundColor: theme.tint,
              opacity: loading ? 0.6 : 1,
            },
          ]}
          onPress={handleSave}
        >
          {loading ? (
            <Text style={styles.saveText}>
              Saving...
            </Text>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color={Palette.white}
              />

              <Text style={styles.saveText}>
                Save {transactionType}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bottom spacing */}

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddInvestmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    marginLeft: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },

  typeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  typeCard: {
    flex: 1,
    minHeight: 90,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    justifyContent: 'center',
  },

  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  typeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  checkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },

  investorList: {
    gap: 8,
    marginBottom: 16,
  },

  investorCard: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },

  investorName: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
  },

  selectedIcon: {
    marginLeft: 'auto',
  },

  inputContainer: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  currency: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },

  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },

  amountPreview: {
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },

  inputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },

  statusContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },

  statusButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },

  notesContainer: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
  },

  notesInput: {
    flex: 1,
    padding: 13,
    fontSize: 14,
    minHeight: 110,
  },

  saveButton: {
    minHeight: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  saveText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: '800',
  },
});