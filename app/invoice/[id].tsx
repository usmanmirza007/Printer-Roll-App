import { loadSingleCustomer } from '@/lib/storage';
import { Customer } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============ STATIC COMPANY DETAILS ============
const COMPANY = {
  name: 'ThermalAxis',
  subtitle: 'THERMAL PRINTER ROLL',
  tagline: 'PREMIUM QUALITY THERMAL ROLLS FOR EVERY PRINTING NEED',
  phone1: '0335-0604017',
  phone2: '0337-0495656',
  address1: 'Lahore, Punjab, Pakistan',
  address2: 'Gujranwala, Punjab, Pakistan',
};

const BANK_ACCOUNTS = [
  {
    id: 'usman',
    owner: 'Muhammad Usman',
    bankName: 'HBL',
    accountTitle: 'Muhammad Usman',
    accountNo: '1234567890123',
    iban: 'PK00HABB000000000000000',
  },
  {
    id: 'bilal',
    owner: 'Muhammad Bilal',
    bankName: 'Meezan Bank',
    accountTitle: 'Muhammad Bilal Mirza',
    accountNo: '9876543210987',
    iban: 'PK00MEZN000000000000000',
  },
] as const;

type OrderItem = {
  no: string;
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
};

type CustomerDetails = {
  name: string;
  address: string;
  phone: string;
};

type Order = {
  invoiceNo: string;
  invoiceDate: string;
  salesUsman: string;
  salesBilal: string;
  customer: CustomerDetails;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
};

export default function InvoiceScreen() {
  const { id: customerId = '' } = useLocalSearchParams<{ id?: string }>();

  const [loading, setLoading] = useState(true); // start true so first render shows loader
  const [sharing, setSharing] = useState(false); // separate state for PDF share button
  const [customers, setCustomers] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [subTotal, setSubTotal] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [includeBankDetails, setIncludeBankDetails] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<(typeof BANK_ACCOUNTS)[number]['id']>('usman');
  const { top } = useSafeAreaInsets();

  const fetchDetail = async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const customer = await loadSingleCustomer(customerId);

      setCustomers(customer);

      const filteredOrder = customer?.orderHistory?.filter(
        (order) => order.status === 'Invoiced'
      );

      if (filteredOrder && filteredOrder.length) {
        setOrders(
          filteredOrder.map((order, index) => ({
            no: (index + 1).toString().padStart(2, '0'),
            description: `Thermal Printer Roll ${order.rollType}`,
            qty: order.quantity,
            unitPrice: order.unitSaleRate,
            amount: order.totalSale,
          }))
        );

        let calculatedSubTotal = 0;
        let calculatedDiscount = 0;

        for (const order of filteredOrder) {
          calculatedSubTotal += order.totalSale;
          const discountPerUnit =
            order.unitSaleRate - (order.unitCostRate || 200);
          calculatedDiscount += discountPerUnit * order.quantity;
        }

        const calculatedShipping = 0;
        const calculatedTotal = calculatedSubTotal + calculatedShipping;

        setSubTotal(calculatedSubTotal);
        setDiscount(0);
        setShipping(calculatedShipping);
        setTotal(calculatedTotal);
      } else {
        // no invoiced orders – reset values
        setOrders([]);
        setSubTotal(0);
        setDiscount(0);
        setShipping(0);
        setTotal(0);
      }
    } catch (error) {
      console.log('Failed to load customer:', error);
      Alert.alert('Error', 'Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [customerId]);

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const order: Order = {
    invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 10000
    )
      .toString()
      .padStart(4, '0')}`,
    invoiceDate: today,
    salesUsman: 'Muhammad Usman',
    salesBilal: 'Muhammad Bilal',
    customer: {
      name: customers?.shopName || 'ABC Store',
      address: customers?.location || '123 Business Street, Lahore, Punjab, Pakistan',
      phone: customers?.phone || '0300-1234567',
    },
    items: orders,
    subtotal: subTotal,
    discount: discount,
    shipping: shipping,
    total: total,
  };

  const selectedBank = BANK_ACCOUNTS.find((account) => account.id === selectedBankId);

  const generateHTML = () => {
    const itemsRows = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding:10px;border:1px solid #1a237e;text-align:center;">${item.no}</td>
        <td style="padding:10px;border:1px solid #1a237e;">${item.description}</td>
        <td style="padding:10px;border:1px solid #1a237e;text-align:center;">${item.qty}</td>
        <td style="padding:10px;border:1px solid #1a237e;text-align:right;">Rs. ${item.unitPrice.toFixed(2)}</td>
        <td style="padding:10px;border:1px solid #1a237e;text-align:right;">Rs. ${item.amount.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Poppins:wght@400;600;700&display=swap');
        body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0; background: #fff; color: #1a237e; }
        .container { padding: 30px; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
        .brand h1 { font-family: 'Playfair Display', serif; font-size: 42px; margin: 0; color: #0d1b4c; letter-spacing: 2px; }
        .brand .subtitle { color: #c9a227; font-size: 14px; font-weight: 600; letter-spacing: 1px; }
        .brand .tagline { font-size: 11px; color: #666; margin-top: 8px; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 36px; margin: 0; color: #0d1b4c; }
        .invoice-no { background: #c9a227; color: #fff; padding: 6px 16px; border-radius: 20px; font-weight: 600; display: inline-block; margin-top: 8px; }
        .info-row { display: flex; justify-content: space-between; margin: 25px 0; }
        .customer-box { background: #f8f9fc; padding: 15px; border-radius: 10px; border-left: 4px solid #c9a227; }
        .meta-box { text-align: right; font-size: 13px; line-height: 1.8; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #0d1b4c; color: white; padding: 12px; font-size: 13px; }
        .totals { margin-left: auto; width: 280px; }
        .totals td { padding: 8px 12px; }
        .total-row { background: #0d1b4c; color: white; font-weight: 700; }
        .footer { background: #0d1b4c; color: white; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">
            <h1>ThermalAxis</h1>
            <div class="subtitle">THERMAL PRINTER ROLL</div>
            <div class="tagline">★ PREMIUM QUALITY THERMAL ROLLS ★<br>FOR EVERY PRINTING NEED</div>
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <div class="invoice-no">${order.invoiceNo}</div>
            <div style="margin-top:5px">📅 Invoice Date : ${order.invoiceDate}</div>
          </div>
        </div>

        <div class="info-row">
          <div class="customer-box">
            <strong>BILL TO</strong><br>
            <strong>${order.customer.name}</strong><br>
            ${order.customer.address}<br>
            Phone: ${order.customer.phone}
          </div>
          <div class="meta-box">
            ${includeBankDetails && selectedBank ? `
            <div style="margin-top:0px;text-align:left;background:#f8f9fc;padding:12px;border-radius:8px;border-left:4px solid #c9a227;line-height:1.7;">
              <strong>BANK DETAILS</strong><br>
              Account Owner: ${selectedBank.owner}<br>
              Bank Name: ${selectedBank.bankName}<br>
              Account Title: ${selectedBank.accountTitle}<br>
              Account No: ${selectedBank.accountNo}<br>
              IBAN No: ${selectedBank.iban}
            </div>
            ` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ITEM NO.</th>
              <th>DESCRIPTION</th>
              <th>QTY</th>
              <th>UNIT PRICE</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <table class="totals">
          <tr><td>SUBTOTAL</td><td style="text-align:right">Rs. ${order.subtotal.toLocaleString()}.00</td></tr>
          <tr><td>DISCOUNT</td><td style="text-align:right">Rs. ${order.discount.toLocaleString()}.00</td></tr>
          <tr><td>SHIPPING</td><td style="text-align:right">Rs. ${order.shipping.toLocaleString()}.00</td></tr>
          <tr class="total-row"><td>TOTAL</td><td style="text-align:right">Rs. ${order.total.toLocaleString()}.00</td></tr>
        </table>

        <div style="margin:20px 0;padding:12px;background:#fff8e1;border-radius:8px;border-left:4px solid #c9a227;">
          <strong>NOTE:</strong><br>
          Thank you for your business!<br>
          We appreciate your trust in ThermalAxis Thermal Printer Roll.
        </div>

        <div class="footer">
          <div>📞 CONTACT US<br>${COMPANY.phone1}<br>${COMPANY.phone2}</div>
          <div>👤 Owner<br>${order.salesUsman}<br>${order.salesBilal}</div>
          <div>📍 ADDRESS<br>${COMPANY.address1}<br>${COMPANY.address2}</div>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  const handleDownloadAndShare = async () => {
    if (includeBankDetails && !selectedBank) {
      Alert.alert('Select bank account', 'Choose the bank account to show on the invoice.');
      return;
    }

    try {
      setSharing(true);

      const html = generateHTML();

      // 1. Generate PDF
      const { base64 } = await Print.printToFileAsync({
        html,
        base64: true,
      });

      if (!base64) {
        throw new Error('PDF data was not generated');
      }

      // Write a fresh cache file so expo-sharing can grant external read access.
      const pdfFile = new File(Paths.cache, `Invoice_${Date.now()}.pdf`);
      pdfFile.write(base64, { encoding: 'base64' });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Invoice',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'Invoice PDF generated successfully!');
      }
    } catch (error) {
      console.log('Share Error →', error);
      Alert.alert('Error', 'Failed to generate or share invoice');
    } finally {
      setSharing(false);
    }
  };

  // ---------- LOADING UI ----------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d1b4c" />
        <Text style={styles.loadingText}>Loading invoice...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ marginTop: top, padding: 16 }}>
        <Text style={styles.title}>Invoice Preview</Text>
        <Text style={styles.invoiceNo}>{order.invoiceNo}</Text>
        <Text style={styles.customer}>{order.customer.name}</Text>
        <Text style={styles.total}>
          Total: Rs. {order.total.toLocaleString()}
        </Text>

        <View style={styles.bankOptions}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: includeBankDetails }}
            style={styles.optionRow}
            onPress={() => setIncludeBankDetails((current) => !current)}
          >
            <View style={[styles.checkbox, includeBankDetails && styles.checkboxSelected]}>
              {includeBankDetails && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View>
              <Text style={styles.optionTitle}>Share bank details on invoice</Text>
              <Text style={styles.optionHint}>For customers paying by online transfer</Text>
            </View>
          </Pressable>

          {includeBankDetails && (
            <View style={styles.accountList}>
              <Text style={styles.accountLabel}>Select account owner</Text>
              {BANK_ACCOUNTS.map((account) => (
                <Pressable
                  key={account.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedBankId === account.id }}
                  style={styles.optionRow}
                  onPress={() => setSelectedBankId(account.id)}
                >
                  <View style={styles.radioOuter}>
                    {selectedBankId === account.id && <View style={styles.radioInner} />}
                  </View>
                  <View>
                    <Text style={styles.optionTitle}>{account.owner}</Text>
                    <Text style={styles.optionHint}>{account.bankName} | A/C {account.accountNo}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {includeBankDetails && selectedBank && (
            <Text style={styles.previewNote}>
              {selectedBank.owner}'s bank details will appear in the PDF.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, styles.shareBtn]}
          onPress={handleDownloadAndShare}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-whatsapp" size={22} color="#fff" />
              <Text style={styles.btnText}>Download & Share on WhatsApp</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#0d1b4c',
    fontWeight: '600',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#0d1b4c' },
  invoiceNo: { fontSize: 16, color: '#c9a227', marginTop: 6 },
  customer: { fontSize: 16, marginTop: 12 },
  total: { fontSize: 18, fontWeight: '700', marginTop: 8, color: '#0d1b4c' },
  bankOptions: {
    marginTop: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e4e7ef',
    borderRadius: 12,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  optionTitle: { fontSize: 15, fontWeight: '600', color: '#0d1b4c' },
  optionHint: { color: '#687083', fontSize: 12, marginTop: 3 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#aab1c2',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#0d1b4c', borderColor: '#0d1b4c' },
  accountList: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#eef0f5', paddingTop: 8 },
  accountLabel: { color: '#687083', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  radioOuter: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#0d1b4c',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0d1b4c' },
  previewNote: { color: '#0d1b4c', fontSize: 12, marginTop: 8 },
  footer: { padding: 16, borderTopWidth: 1, borderColor: '#eee' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  shareBtn: { backgroundColor: '#25D366' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});