import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function fetchImageBuffer(url: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null; // a broken/slow image should never take down the whole invoice
  }
}

function generateInvoicePdf(params: {
  orderNumber: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  storeName: string;
  storeCity: string | null;
  storeLogo: Buffer | null;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  items: { name: string; quantity: number; unitPrice: number; subtotal: number; image: Buffer | null }[];
  subtotal: number;
  discountAmount: number;
  discountCode: string | null;
  shippingFee: number;
  total: number;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header — the seller's own store branding first (this is their
    // receipt to their customer), KADO MARKET as the small platform note.
    const headerTop = doc.y;
    if (params.storeLogo) {
      try {
        doc.image(params.storeLogo, 50, headerTop, { width: 44, height: 44, fit: [44, 44] });
      } catch {
        // corrupt/unsupported image format — skip the logo, never break the PDF
      }
    }
    const titleX = params.storeLogo ? 104 : 50;
    doc.fontSize(16).fillColor("#111111").text(params.storeName, titleX, headerTop);
    doc.fontSize(8).fillColor("#999999").text("Invoice via KADO MARKET", titleX, headerTop + 20);
    doc.y = headerTop + 50;

    doc.fontSize(16).fillColor("#111111").text("INVOICE", { align: "right" });
    doc.fontSize(10).fillColor("#666666").text(`Order #${params.orderNumber}`, { align: "right" });
    doc.text(new Date(params.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), { align: "right" });
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#dddddd").stroke();
    doc.moveDown(1);

    // Sold by / Bill to
    const colY = doc.y;
    doc.fontSize(10).fillColor("#999999").text("SOLD BY", 50, colY);
    doc.fontSize(11).fillColor("#111111").text(params.storeName, 50, colY + 14);
    if (params.storeCity) doc.fontSize(10).fillColor("#666666").text(params.storeCity, 50, colY + 30);

    doc.fontSize(10).fillColor("#999999").text("BILL TO", 300, colY);
    doc.fontSize(11).fillColor("#111111").text(params.customerName, 300, colY + 14);
    doc.fontSize(10).fillColor("#666666").text(params.customerPhone, 300, colY + 30);
    doc.text(params.shippingAddress, 300, colY + 44, { width: 245 });

    doc.y = colY + 90;
    doc.moveDown(1);

    // Items table header
    const tableTop = doc.y;
    doc.fontSize(10).fillColor("#999999");
    doc.text("ITEM", 90, tableTop);
    doc.text("QTY", 320, tableTop, { width: 50, align: "right" });
    doc.text("PRICE", 380, tableTop, { width: 70, align: "right" });
    doc.text("SUBTOTAL", 460, tableTop, { width: 85, align: "right" });
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor("#dddddd").stroke();

    const ROW_HEIGHT = 40;
    let y = tableTop + 22;
    doc.fillColor("#111111").fontSize(10);
    for (const item of params.items) {
      if (item.image) {
        try {
          doc.image(item.image, 50, y, { width: 32, height: 32, fit: [32, 32] });
        } catch {
          // unsupported image format for this item — skip just the thumbnail
        }
      }
      const textY = y + 10;
      doc.text(item.name, 90, textY, { width: 220 });
      doc.text(String(item.quantity), 320, textY, { width: 50, align: "right" });
      doc.text(`$${item.unitPrice.toFixed(2)}`, 380, textY, { width: 70, align: "right" });
      doc.text(`$${item.subtotal.toFixed(2)}`, 460, textY, { width: 85, align: "right" });
      y += ROW_HEIGHT;
    }

    doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor("#dddddd").stroke();
    y += 20;

    // Totals
    function totalLine(label: string, value: string, bold = false) {
      doc.fontSize(bold ? 12 : 10).fillColor(bold ? "#111111" : "#666666");
      doc.text(label, 350, y, { width: 110, align: "right" });
      doc.text(value, 460, y, { width: 85, align: "right" });
      y += bold ? 20 : 16;
    }

    totalLine("Subtotal", `$${params.subtotal.toFixed(2)}`);
    if (params.discountAmount > 0) {
      totalLine(`Discount${params.discountCode ? ` (${params.discountCode})` : ""}`, `-$${params.discountAmount.toFixed(2)}`);
    }
    totalLine("Shipping", params.shippingFee > 0 ? `$${params.shippingFee.toFixed(2)}` : "Free");
    y += 4;
    doc.moveTo(350, y).lineTo(545, y).strokeColor("#111111").stroke();
    y += 8;
    totalLine("Total", `$${params.total.toFixed(2)}`, true);

    doc.y = y + 20;

    // Payment info
    doc.fontSize(10).fillColor("#999999").text("PAYMENT", 50, doc.y);
    doc.fontSize(10).fillColor("#111111").text(`${params.paymentMethod.toUpperCase()} — ${params.paymentStatus}`, 50, doc.y + 14);

    // Footer
    doc.fontSize(8).fillColor("#999999").text(
      "This invoice was generated by KADO MARKET. For questions about this order, contact the seller directly through the app.",
      50,
      760,
      { width: 495, align: "center" }
    );

    doc.end();
  });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, stores(store_name, city, seller_id, logo_url)")
    .eq("id", params.id)
    .single();

  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const store = order.stores as unknown as { store_name: string; city: string | null; seller_id: string; logo_url: string | null } | null;
  const isCustomer = order.customer_id === user.id;
  const isSeller = store?.seller_id === user.id;
  if (!isCustomer && !isSeller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);

  const shippingAddress = order.shipping_address as unknown as {
    full_name: string;
    phone: string;
    address_line: string;
    city: string | null;
    province: string | null;
    country: string | null;
  } | null;

  // Fetch the store logo and every product image in parallel — one
  // slow/broken image should never block or crash the whole invoice.
  const [storeLogo, itemImages] = await Promise.all([
    fetchImageBuffer(store?.logo_url ?? null),
    Promise.all((items ?? []).map((i) => fetchImageBuffer(i.product_image))),
  ]);

  const pdfBuffer = await generateInvoicePdf({
    orderNumber: order.order_number,
    createdAt: order.created_at,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    storeName: store?.store_name ?? "Store",
    storeCity: store?.city ?? null,
    storeLogo,
    customerName: shippingAddress?.full_name ?? "Customer",
    customerPhone: shippingAddress?.phone ?? "",
    shippingAddress: [shippingAddress?.address_line, shippingAddress?.city, shippingAddress?.province, shippingAddress?.country]
      .filter(Boolean)
      .join(", "),
    items: (items ?? []).map((i, idx) => ({
      name: i.product_name,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      subtotal: Number(i.subtotal),
      image: itemImages[idx],
    })),
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discount_amount ?? 0),
    discountCode: order.discount_code,
    shippingFee: Number(order.shipping_fee),
    total: Number(order.total),
  });

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${order.order_number}.pdf"`,
    },
  });
}
