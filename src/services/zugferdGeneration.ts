import type { Invoice } from '../types/invoice';
import type { CompanySettings } from '../types/settings';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  taxRate: number;
}

export const generateZugferdXml = (invoice: Invoice, settings: CompanySettings): string => {
  // Get invoice items (use mock if none exist)
  const invoiceItems: InvoiceItem[] = invoice.items || [{
    description: 'Standardposition',
    quantity: 1,
    unit: 'Stk',
    unitPrice: invoice.amount,
    total: invoice.amount,
    taxRate: 19
  }];
  
  // Calculate totals
  const { subtotal, taxGroups, totalTax, total } = calculateTotals(invoiceItems);
  
  // Format dates for XML
  const invoiceDate = formatDateForXml(invoice.date);
  const dueDate = formatDateForXml(invoice.dueDate);
  
  // Create XML structure
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${invoice.number}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${invoiceDate}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <!-- Seller information -->
    <ram:SellerTradeParty>
      <ram:Name>${escapeXml(settings.name)}</ram:Name>
      <ram:PostalTradeAddress>
        <ram:PostcodeCode>${extractPostcode(settings.address)}</ram:PostcodeCode>
        <ram:LineOne>${escapeXml(settings.address)}</ram:LineOne>
        <ram:CityName>${extractCity(settings.address)}</ram:CityName>
        <ram:CountryID>DE</ram:CountryID>
      </ram:PostalTradeAddress>
      <ram:SpecifiedTaxRegistration>
        <ram:ID schemeID="VA">${settings.vatId}</ram:ID>
      </ram:SpecifiedTaxRegistration>
    </ram:SellerTradeParty>
    <!-- Buyer information -->
    <ram:BuyerTradeParty>
      <ram:Name>${escapeXml(invoice.customer)}</ram:Name>
      ${invoice.customerData?.address ? generateBuyerAddress(invoice.customerData.address) : ''}
    </ram:BuyerTradeParty>
    
    <!-- Line items -->
    ${generateLineItems(invoiceItems)}
    
    <!-- Payment terms -->
    <ram:ApplicableHeaderTradeSettlement>
      <ram:DuePayableAmount currencyID="EUR">${total.toFixed(2)}</ram:DuePayableAmount>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${settings.bankDetails.iban}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>
      ${generateTaxSummary(invoiceItems)}
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${dueDate}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementMonetarySummation>
        <ram:LineTotalAmount currencyID="EUR">${subtotal.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount currencyID="EUR">${subtotal.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${totalTax.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount currencyID="EUR">${total.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount currencyID="EUR">${total.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

  return xml;
};

// Helper functions
const formatDateForXml = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0].replace(/-/g, '');
};

const extractPostcode = (address: string): string => {
  const postcodeMatch = address.match(/\b\d{5}\b/);
  return postcodeMatch ? postcodeMatch[0] : '';
};

const extractCity = (address: string): string => {
  const parts = address.split(',');
  return parts.length > 1 ? parts[1].trim().split(' ').slice(1).join(' ') : '';
};

const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

const generateBuyerAddress = (address: string): string => {
  const addressLines = address.split('\n');
  const postcode = extractPostcode(address);
  const city = extractCity(address);
  
  return `
    <ram:PostalTradeAddress>
      <ram:PostcodeCode>${postcode}</ram:PostcodeCode>
      <ram:LineOne>${escapeXml(addressLines[0] || '')}</ram:LineOne>
      ${addressLines.length > 1 ? `<ram:LineTwo>${escapeXml(addressLines[1] || '')}</ram:LineTwo>` : ''}
      <ram:CityName>${escapeXml(city)}</ram:CityName>
      <ram:CountryID>DE</ram:CountryID>
    </ram:PostalTradeAddress>`;
};

const generateLineItems = (items: InvoiceItem[]): string => {
  if (!items || items.length === 0) {
    return '';
  }
  
  return items.map((item, index) => 
    generateLineItem(item, index + 1)
  ).join('\n');
};

const generateLineItem = (item: InvoiceItem, index: number): string => {
  return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(item.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount currencyID="EUR">${item.unitPrice.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${mapUnitToCode(item.unit)}">${item.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${item.taxRate}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount currencyID="EUR">${item.total.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
};

const mapUnitToCode = (unit: string): string => {
  // Map your units to UN/CEFACT codes
  const unitMap: {[key: string]: string} = {
    'Stk': 'C62', // piece
    'h': 'HUR',   // hour
    'kg': 'KGM',  // kilogram
    'm': 'MTR',   // meter
    'm²': 'MTK',  // square meter
    'm³': 'MTQ',  // cubic meter
    'Tag': 'DAY', // day
    'Std': 'HUR', // hour
  };
  return unitMap[unit] || 'C62'; // Default to piece
};

const generateTaxSummary = (items: InvoiceItem[]): string => {
  // Group by tax rate
  const taxRates: {[key: number]: {taxBase: number, taxAmount: number}} = {};
  
  items.forEach(item => {
    if (!taxRates[item.taxRate]) {
      taxRates[item.taxRate] = {taxBase: 0, taxAmount: 0};
    }
    taxRates[item.taxRate].taxBase += item.total;
    taxRates[item.taxRate].taxAmount += item.total * (item.taxRate / 100);
  });
  
  return Object.entries(taxRates).map(([rate, values]) => `
    <ram:ApplicableTradeTax>
      <ram:TypeCode>VAT</ram:TypeCode>
      <ram:CategoryCode>S</ram:CategoryCode>
      <ram:RateApplicablePercent>${rate}</ram:RateApplicablePercent>
      <ram:BasisAmount currencyID="EUR">${values.taxBase.toFixed(2)}</ram:BasisAmount>
      <ram:CalculatedAmount currencyID="EUR">${values.taxAmount.toFixed(2)}</ram:CalculatedAmount>
    </ram:ApplicableTradeTax>`).join('');
};

// Calculate totals from items
const calculateTotals = (items: InvoiceItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxGroups = items.reduce((groups: { [key: number]: number }, item) => {
    const tax = (item.total * item.taxRate) / 100;
    groups[item.taxRate] = (groups[item.taxRate] || 0) + tax;
    return groups;
  }, {});
  const totalTax = Object.values(taxGroups).reduce((sum: number, tax: number) => sum + tax, 0);
  return { subtotal, taxGroups, totalTax, total: subtotal + totalTax };
};