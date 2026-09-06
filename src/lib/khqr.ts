/**
 * Generates a KHQR string — Cambodia's National Bank interoperable QR
 * payment standard (EMVCo-based). Scannable by any Cambodian banking app
 * that supports KHQR (Bakong, ABA, ACLEDA, etc).
 *
 * The tag structure and CRC16 checksum algorithm here were verified byte-
 * for-byte against a real published example from the Bakong KHQR SDK
 * documentation before shipping — this is not a guess at the format.
 *
 * KADO MARKET has no Bakong merchant API integration, so this only
 * produces the QR code for the customer to scan and pay; the seller still
 * confirms receipt manually in their own banking app.
 */

function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

// CRC-16/CCITT-FALSE — verified to reproduce Bakong's published example CRC exactly
function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generateKhqr(params: {
  bakongAccountId: string; // e.g. "username@bankcode", as registered with the seller's bank
  accountInformation: string; // phone number or account number tied to that Bakong ID
  merchantName: string;
  merchantCity?: string;
  amount?: number; // omit or 0 for a reusable static QR with no fixed amount
  currency?: "USD" | "KHR";
}): string {
  const {
    bakongAccountId,
    accountInformation,
    merchantName,
    merchantCity = "Phnom Penh",
    amount = 0,
    currency = "USD",
  } = params;

  const isDynamic = amount > 0;
  const currencyCode = currency === "USD" ? "840" : "116";

  const merchantAccountInfo = tlv("00", bakongAccountId) + tlv("01", accountInformation);

  const parts = [
    tlv("00", "01"), // Payload Format Indicator
    tlv("01", isDynamic ? "12" : "11"), // Point of Initiation Method
    tlv("29", merchantAccountInfo), // Merchant Account Information
    tlv("52", "5999"), // Merchant Category Code (generic retail)
    tlv("53", currencyCode), // Transaction Currency
    ...(isDynamic ? [tlv("54", amount.toFixed(2))] : []), // Transaction Amount
    tlv("58", "KH"), // Country Code
    tlv("59", merchantName.slice(0, 25)), // Merchant Name
    tlv("60", merchantCity.slice(0, 15)), // Merchant City
    tlv("99", tlv("00", Date.now().toString())), // Bakong timestamp extension
  ];

  const withoutCrc = parts.join("") + "6304";
  const crc = crc16(withoutCrc);

  return withoutCrc + crc;
}
