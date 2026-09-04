import Colors, { Palette } from '@/constants/Colors';
import { deleteInvestment, loadInvestments } from '@/lib/storage';
import { Investment } from '@/lib/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const InvestmentsScreen = () => {
  const [search, setSearch] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];
  const { top } = useSafeAreaInsets();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadInvestments().then(setInvestments).finally(() => setLoading(false));
    }, [])
  );

  const totalInvestment = useMemo(() => {
    return investments.reduce(
    (total, item) => total + (item.transactionType === 'Withdrawal' ? -item.amount : item.amount),
      0,
    );
  }, [investments]);

  const filteredInvestments = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return investments;
    }

    return investments.filter((item) =>
      item.investorName.toLowerCase().includes(value),
    );
  }, [investments, search]);

  const formatCurrency = (amount: number) => {
    return `₨${amount.toLocaleString('en-PK')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleAddInvestment = () => {
    router.push('/investment/add')
  };

  const handleEdit = (investment: Investment) => {
    Alert.alert('Edit Investment', 'Investment editing is not available yet.');
  };

  const handleDelete = (investment: Investment) => {
    Alert.alert('Delete Investment', 'Delete this transaction permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setInvestments(await deleteInvestment(investment.id));
          } catch {
            Alert.alert('Error', 'Unable to delete this transaction.');
          }
        },
      },
    ]);
  };

  const renderInvestment = ({ item }: { item: Investment }) => {
    return (
      <View
        style={[
          styles.investmentCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.cardHeader]}>
          <View style={styles.userSection}>
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
                {item.investorName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View>
              <Text
                style={[
                  styles.investorName,
                  {
                    color: theme.text,
                  },
                ]}
              >
                {item.investorName}
              </Text>

              <Text
                style={[
                  styles.investorId,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                ID: {item.investorId}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === 'Active'
                    ? `${Palette.success}18`
                    : `${Palette.warning}18`,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    item.transactionType === 'Investment'
                      ? Palette.success
                      : Palette.warning,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item.transactionType === 'Investment'
                      ? Palette.success
                      : Palette.danger,
                },
              ]}
            >
              {item.transactionType}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <View
          style={[
            styles.amountContainer,
            {
              backgroundColor: theme.background,
            },
          ]}
        >
          <View>
            <Text
              style={[
                styles.smallLabel,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Investment Amount
            </Text>

            <Text
              style={[
                styles.amount,
                {
                  color: theme.text,
                },
              ]}
            >
              {formatCurrency(item.amount)}
            </Text>
          </View>

          <MaterialCommunityIcons
            name="cash-multiple"
            size={28}
            color={Palette.success}
          />
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={theme.textSecondary}
            />

            <Text
              style={[
                styles.detailLabel,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Investment Date
            </Text>

            <Text
              style={[
                styles.detailValue,
                {
                  color: theme.text,
                },
              ]}
            >
              {formatDate(item.investmentDate)}
            </Text>
          </View>

          {item.notes ? (
            <View style={styles.detailRow}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={theme.textSecondary}
              />

              <Text
                style={[
                  styles.detailLabel,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                Notes
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.detailValue,
                  styles.notesValue,
                  {
                    color: theme.text,
                  },
                ]}
              >
                {item.notes}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <View
          style={[
            styles.actions,
            {
              borderTopColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="create-outline" size={18} color={theme.tint} />

            <Text
              style={[
                styles.actionText,
                {
                  color: theme.tint,
                },
              ]}
            >
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={Palette.danger}
            />

            <Text
              style={[
                styles.actionText,
                {
                  color: Palette.danger,
                },
              ]}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          marginTop: top
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text
            style={[
              styles.title,
              {
                color: theme.text,
              },
            ]}
          >
            Investments
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            Manage business investments
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: theme.tint,
            },
          ]}
          onPress={handleAddInvestment}
        >
          <Ionicons name="add" size={24} color={Palette.white} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.summaryIcon,
            {
              backgroundColor: `${Palette.success}18`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="cash-multiple"
            size={26}
            color={Palette.success}
          />
        </View>

        <View style={styles.summaryContent}>
          <Text
            style={[
              styles.summaryLabel,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            Total Investment
          </Text>

          <Text
            style={[
              styles.summaryAmount,
              {
                color: theme.text,
              },
            ]}
          >
            {formatCurrency(totalInvestment)}
          </Text>

          <Text
            style={[
              styles.summaryCount,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            {investments.length}{' '}
            {investments.length === 1 ? 'investment' : 'investments'}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.textSecondary}
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search investor..."
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.searchInput,
            {
              color: theme.text,
            },
          ]}
        />

        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Section */}
      <View style={styles.listHeader}>
        <Text
          style={[
            styles.listTitle,
            {
              color: theme.text,
            },
          ]}
        >
          Investment History
        </Text>

        <Text
          style={[
            styles.listCount,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          {filteredInvestments.length}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={filteredInvestments}
        keyExtractor={(item) => item.id}
        renderItem={renderInvestment}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={theme.tint} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Loading investments...</Text>
          </View> : <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="cash-remove"
              size={54}
              color={theme.textSecondary}
            />

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              No investments found
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Add your first business investment.
            </Text>

            <TouchableOpacity
              style={[
                styles.emptyButton,
                {
                  backgroundColor: theme.tint,
                },
              ]}
              onPress={handleAddInvestment}
            >
              <Ionicons name="add" size={20} color={Palette.white} />

              <Text style={styles.emptyButtonText}>Add Investment</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

export default InvestmentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },

  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryContent: {
    marginLeft: 14,
    flex: 1,
  },

  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },

  summaryAmount: {
    fontSize: 25,
    fontWeight: '800',
    marginTop: 2,
  },

  summaryCount: {
    fontSize: 12,
    marginTop: 2,
  },

  searchContainer: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },

  listTitle: {
    fontSize: 17,
    fontWeight: '700',
  },

  listCount: {
    marginLeft: 8,
    fontSize: 13,
  },

  listContent: {
    paddingBottom: 30,
  },

  investmentCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },

  investorName: {
    fontSize: 16,
    fontWeight: '700',
  },

  investorId: {
    fontSize: 11,
    marginTop: 2,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  amountContainer: {
    marginTop: 14,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  smallLabel: {
    fontSize: 11,
  },

  amount: {
    fontSize: 21,
    fontWeight: '800',
    marginTop: 2,
  },

  detailsContainer: {
    marginTop: 12,
    gap: 10,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailLabel: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },

  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '55%',
  },

  notesValue: {
    textAlign: 'right',
  },

  actions: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 5,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
  },

  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 5,
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 18,
  },

  emptyButtonText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
});