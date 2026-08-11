import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ============ STATIC COMPANY DETAILS ============
const COMPANY = {
  name: 'MUGHAL',
  subtitle: 'THERMAL PRINTER ROLL',
  tagline: 'PREMIUM QUALITY THERMAL ROLLS FOR EVERY PRINTING NEED',
  phone1: '0335-0604017',
  phone2: '0337-0495656',
  address: 'Lahore, Punjab, Pakistan',
  signature: 'Muhammad Usman',
};

export default function InvoiceScreen() {
  const { orderId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  // TODO: Replace with real order data from Firestore
  const order = {
    invoiceNo: 'INV-2025-0001',
    invoiceDate: '09 May 2025',
    dueDate: '16 May 2025',
    salesPerson: 'Muhammad Usman',
    customer: {
      name: 'ABC Store',
      address: '123 Business Street, Lahore, Punjab, Pakistan',
      phone: '0300-1234567',
    },
    items: [
      { no: '01', description: 'Thermal Printer Roll 80x80', qty: 50, unitPrice: 120, amount: 6000 },
      { no: '02', description: 'Thermal Printer Roll 57x40', qty: 100, unitPrice: 60, amount: 6000 },
      { no: '03', description: 'Thermal Printer Roll 80x60', qty: 50, unitPrice: 100, amount: 5000 },
      { no: '04', description: 'Thermal Printer Roll 57x30', qty: 100, unitPrice: 50, amount: 5000 },
    ],
    subtotal: 22000,
    discount: 1100, // 5%
    shipping: 300,
    total: 21200,
  };

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
        .features { display: flex; justify-content: space-around; margin: 30px 0; text-align: center; }
        .feature { font-size: 11px; }
        .footer { background: #0d1b4c; color: white; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; font-size: 12px; }
        .signature { margin-top: 40px; text-align: left; }
        .signature-name { font-family: 'Playfair Display', serif; font-size: 22px; color: #0d1b4c; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">
            <h1>MUGHAL</h1>
            <div class="subtitle">THERMAL PRINTER ROLL</div>
            <div class="tagline">★ PREMIUM QUALITY THERMAL ROLLS ★<br>FOR EVERY PRINTING NEED</div>
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <div class="invoice-no">${order.invoiceNo}</div>
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
            <div>📅 Invoice Date : ${order.invoiceDate}</div>
            <div>⏰ Due Date : ${order.dueDate}</div>
            <div>👤 Sales Person : ${order.salesPerson}</div>
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
          <tr><td>DISCOUNT (5%)</td><td style="text-align:right">Rs. ${order.discount.toLocaleString()}.00</td></tr>
          <tr><td>SHIPPING CHARGES</td><td style="text-align:right">Rs. ${order.shipping.toLocaleString()}.00</td></tr>
          <tr class="total-row"><td>TOTAL AMOUNT</td><td style="text-align:right">Rs. ${order.total.toLocaleString()}.00</td></tr>
        </table>

        <div style="margin:20px 0;padding:12px;background:#fff8e1;border-radius:8px;border-left:4px solid #c9a227;">
          <strong>NOTE:</strong><br>
          Thank you for your business!<br>
          We appreciate your trust in Mughal Thermal Printer Roll.
        </div>

        <div class="features">
          <div class="feature">🛡️<br>HIGH QUALITY</div>
          <div class="feature">🖨️<br>CLEAR PRINT</div>
          <div class="feature">📜<br>SMOOTH PAPER</div>
          <div class="feature">🏅<br>BEST CHOICE</div>
        </div>

        <div class="footer">
          <div>📞 CONTACT US<br>${COMPANY.phone1}<br>${COMPANY.phone2}</div>
          <div>📍 ADDRESS<br>${COMPANY.address}</div>
          <div>🌐 FOLLOW US<br>Stay connected for updates & offers</div>
        </div>

        <div class="signature">
          <div class="signature-name">${COMPANY.signature}</div>
          <div style="font-size:12px;color:#666;">Authorized Signature</div>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  const handleDownloadAndShare = async () => {
    try {
      setLoading(true);
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Invoice',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'Invoice PDF generated successfully!');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* You can also show a visual preview here using the same data */}
        <Text style={styles.title}>Invoice Preview</Text>
        <Text style={styles.invoiceNo}>{order.invoiceNo}</Text>
        <Text style={styles.customer}>{order.customer.name}</Text>
        <Text style={styles.total}>Total: Rs. {order.total.toLocaleString()}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, styles.shareBtn]}
          onPress={handleDownloadAndShare}
          disabled={loading}
        >
          {loading ? (
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
  title: { fontSize: 22, fontWeight: '700', color: '#0d1b4c' },
  invoiceNo: { fontSize: 16, color: '#c9a227', marginTop: 6 },
  customer: { fontSize: 16, marginTop: 12 },
  total: { fontSize: 18, fontWeight: '700', marginTop: 8, color: '#0d1b4c' },
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