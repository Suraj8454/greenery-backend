// const PAGE_W = 595, PAGE_H = 842;
// const hexRgb = (hex) => { const h=String(hex||'#174a34').replace('#',''); const full=h.length===3?h.split('').map(x=>x+x).join(''):h; const n=parseInt(full,16); return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255]; };
// const esc = (s) => String(s ?? '').replace(/₹/g,'Rs. ').replace(/[–—]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[^\x20-\x7E]/g,'?').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
// const money = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
// function makePage(commands) { return commands.join('\n'); }
// function buildCommands(order, items, store, pageIndex, pageCount) {
//   const c=[]; const dark=hexRgb(store.primary_color||'#173f2e'), accent=hexRgb(store.accent_color||'#8cc6a2');
//   const text=(x,y,value,size=10,color=[.12,.17,.14],bold=false,align='left')=>{let val=esc(value);let xx=x;if(align==='right')xx=x-(val.length*size*(bold?.56:.51));if(align==='center')xx=x-(val.length*size*(bold?.56:.51))/2;c.push(`BT /${bold?'F2':'F1'} ${size} Tf ${color.map(v=>v.toFixed(3)).join(' ')} rg 1 0 0 1 ${xx.toFixed(2)} ${(PAGE_H-y).toFixed(2)} Tm (${val}) Tj ET`)};
//   const rect=(x,y,w,h,color,radius=false)=>{c.push(`q ${color.map(v=>v.toFixed(3)).join(' ')} rg ${x} ${PAGE_H-y-h} ${w} ${h} re f Q`)};
//   const line=(x1,y1,x2,y2,color=[.88,.91,.88],width=1)=>c.push(`q ${color.map(v=>v.toFixed(3)).join(' ')} RG ${width} w ${x1} ${PAGE_H-y1} m ${x2} ${PAGE_H-y2} l S Q`);
//   // Brand header and invoice title block
//   rect(0,0,PAGE_W,150,dark);
//   rect(38,32,42,42,accent); text(59,59,'CG',17,dark,true,'center');
//   text(94,48,store.brand_name||'Cityscape Greenery',18,[1,1,1],true); text(94,68,store.brand_tagline||'Thoughtful greens for modern living',9,[.82,.91,.85]);
//   text(557,48,'INVOICE',23,[1,1,1],true,'right'); text(557,69,'Order summary & receipt',9,[.82,.91,.85],false,'right');
//   text(38,112,'ORDER ID',8,[.75,.88,.79],true); text(38,132,'CG-'+String(order.id).padStart(6,'0'),12,[1,1,1],true);
//   text(220,112,'ORDER DATE',8,[.75,.88,.79],true); text(220,132,new Date(order.created_at).toLocaleDateString('en-IN'),11,[1,1,1],true);
//   text(390,112,'ORDER STATUS',8,[.75,.88,.79],true); text(390,132,order.status||'Confirmed',11,[1,1,1],true);
//   // Two clean information columns
//   text(38,183,'BILL TO',9,dark,true); text(310,183,'DELIVERY DETAILS',9,dark,true); line(38,193,270,193,accent,2); line(310,193,557,193,accent,2);
//   text(38,216,order.customer_name||'Customer',12,[.12,.17,.14],true); text(38,234,order.customer_email||order.user_email||'Email not provided',9,[.36,.41,.37]); text(38,250,order.phone||order.user_phone||'Phone not provided',9,[.36,.41,.37]);
//   const addr=[order.address,order.city,order.state,order.pincode].filter(Boolean).join(', '); const addrLines=[]; for(let i=0;i<addr.length;i+=42)addrLines.push(addr.slice(i,i+42)); addrLines.slice(0,3).forEach((v,i)=>text(310,216+i*15,v,9,[.36,.41,.37]));
//   text(310,266,'Expected delivery',8,[.48,.53,.49],true); text(410,266,order.expected_delivery_date?new Date(order.expected_delivery_date).toLocaleDateString('en-IN'):'To be confirmed',9,[.12,.17,.14],true);
//   // Payment and shipping bar
//   rect(38,285,519,40,[.95,.97,.95]); text(50,301,'PAYMENT METHOD',7,[.45,.5,.46],true); text(50,316,(order.payment_method||'COD').toUpperCase(),9,dark,true); text(235,301,'PAYMENT STATUS',7,[.45,.5,.46],true); text(235,316,order.payment_status||'Pending',9,dark,true); text(410,301,'PROMO CODE',7,[.45,.5,.46],true); text(410,316,order.promo_code||'—',9,dark,true);
//   let y=360;
//   text(38,y,'ORDERED ITEMS',11,dark,true); text(557,y,`${items.length} item${items.length===1?'':'s'}`,8,[.48,.53,.49],false,'right'); y+=18;
//   // Table header
//   rect(38,y,519,29,dark); text(50,y+18,'ITEM DESCRIPTION',8,[1,1,1],true); text(390,y+18,'QTY',8,[1,1,1],true,'right'); text(468,y+18,'UNIT PRICE',8,[1,1,1],true,'right'); text(546,y+18,'AMOUNT',8,[1,1,1],true,'right'); y+=29;
//   const perPage=5, pageItems=items.slice(pageIndex*perPage,(pageIndex+1)*perPage);
//   pageItems.forEach((it,idx)=>{const rowY=y; if(idx%2===1)rect(38,rowY,519,42,[.975,.982,.975]); const nm=String(it.product_name||it.name||'Product');text(50,rowY+17,nm.slice(0,42),9,[.13,.18,.15],true); if(nm.length>42)text(50,rowY+31,nm.slice(42,82),7,[.45,.5,.46]); const color=it.selected_color?`Colour: ${String(it.selected_color).slice(0,20)}`:'';if(color)text(50,rowY+31,color,7,[.45,.5,.46]);text(390,rowY+23,String(it.qty||1),9,[.13,.18,.15],false,'right');text(468,rowY+23,money(it.price),8,[.13,.18,.15],false,'right');text(546,rowY+23,money(Number(it.price||0)*Number(it.qty||1)),8,[.13,.18,.15],true,'right');line(38,rowY+42,557,rowY+42,[.91,.93,.91],.5);y+=42;});
//   if(pageIndex===pageCount-1){
//     y=Math.max(y+22, Math.min(735,y+18));
//     // Totals card is right-aligned, visually distinct from the items list
//     const bx=333, bw=224; rect(bx,y,bw, Math.max(124, order.discount?146:124),[.955,.97,.955]);
//     const tx=bx+16, ax=bx+bw-15; text(tx,y+23,'Subtotal',9,[.36,.41,.37]);text(ax,y+23,money(order.subtotal),9,[.12,.17,.14],true,'right');
//     text(tx,y+45,'Delivery',9,[.36,.41,.37]);text(ax,y+45,Number(order.shipping)===0?'FREE':money(order.shipping),9,[.12,.17,.14],true,'right');
//     text(tx,y+67,order.promo_code?`Discount (${order.promo_code})`:'Discount',9,[.36,.41,.37]);text(ax,y+67,'-'+money(order.discount),9,[.12,.17,.14],true,'right');line(tx,y+80,ax,y+80,accent,1.4);
//     text(tx,y+104,'TOTAL PAID / DUE',8,dark,true);text(ax,y+104,money(order.total),15,dark,true,'right');
//     // Footer note
//     line(38,790,557,790,[.86,.9,.86],1); text(38,810,'Thank you for choosing '+(store.brand_name||'Cityscape Greenery')+'.',9,dark,true); text(38,826,'For help: '+(store.contact_email||'')+'  '+(store.mobile_number||''),8,[.43,.49,.44]); text(557,826,`Page ${pageIndex+1} of ${pageCount}`,8,[.43,.49,.44],false,'right');
//   } else {line(38,790,557,790,[.86,.9,.86],1);text(38,814,'Continued on next page',9,dark,true);text(557,826,`Page ${pageIndex+1} of ${pageCount}`,8,[.43,.49,.44],false,'right');}
//   return makePage(c);
// }
// function buildInvoicePdf(order,items,store={}){
//  const perPage=5, count=Math.max(1,Math.ceil(items.length/perPage)); const streams=Array.from({length:count},(_,i)=>buildCommands(order,items,store,i,count));
//  const objects=[]; objects[1]='<< /Type /Catalog /Pages 2 0 R >>'; const pageIds=streams.map((_,i)=>3+i*2); objects[2]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${count} >>`;
//  streams.forEach((stream,i)=>{const pid=3+i*2,cid=pid+1;objects[pid]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${3+count*2} 0 R /F2 ${4+count*2} 0 R >> >> /Contents ${cid} 0 R >>`;objects[cid]=`<< /Length ${Buffer.byteLength(stream,'ascii')} >>\nstream\n${stream}\nendstream`;}); objects[3+count*2]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';objects[4+count*2]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
//  let out='%PDF-1.4\n%CityscapeInvoice\n';const offsets=[0];for(let i=1;i<objects.length;i++){offsets[i]=Buffer.byteLength(out,'binary');out+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}const xref=Buffer.byteLength(out,'binary');out+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)out+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;out+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return Buffer.from(out,'binary');
// }
// module.exports={buildInvoicePdf};


'use strict';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 38;

const hexRgb = (hex) => {
  const h = String(hex || '#174a34').replace('#', '').trim();
  const full = h.length === 3
    ? h.split('').map((x) => x + x).join('')
    : h;

  const n = Number.parseInt(full, 16);

  if (!Number.isFinite(n)) {
    return [23 / 255, 74 / 255, 52 / 255];
  }

  return [
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255
  ];
};

const esc = (value) =>
  String(value ?? '')
    .replace(/₹/g, 'Rs. ')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const money = (value) =>
  'Rs. ' + Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const dateText = (value) => {
  if (!value) return 'To be confirmed';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
};

const clean = (value, fallback = '') => {
  const s = String(value ?? '').trim();
  return s || fallback;
};

function buildCommands(order, items, store, pageIndex, pageCount) {
  const c = [];

  const dark = hexRgb(store.primary_color || '#173f2e');
  const accent = hexRgb(store.accent_color || '#8cc6a2');

  const ink = [0.12, 0.17, 0.14];
  const muted = [0.40, 0.45, 0.41];
  const pale = [0.95, 0.97, 0.95];
  const white = [1, 1, 1];

  const text = (
    x,
    y,
    value,
    size = 10,
    color = ink,
    bold = false,
    align = 'left'
  ) => {
    const val = esc(value);
    const charWidth = size * (bold ? 0.55 : 0.50);

    let xx = x;

    if (align === 'right') {
      xx = x - val.length * charWidth;
    }

    if (align === 'center') {
      xx = x - (val.length * charWidth) / 2;
    }

    c.push(
      `BT /${bold ? 'F2' : 'F1'} ${size} Tf ` +
      `${color.map((v) => v.toFixed(3)).join(' ')} rg ` +
      `1 0 0 1 ${xx.toFixed(2)} ${(PAGE_H - y).toFixed(2)} Tm ` +
      `(${val}) Tj ET`
    );
  };

  const rect = (x, y, w, h, color) => {
    c.push(
      `q ${color.map((v) => v.toFixed(3)).join(' ')} rg ` +
      `${x} ${(PAGE_H - y - h).toFixed(2)} ${w} ${h} re f Q`
    );
  };

  const line = (
    x1,
    y1,
    x2,
    y2,
    color = [0.88, 0.91, 0.88],
    width = 1
  ) => {
    c.push(
      `q ${color.map((v) => v.toFixed(3)).join(' ')} RG ` +
      `${width} w ${x1} ${(PAGE_H - y1).toFixed(2)} m ` +
      `${x2} ${(PAGE_H - y2).toFixed(2)} l S Q`
    );
  };

  const circle = (cx, cy, radius, color) => {
    const k = 0.5522847498 * radius;
    const yy = (v) => (PAGE_H - v).toFixed(2);

    c.push(
      `q ${color.map((v) => v.toFixed(3)).join(' ')} rg ` +
      `${(cx + radius).toFixed(2)} ${yy(cy)} m ` +
      `${(cx + radius).toFixed(2)} ${yy(cy - k)} ` +
      `${(cx + k).toFixed(2)} ${yy(cy - radius)} ` +
      `${cx.toFixed(2)} ${yy(cy - radius)} c ` +
      `${(cx - k).toFixed(2)} ${yy(cy - radius)} ` +
      `${(cx - radius).toFixed(2)} ${yy(cy - k)} ` +
      `${(cx - radius).toFixed(2)} ${yy(cy)} c ` +
      `${(cx - radius).toFixed(2)} ${yy(cy + k)} ` +
      `${(cx - k).toFixed(2)} ${yy(cy + radius)} ` +
      `${cx.toFixed(2)} ${yy(cy + radius)} c ` +
      `${(cx + k).toFixed(2)} ${yy(cy + radius)} ` +
      `${(cx + radius).toFixed(2)} ${yy(cy + k)} ` +
      `${(cx + radius).toFixed(2)} ${yy(cy)} c f Q`
    );
  };

  const brand = clean(store.brand_name, 'Cityscape Greenery');

  const orderCode = clean(
    order.order_number || order.order_code || order.order_id,
    `CG-${String(order.id ?? '').padStart(6, '0')}`
  );

  const paymentStatus = clean(order.payment_status, 'Pending');
  const status = clean(order.status, 'Order Placed');
  const paymentMethod = clean(order.payment_method, 'COD');

  const customerName = clean(
    order.customer_name || order.name,
    'Customer'
  );

  const email = clean(
    order.customer_email || order.user_email || order.email,
    'Email not provided'
  );

  const phone = clean(
    order.phone || order.user_phone || order.customer_phone,
    'Phone not provided'
  );

  const addressParts = [
    order.address || order.shipping_address,
    order.city,
    order.state,
    order.pincode || order.postal_code,
    order.country
  ].filter(Boolean);

  const address = addressParts.join(', ');

  const transactionId = clean(
    order.transaction_id ||
    order.payment_id ||
    order.razorpay_payment_id,
    'Not provided'
  );

  // =========================
  // BRAND HEADER
  // =========================

  rect(0, 0, PAGE_W, 142, dark);
  rect(M, 29, 42, 42, accent);

  text(
    M + 21,
    55,
    brand.slice(0, 1).toUpperCase(),
    19,
    dark,
    true,
    'center'
  );

  text(91, 43, brand, 17, white, true);

  text(
    91,
    62,
    clean(store.brand_tagline, 'Thoughtful greens for modern living'),
    8.5,
    [0.83, 0.91, 0.86]
  );

  text(
    PAGE_W - M,
    42,
    'CUSTOMER INVOICE',
    18,
    white,
    true,
    'right'
  );

  text(
    PAGE_W - M,
    61,
    'Order summary & payment receipt',
    8.5,
    [0.83, 0.91, 0.86],
    false,
    'right'
  );

  text(M, 101, 'ORDER ID', 7.5, [0.77, 0.88, 0.80], true);
  text(M, 122, orderCode, 11.5, white, true);

  text(222, 101, 'ORDER DATE', 7.5, [0.77, 0.88, 0.80], true);
  text(
    222,
    122,
    dateText(order.created_at || order.order_date),
    10,
    white,
    true
  );

  text(402, 101, 'ORDER STATUS', 7.5, [0.77, 0.88, 0.80], true);
  text(402, 122, status, 10, white, true);

  // =========================
  // PAYMENT BANNER
  // =========================

  rect(M, 157, PAGE_W - M * 2, 36, pale);

  circle(M + 17, 175, 8, accent);

  const isPaid = ['paid', 'completed'].includes(
    paymentStatus.toLowerCase()
  );

  text(
    M + 17,
    178,
    isPaid ? 'OK' : '!',
    5.5,
    dark,
    true,
    'center'
  );

  text(
    M + 33,
    179,
    `PAYMENT ${paymentStatus.toUpperCase()}`,
    8.5,
    dark,
    true
  );

  text(
    PAGE_W - M - 12,
    179,
    `Thank you for choosing ${brand}.`,
    8,
    muted,
    false,
    'right'
  );

  // =========================
  // DELIVERY AND PAYMENT INFO
  // =========================

  text(M, 220, 'DELIVERY ADDRESS', 9, dark, true);
  text(314, 220, 'PAYMENT DETAILS', 9, dark, true);

  line(M, 230, 277, 230, accent, 2);
  line(314, 230, PAGE_W - M, 230, accent, 2);

  text(M, 250, customerName, 11, ink, true);

  const addrLines = [];

  for (let i = 0; i < address.length; i += 39) {
    addrLines.push(address.slice(i, i + 39));
  }

  (addrLines.length ? addrLines : ['Address not provided'])
    .slice(0, 3)
    .forEach((value, index) => {
      text(M, 268 + index * 13, value, 8, muted);
    });

  text(314, 250, `Status: ${paymentStatus}`, 8.5, ink, true);
  text(314, 268, `Method: ${paymentMethod}`, 8.5, ink);

  text(
    314,
    286,
    `Transaction: ${transactionId.slice(0, 29)}`,
    7.5,
    muted
  );

  text(
    314,
    304,
    `Email: ${email.slice(0, 34)}`,
    7.5,
    muted
  );

  text(M, 314, `Phone: ${phone}`, 8, muted);

  // =========================
  // ORDER ITEMS TABLE
  // =========================

  const startY = 337;

  text(M, startY, 'ORDER ITEMS', 10.5, dark, true);

  text(
    PAGE_W - M,
    startY,
    `${items.length} item${items.length === 1 ? '' : 's'}`,
    8,
    muted,
    false,
    'right'
  );

  const tableY = startY + 13;

  rect(M, tableY, PAGE_W - M * 2, 27, dark);

  text(M + 12, tableY + 17, 'ITEM DESCRIPTION', 7.5, white, true);
  text(390, tableY + 17, 'QTY', 7.5, white, true, 'right');
  text(468, tableY + 17, 'UNIT PRICE', 7.5, white, true, 'right');

  text(
    PAGE_W - M - 10,
    tableY + 17,
    'AMOUNT',
    7.5,
    white,
    true,
    'right'
  );

  const perPage = 7;

  const pageItems = items.slice(
    pageIndex * perPage,
    (pageIndex + 1) * perPage
  );

  let y = tableY + 27;

  pageItems.forEach((item, index) => {
    const rowH = 35;

    if (index % 2 === 0) {
      rect(M, y, PAGE_W - M * 2, rowH, [0.975, 0.982, 0.975]);
    }

    const name = clean(
      item.product_name || item.name || item.title,
      'Product'
    );

    text(M + 12, y + 15, name.slice(0, 42), 8.5, ink, true);

    const variation = clean(
      item.selected_color || item.variant || item.color,
      ''
    );

    if (variation) {
      text(
        M + 12,
        y + 27,
        `Option: ${variation.slice(0, 32)}`,
        6.8,
        muted
      );
    }

    const qty = Number(item.qty || item.quantity || 1);

    const price = Number(
      item.price || item.unit_price || 0
    );

    text(390, y + 21, String(qty), 8.5, ink, false, 'right');

    text(
      468,
      y + 21,
      money(price),
      7.5,
      ink,
      false,
      'right'
    );

    text(
      PAGE_W - M - 10,
      y + 21,
      money(price * qty),
      7.5,
      ink,
      true,
      'right'
    );

    line(
      M,
      y + rowH,
      PAGE_W - M,
      y + rowH,
      [0.90, 0.93, 0.90],
      0.5
    );

    y += rowH;
  });

  // =========================
  // TOTALS SECTION
  // Reduced the gap after the items table
  // =========================

  if (pageIndex === pageCount - 1) {
    // Totals start just below the last item row.
    // Previously there was a large minimum gap here.
    const totalsY = Math.min(y + 10, 655);

    const boxX = 321;
    const boxW = PAGE_W - M - boxX;

    rect(boxX, totalsY, boxW, 112, pale);

    const labelX = boxX + 13;
    const valueX = boxX + boxW - 12;

    const calculatedSubtotal = items.reduce((sum, item) => {
      const price = Number(item.price || item.unit_price || 0);
      const qty = Number(item.qty || item.quantity || 1);

      return sum + price * qty;
    }, 0);

    const subtotal = Number(
      order.subtotal ?? calculatedSubtotal
    );

    const shipping = Number(
      order.shipping ?? order.shipping_fee ?? 0
    );

    const discount = Number(order.discount || 0);

    const total = Number(
      order.total ?? order.total_amount ?? 0
    );

    text(labelX, totalsY + 21, 'Subtotal', 8.5, muted);

    text(
      valueX,
      totalsY + 21,
      money(subtotal),
      8.5,
      ink,
      true,
      'right'
    );

    text(labelX, totalsY + 41, 'Shipping', 8.5, muted);

    text(
      valueX,
      totalsY + 41,
      shipping === 0 ? 'FREE' : money(shipping),
      8.5,
      ink,
      true,
      'right'
    );

    if (discount > 0) {
      text(
        labelX,
        totalsY + 60,
        clean(order.promo_code, 'Discount'),
        8,
        muted
      );

      text(
        valueX,
        totalsY + 60,
        `-${money(discount)}`,
        8,
        ink,
        true,
        'right'
      );
    }

    line(
      labelX,
      totalsY + 70,
      valueX,
      totalsY + 70,
      accent,
      1.2
    );

    text(
      labelX,
      totalsY + 94,
      isPaid ? 'TOTAL PAID' : 'TOTAL DUE',
      8,
      dark,
      true
    );

    text(
      valueX,
      totalsY + 95,
      money(total),
      13,
      dark,
      true,
      'right'
    );

    // =========================
    // ORDER PROGRESS
    // =========================

    const progressY = Math.max(totalsY + 126, 690);

    text(M, progressY, 'ORDER STATUS', 8.5, dark, true);

    const normalized = status.toLowerCase();

    const placedDone = true;

    const paymentDone =
      [
        'paid',
        'completed',
        'confirmed',
        'processing',
        'shipped',
        'delivered'
      ].includes(paymentStatus.toLowerCase()) ||
      [
        'processing',
        'shipped',
        'delivered',
        'completed'
      ].includes(normalized);

    const deliveredDone =
      normalized.includes('deliver') ||
      normalized === 'completed';

    const xs = [M + 8, 245, 443];

    const labels = [
      'Order Placed',
      'Payment Confirmed',
      'Delivered'
    ];

    const dones = [
      placedDone,
      paymentDone,
      deliveredDone
    ];

    line(
      xs[0],
      progressY + 18,
      xs[2],
      progressY + 18,
      [0.82, 0.87, 0.82],
      1.2
    );

    labels.forEach((label, index) => {
      circle(
        xs[index],
        progressY + 18,
        6,
        dones[index] ? accent : [0.88, 0.90, 0.88]
      );

      text(
        xs[index] + 11,
        progressY + 21,
        label,
        7.2,
        dones[index] ? dark : muted,
        dones[index]
      );
    });
  } else {
    line(
      M,
      790,
      PAGE_W - M,
      790,
      [0.86, 0.90, 0.86],
      1
    );

    text(M, 812, 'Continued on next page', 8.5, dark, true);
  }

  // =========================
  // FOOTER
  // =========================

  line(
    M,
    805,
    PAGE_W - M,
    805,
    [0.86, 0.90, 0.86],
    0.8
  );

  text(M, 822, brand.toUpperCase(), 8, dark, true);

  text(
    PAGE_W - M,
    822,
    clean(store.brand_tagline, 'Thoughtful greens for modern living'),
    7.5,
    muted,
    false,
    'right'
  );

  text(
    M,
    835,
    `For support: ${clean(store.contact_email, '')} ${clean(store.mobile_number, '')}`.slice(0, 78),
    6.7,
    muted
  );

  text(
    PAGE_W - M,
    835,
    `Page ${pageIndex + 1} of ${pageCount}`,
    6.7,
    muted,
    false,
    'right'
  );

  return c.join('\n');
}

// =========================
// BUILD PDF
// =========================

function buildInvoicePdf(order, items, store = {}) {
  const safeOrder = order || {};
  const safeItems = Array.isArray(items) ? items : [];
  const safeStore = store || {};

  const perPage = 7;

  const pageCount = Math.max(
    1,
    Math.ceil(safeItems.length / perPage)
  );

  const streams = Array.from(
    { length: pageCount },
    (_, index) =>
      buildCommands(
        safeOrder,
        safeItems,
        safeStore,
        index,
        pageCount
      )
  );

  const objects = [];

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';

  const pageIds = streams.map(
    (_, index) => 3 + index * 2
  );

  objects[2] =
    `<< /Type /Pages /Kids [` +
    `${pageIds.map((id) => `${id} 0 R`).join(' ')}] ` +
    `/Count ${pageCount} >>`;

  const font1Id = 3 + pageCount * 2;
  const font2Id = font1Id + 1;

  streams.forEach((stream, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;

    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R ` +
      `/MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << ` +
      `/F1 ${font1Id} 0 R ` +
      `/F2 ${font2Id} 0 R ` +
      `>> >> /Contents ${contentId} 0 R >>`;

    objects[contentId] =
      `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\n` +
      `stream\n${stream}\nendstream`;
  });

  objects[font1Id] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  objects[font2Id] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  let output = '%PDF-1.4\n%CityscapeInvoice\n';

  const offsets = [0];

  for (let index = 1; index < objects.length; index++) {
    offsets[index] = Buffer.byteLength(output, 'binary');

    output +=
      `${index} 0 obj\n` +
      `${objects[index]}\n` +
      `endobj\n`;
  }

  const xrefOffset = Buffer.byteLength(output, 'binary');

  output += `xref\n0 ${objects.length}\n`;
  output += '0000000000 65535 f \n';

  for (let index = 1; index < objects.length; index++) {
    output +=
      `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  output +=
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(output, 'binary');
}

module.exports = { buildInvoicePdf };