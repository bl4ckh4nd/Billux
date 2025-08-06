// Import pdf-lib for embedding XML into PDF
import { PDFDocument } from 'pdf-lib';
import { generateZugferdXml } from './zugferdGeneration';
import { Document, Page, Text, View, StyleSheet, Image, renderToStream } from '@react-pdf/renderer';
import type { Invoice } from '../types/invoice';
import type { CompanySettings } from '../types/settings';
import type { SupportedLanguage } from '../types/i18n';
import { getPdfTranslation, getInvoiceTypeTranslation, formatPdfCurrency, formatPdfDate } from '../utils/pdfTranslations';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  companyLogo: {
    width: 150,
    height: 'auto',
  },
  companyDetails: {
    textAlign: 'right',
  },
  addressSection: {
    marginBottom: 40,
  },
  invoiceDetails: {
    marginBottom: 20,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: 1,
    paddingBottom: 5,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  col1: { width: '40%' },
  col2: { width: '15%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  col5: { width: '15%' },
  totals: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
  },
  smallText: { fontSize: 8 },
  mediumText: { fontSize: 10 },
  largeText: { fontSize: 12 },
  bold: { fontWeight: 700 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  previous: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  paymentInfo: {
    marginTop: 30,
    borderTop: 1,
    paddingTop: 10,
  },
});

interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  taxRate: number;
}

// Remove the old hardcoded German formatters - now using i18n utils

const calculateTotals = (items: InvoiceItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxGroups = items.reduce((groups: { [key: number]: number }, item) => {
    const tax = (item.total * item.taxRate) / 100;
    groups[item.taxRate] = (groups[item.taxRate] || 0) + tax;
    return groups;
  }, {});
  const totalTax = Object.values(taxGroups).reduce((sum, tax) => sum + tax, 0);
  return { subtotal, taxGroups, totalTax, total: subtotal + totalTax };
};

// Helper to convert a NodeJS Readable stream into a Buffer
const streamToBuffer = async (stream: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};

// Embed ZuGFERD XML into PDF
const embedZugferdXml = async (pdfStream: any, xmlData: string): Promise<Uint8Array> => {
  // Convert PDF stream to a Buffer
  const pdfBuffer = await streamToBuffer(pdfStream);
  
  // Load the PDF document
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  
  // Convert XML string to Buffer
  const xmlBuffer = Buffer.from(xmlData, 'utf8');
  
  // Attach the XML file with required ZuGFERD filename and metadata
  pdfDoc.attach(xmlBuffer, 'factur-x.xml', {
    mimeType: 'application/xml',
    description: 'ZUGFeRD/Factur-X invoice XML',
    creationDate: new Date(),
    modificationDate: new Date(),
  });

  // Set PDF/A-3 metadata (simplified approach)
  pdfDoc.setTitle(`Invoice ${invoice.number}`);
  pdfDoc.setAuthor(settings.name);
  pdfDoc.setSubject('Invoice');
  pdfDoc.setKeywords(['invoice', 'zugferd', 'factur-x']);
  pdfDoc.setProducer('Billux');
  pdfDoc.setCreator('Billux PDF Service');
  
  // Save the modified PDF
  return await pdfDoc.save();
};

export const generateInvoicePdf = async (
  invoice: Invoice, 
  settings: CompanySettings, 
  language: SupportedLanguage = 'de',
  includeZugferd = true
) => {
  // Mock items if they don't exist in invoice
  const invoiceItems: InvoiceItem[] = invoice.items || [
    {
      description: getPdfTranslation('defaultItem', language),
      quantity: 1,
      unit: getPdfTranslation('unit', language),
      unitPrice: invoice.amount,
      total: invoice.amount,
      taxRate: 19
    }
  ];
  
  // Calculate totals
  const { subtotal, taxGroups, total } = calculateTotals(invoiceItems);
  
  const InvoiceDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {settings.logo && (
            <Image source={settings.logo} style={styles.companyLogo} />
          )}
          <View style={styles.companyDetails}>
            <Text style={styles.mediumText}>{settings.name}</Text>
            <Text style={styles.smallText}>{settings.address}</Text>
            <Text style={styles.smallText}>{getPdfTranslation('vatIdLabel', language)} {settings.vatId}</Text>
            <Text style={styles.smallText}>{getPdfTranslation('taxIdLabel', language)} {settings.taxId}</Text>
          </View>
        </View>

        {/* Customer Address */}
        <View style={styles.addressSection}>
          <Text style={styles.smallText}>{settings.name} • {settings.address}</Text>
          <Text style={[styles.mediumText, styles.bold, { marginTop: 10 }]}>
            {invoice.customer}
          </Text>
          {invoice.customerData?.address.split('\n').map((line, i) => (
            <Text key={i} style={styles.mediumText}>{line}</Text>
          ))}
        </View>

        {/* Invoice Details */}
        <View style={styles.invoiceDetails}>
          <Text style={[styles.largeText, styles.bold]}>
            {getInvoiceTypeTranslation(invoice.type || 'Standard', language)}
          </Text>
          <View style={styles.row}>
            <Text style={styles.mediumText}>{getPdfTranslation('invoiceNumber', language)}</Text>
            <Text style={[styles.mediumText, styles.bold, { marginLeft: 10 }]}>
              {invoice.number}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.mediumText}>{getPdfTranslation('date', language)}</Text>
            <Text style={[styles.mediumText, { marginLeft: 10 }]}>
              {formatPdfDate(invoice.date, language)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.mediumText}>{getPdfTranslation('dueDate', language)}</Text>
            <Text style={[styles.mediumText, { marginLeft: 10 }]}>
              {formatPdfDate(invoice.dueDate, language)}
            </Text>
          </View>
        </View>

        {/* Previous Invoices for Final Invoice */}
        {invoice.type === 'Schlussrechnung' && invoice.previousInvoices && (
          <View style={styles.previous}>
            <Text style={[styles.mediumText, styles.bold]}>Bisherige Abschlagsrechnungen:</Text>
            {invoice.previousInvoices.map((prevInvoice, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.mediumText}>{prevInvoice}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.bold]}>{getPdfTranslation('description', language)}</Text>
            <Text style={[styles.col2, styles.bold]}>{getPdfTranslation('quantity', language)}</Text>
            <Text style={[styles.col3, styles.bold]}>Einheit</Text>
            <Text style={[styles.col4, styles.bold]}>{getPdfTranslation('unitPrice', language)}</Text>
            <Text style={[styles.col5, styles.bold]}>Gesamt</Text>
          </View>
          {invoiceItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{item.unit}</Text>
              <Text style={styles.col4}>{formatPdfCurrency(item.unitPrice, language)}</Text>
              <Text style={styles.col5}>{formatPdfCurrency(item.total, language)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <Text>{getPdfTranslation('netAmount', language)} {formatPdfCurrency(subtotal, language)}</Text>
          {Object.entries(taxGroups).map(([rate, tax]) => (
            <Text key={rate}>MwSt. {rate}%: {formatPdfCurrency(tax, language)}</Text>
          ))}
          <Text style={styles.bold}>{getPdfTranslation('grossAmount', language)} {formatPdfCurrency(total, language)}</Text>
          
          {invoice.retentionFee > 0 && (
            <>
              <Text style={{ color: '#10B981' }}>
                {getPdfTranslation('retentionFee', language, { rate: invoice.retentionFee })} ({invoice.retentionFee}%): {formatPdfCurrency(total * (invoice.retentionFee / 100), language)}
              </Text>
              <Text style={[styles.bold, { marginTop: 5 }]}>
                {getPdfTranslation('payoutAmount', language)} {formatPdfCurrency(total * (1 - invoice.retentionFee / 100), language)}
              </Text>
            </>
          )}
        </View>

        {/* Payment Information */}
        <View style={styles.paymentInfo}>
          <Text style={styles.bold}>Bankverbindung:</Text>
          <Text>{settings.bankDetails.accountHolder}</Text>
          <Text>IBAN: {settings.bankDetails.iban}</Text>
          <Text>BIC: {settings.bankDetails.bic}</Text>
          <Text>{settings.bankDetails.bankName}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.smallText}>
            {settings.name} • {settings.address} • Tel: {settings.phone} • E-Mail: {settings.email}
          </Text>
          <Text style={styles.smallText}>
            Bankverbindung: {settings.bankDetails.bankName} • IBAN: {settings.bankDetails.iban} • BIC: {settings.bankDetails.bic}
          </Text>
          <Text style={styles.smallText}>
            {getPdfTranslation('vatIdLabel', language)} {settings.vatId} • {getPdfTranslation('taxIdLabel', language)} {settings.taxId}
          </Text>
        </View>
      </Page>
    </Document>
  );

  // Generate PDF with embedded XML for ZuGFERD if requested
  if (includeZugferd) {
    // Generate the ZuGFERD XML
    const zugferdXml = generateZugferdXml(invoice, settings);
    
    // Create PDF as stream
    const pdfStream = await renderToStream(<InvoiceDocument />);
    
    try {
      // Embed XML into the PDF
      const pdfWithXml = await embedZugferdXml(pdfStream, zugferdXml);
      return pdfWithXml;
    } catch (error) {
      console.error('Error embedding ZuGFERD XML:', error);
      // Fallback to standard PDF if embedding fails
      return await streamToBuffer(await renderToStream(<InvoiceDocument />));
    }
  }
  
  // Return standard PDF if ZuGFERD not requested
  return await streamToBuffer(await renderToStream(<InvoiceDocument />));
};

export const generateInvoicePreview = (invoice: Invoice, settings: CompanySettings) => {
  // Mock items if they don't exist in invoice
  const invoiceItems: InvoiceItem[] = invoice.items || [
    {
      description: 'Standardposition',
      quantity: 1,
      unit: 'Stk',
      unitPrice: invoice.amount,
      total: invoice.amount,
      taxRate: 19
    }
  ];
  
  // Calculate totals
  const { subtotal, taxGroups, total } = calculateTotals(invoiceItems);
  
  const InvoiceDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {settings.logo && (
            <Image source={settings.logo} style={styles.companyLogo} />
          )}
          <View style={styles.companyDetails}>
            <Text style={styles.mediumText}>{settings.name}</Text>
            <Text style={styles.smallText}>{settings.address}</Text>
            <Text style={styles.smallText}>{getPdfTranslation('vatIdLabel', language)} {settings.vatId}</Text>
            <Text style={styles.smallText}>{getPdfTranslation('taxIdLabel', language)} {settings.taxId}</Text>
          </View>
        </View>

        {/* Customer Address */}
        <View style={styles.addressSection}>
          <Text style={styles.smallText}>{settings.name} • {settings.address}</Text>
          <Text style={[styles.mediumText, styles.bold, { marginTop: 10 }]}>
            {invoice.customer}
          </Text>
          {invoice.customerData?.address.split('\n').map((line, i) => (
            <Text key={i} style={styles.mediumText}>{line}</Text>
          ))}
        </View>

        {/* Invoice Details */}
        <View style={styles.invoiceDetails}>
          <Text style={[styles.largeText, styles.bold]}>
            {getInvoiceTypeTranslation(invoice.type || 'Standard', language)}
          </Text>
          <View style={styles.row}>
            <Text style={styles.mediumText}>{getPdfTranslation('invoiceNumber', language)}</Text>
            <Text style={[styles.mediumText, styles.bold, { marginLeft: 10 }]}>
              {invoice.number}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.mediumText}>{getPdfTranslation('date', language)}</Text>
            <Text style={[styles.mediumText, { marginLeft: 10 }]}>
              {formatPdfDate(invoice.date, language)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.mediumText}>{getPdfTranslation('dueDate', language)}</Text>
            <Text style={[styles.mediumText, { marginLeft: 10 }]}>
              {formatPdfDate(invoice.dueDate, language)}
            </Text>
          </View>
        </View>

        {/* Previous Invoices for Final Invoice */}
        {invoice.type === 'Schlussrechnung' && invoice.previousInvoices && (
          <View style={styles.previous}>
            <Text style={[styles.mediumText, styles.bold]}>Bisherige Abschlagsrechnungen:</Text>
            {invoice.previousInvoices.map((prevInvoice, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.mediumText}>{prevInvoice}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.bold]}>{getPdfTranslation('description', language)}</Text>
            <Text style={[styles.col2, styles.bold]}>{getPdfTranslation('quantity', language)}</Text>
            <Text style={[styles.col3, styles.bold]}>Einheit</Text>
            <Text style={[styles.col4, styles.bold]}>{getPdfTranslation('unitPrice', language)}</Text>
            <Text style={[styles.col5, styles.bold]}>Gesamt</Text>
          </View>
          {invoiceItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{item.unit}</Text>
              <Text style={styles.col4}>{formatPdfCurrency(item.unitPrice, language)}</Text>
              <Text style={styles.col5}>{formatPdfCurrency(item.total, language)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <Text>{getPdfTranslation('netAmount', language)} {formatPdfCurrency(subtotal, language)}</Text>
          {Object.entries(taxGroups).map(([rate, tax]) => (
            <Text key={rate}>MwSt. {rate}%: {formatPdfCurrency(tax, language)}</Text>
          ))}
          <Text style={styles.bold}>{getPdfTranslation('grossAmount', language)} {formatPdfCurrency(total, language)}</Text>
          
          {invoice.retentionFee > 0 && (
            <>
              <Text style={{ color: '#10B981' }}>
                {getPdfTranslation('retentionFee', language, { rate: invoice.retentionFee })} ({invoice.retentionFee}%): {formatPdfCurrency(total * (invoice.retentionFee / 100), language)}
              </Text>
              <Text style={[styles.bold, { marginTop: 5 }]}>
                {getPdfTranslation('payoutAmount', language)} {formatPdfCurrency(total * (1 - invoice.retentionFee / 100), language)}
              </Text>
            </>
          )}
        </View>

        {/* Payment Information */}
        <View style={styles.paymentInfo}>
          <Text style={styles.bold}>Bankverbindung:</Text>
          <Text>{settings.bankDetails.accountHolder}</Text>
          <Text>IBAN: {settings.bankDetails.iban}</Text>
          <Text>BIC: {settings.bankDetails.bic}</Text>
          <Text>{settings.bankDetails.bankName}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.smallText}>
            {settings.name} • {settings.address} • Tel: {settings.phone} • E-Mail: {settings.email}
          </Text>
          <Text style={styles.smallText}>
            Bankverbindung: {settings.bankDetails.bankName} • IBAN: {settings.bankDetails.iban} • BIC: {settings.bankDetails.bic}
          </Text>
          <Text style={styles.smallText}>
            {getPdfTranslation('vatIdLabel', language)} {settings.vatId} • {getPdfTranslation('taxIdLabel', language)} {settings.taxId}
          </Text>
        </View>
      </Page>
    </Document>
  );

  return InvoiceDocument;
};
