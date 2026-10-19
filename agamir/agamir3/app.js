(() => {
  "use strict";

  const BN = '"BN Digits", "Anek Bangla", "Hind Siliguri", sans-serif';
  const BN2 = '"BN Digits", "Hind Siliguri", "Anek Bangla", sans-serif';
  const EN = '"Archivo", "Helvetica Neue", Arial, sans-serif';
  const RED = "#ED1C24";
  const STORE = "agamir-photocard-v2";

  const THEMES = [
    { name: "আগামীর সময়", panel: "#000000", accent: "#ED1C24", high: "#FFD400" },
    { name: "সাদা", panel: "#FFFFFF", accent: "#ED1C24", high: "#ED1C24" },
    { name: "নেভি", panel: "#0A1A33", accent: "#ED1C24", high: "#FFD400" },
    { name: "মেরুন", panel: "#3B0A10", accent: "#F2B705", high: "#F2B705" },
    { name: "সবুজ", panel: "#062B1F", accent: "#E8343B", high: "#FFD400" },
    { name: "চারকোল", panel: "#1E1E1E", accent: "#D4A017", high: "#D4A017" }
  ];
  const CATS = ["জাতীয়", "রাজনীতি", "অর্থনীতি", "সারাদেশ", "আন্তর্জাতিক", "খেলা", "বিনোদন", "প্রযুক্তি", "শিক্ষা", "স্বাস্থ্য", "মতামত", "ব্রেকিং"];

  const $ = (id) => document.getElementById(id);
  const cv = $("card"), ctx = cv.getContext("2d");

  const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const defaults = () => ({
    layout: "classic", size: "45", headline: "", sub: "", qName: "", qRole: "", category: "",
    date: todayISO(), showDate: true, bangabda: false, credit: "", fs: 1, align: "center",
    theme: 0, panel: "#000000", accent: RED, high: "#FFD400",
    site: "agamirshomoy.com", footer: "বিস্তারিত কমেন্টে", logoPos: "right",
    zoom: 1, bright: 100, contrast: 100, gray: false
  });
  const state = Object.assign(defaults(), load());
  state.date = todayISO();
  const photos = { 1: { img: null, zoom: 1, ox: 0, oy: 0 }, 2: { img: null, zoom: 1, ox: 0, oy: 0 } };
  let regions = [];

  function load() { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { return {}; } }
  let saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { const { date, ...rest } = state; localStorage.setItem(STORE, JSON.stringify(rest)); } catch (e) {} }, 300); }

  // ---------- Bangla date ----------
  const BD = "০১২৩৪৫৬৭৮৯";
  const bn = (n) => String(n).replace(/\d/g, (d) => BD[d]);
  const DAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
  const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  const BMONTHS = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
  function parseISO(iso) { const [y, m, d] = (iso || todayISO()).split("-").map(Number); return new Date(y, m - 1, d); }
  function bangabda(dt) {
    // বাংলাদেশের সংশোধিত বর্ষপঞ্জি: ১৪ এপ্রিল পহেলা বৈশাখ; প্রথম ৬ মাস ৩১ দিন, পরের ৫ মাস ৩০ (ফাল্গুন অধিবর্ষে ৩০, নইলে ২৯), চৈত্র ৩০
    const y = dt.getFullYear();
    let start = new Date(y, 3, 14), by = y - 593;
    if (dt < start) { start = new Date(y - 1, 3, 14); by = y - 594; }
    const gNext = start.getFullYear() + 1, leap = (gNext % 4 === 0 && gNext % 100 !== 0) || gNext % 400 === 0;
    const len = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, leap ? 30 : 29, 30];
    let days = Math.round((dt - start) / 86400000), m = 0;
    while (m < 11 && days >= len[m]) { days -= len[m]; m++; }
    return `${bn(days + 1)} ${BMONTHS[m]} ${bn(by)}`;
  }
  function dateLabel() {
    const dt = parseISO(state.date);
    let s = `${DAYS[dt.getDay()]}, ${bn(dt.getDate())} ${MONTHS[dt.getMonth()]} ${bn(dt.getFullYear())}`;
    if (state.bangabda) s += `  |  ${bangabda(dt)}`;
    return s;
  }

  // ---------- helpers ----------
  const hexRgb = (h) => { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
  const isLight = (h) => { const [r, g, b] = hexRgb(h); return 0.299 * r + 0.587 * g + 0.114 * b > 165; };
  function dims() { return { "11": [1080, 1080], "45": [1080, 1350], "916": [1080, 1920], "169": [1280, 720] }[state.size] || [1080, 1350]; }

  const logos = { black: new Image(), white: new Image() };
  logos.black.src = "assets/logo-black.png"; logos.white.src = "assets/logo-white.png";
  logos.black.onload = logos.white.onload = () => schedule();

  // ---------- primitives ----------
  function photo(n, x, y, w, h) {
    const p = photos[n];
    regions.push({ n, x, y, w, h });
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (!p.img) {
      ctx.fillStyle = "#3A3A38"; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 2;
      for (let i = -h; i < w; i += 36) { ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); ctx.stroke(); }
      ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = `600 ${Math.min(38, w / 12)}px ${BN2}`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(n === 2 ? "দ্বিতীয় ছবি" : "এখানে ছবি আসবে", x + w / 2, y + h / 2);
      ctx.restore(); ctx.textAlign = "left"; return;
    }
    const s = Math.max(w / p.img.width, h / p.img.height) * p.zoom;
    const dw = p.img.width * s, dh = p.img.height * s;
    const mx = (dw - w) / 2, my = (dh - h) / 2;
    p.ox = Math.max(-mx, Math.min(mx, p.ox)); p.oy = Math.max(-my, Math.min(my, p.oy));
    if (state.bright !== 100 || state.contrast !== 100 || state.gray) {
      ctx.filter = `brightness(${state.bright}%) contrast(${state.contrast}%)${state.gray ? " grayscale(1)" : ""}`;
    }
    ctx.drawImage(p.img, x + (w - dw) / 2 + p.ox, y + (h - dh) / 2 + p.oy, dw, dh);
    ctx.filter = "none";
    ctx.restore();
  }

  // logo straight on the photo (no plate): white wordmark + soft shadow so it reads on any photo
  function logoPlate(side, y, h, W, onPhoto) {
    const img = onPhoto ? logos.white : (isLight(state.panel) ? logos.black : logos.white);
    if (!img.complete || !img.naturalWidth) return;
    const lw = h * img.naturalWidth / img.naturalHeight;
    ctx.save();
    if (onPhoto) { ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = h * 0.35; ctx.shadowOffsetY = h * 0.04; }
    ctx.drawImage(img, side === "right" ? W - lw - 44 : 44, y, lw, h);
    ctx.restore();
  }
  // darkens the top of a photo a little so the logo and labels stay readable
  function topShade(W, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(0,0,0,.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, h);
  }

  function wedge(x, y, size, dir, color) {
    ctx.fillStyle = color || state.accent; ctx.beginPath();
    if (dir === "down-right") { ctx.moveTo(x, y); ctx.lineTo(x + size * 1.6, y); ctx.lineTo(x, y + size); }
    else { ctx.moveTo(x, y + size); ctx.lineTo(x + size * 1.6, y + size); ctx.lineTo(x, y); }
    ctx.closePath(); ctx.fill();
  }

  function chip(text, x, y, h, bg, fg, alignRight, font) {
    ctx.font = font || `700 ${Math.round(h * 0.5)}px ${BN}`;
    ctx.textBaseline = "middle";
    const pad = h * 0.45, w = ctx.measureText(text).width + pad * 2;
    const sx = alignRight ? x - w : x;
    ctx.fillStyle = bg; ctx.fillRect(sx, y, w, h);
    ctx.fillStyle = fg; ctx.textAlign = "left"; ctx.fillText(text, sx + pad, y + h * 0.56);
    return { x: sx, w };
  }

  function tokens(text) {
    const out = [];
    text.split("\n").forEach((para, pi) => {
      if (pi > 0) out.push({ br: true });
      let unit = null;
      para.split("*").forEach((seg, si) => {
        const hl = si % 2 === 1;
        seg.split(/(\s+)/).forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { if (unit) { out.push(unit); unit = null; } return; }
          if (!unit) unit = { pieces: [] };
          unit.pieces.push({ t: p, hl });
        });
      });
      if (unit) out.push(unit);
    });
    return out;
  }
  function wrap(toks, fs, maxW, weight) {
    ctx.font = `${weight} ${fs}px ${BN}`;
    const sp = ctx.measureText(" ").width, lines = []; let cur = [], cw = 0;
    for (const tk of toks) {
      if (tk.br) { lines.push({ words: cur, w: cw }); cur = []; cw = 0; continue; }
      const pieces = tk.pieces.map((p) => ({ ...p, w: ctx.measureText(p.t).width }));
      const w = pieces.reduce((a, p) => a + p.w, 0), add = cur.length ? sp + w : w;
      if (cur.length && cw + add > maxW) { lines.push({ words: cur, w: cw }); cur = [{ pieces, w }]; cw = w; }
      else { cur.push({ pieces, w }); cw += add; }
    }
    if (cur.length) lines.push({ words: cur, w: cw });
    return { lines, sp };
  }
  // fits text into box; returns block metrics
  function text(str, box, o) {
    const weight = o.weight || 800, LH = o.lh || 1.3, align = o.align || state.align;
    const toks = tokens((str || "").trim() || o.placeholder || "");
    const ph = !(str || "").trim();
    let fs = Math.round(o.max * (o.noScale ? 1 : state.fs) * (story() ? 1.15 : 1)), res;
    for (; fs >= o.min; fs -= 2) { res = wrap(toks, fs, box.w, weight); if (res.lines.length <= (o.maxLines || 6) && res.lines.length * fs * LH <= box.h) break; }
    if (fs < o.min) { fs = o.min; res = wrap(toks, fs, box.w, weight); }
    const lh = fs * LH, blockH = res.lines.length * lh;
    let top = box.y;
    if (o.valign === "middle") top = box.y + (box.h - blockH) / 2;
    if (o.valign === "bottom") top = box.y + box.h - blockH;
    ctx.font = `${weight} ${fs}px ${BN}`; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    res.lines.forEach((ln, i) => {
      let x = align === "center" ? box.x + (box.w - ln.w) / 2 : box.x;
      const y = top + i * lh + fs * 0.98;
      ln.words.forEach((wd) => {
        let px = x;
        wd.pieces.forEach((p) => { ctx.fillStyle = ph ? rgba(o.color, 0.4) : (p.hl ? o.high : o.color); ctx.fillText(p.t, px, y); px += p.w; });
        x += wd.w + res.sp;
      });
    });
    return { top, blockH, fs, bottom: top + blockH };
  }
  function oneLine(str, x, y, maxW, size, color, align, font) {
    if (!str) return;
    let fs = size; ctx.font = `${font || "600"} ${fs}px ${BN2}`;
    while (ctx.measureText(str).width > maxW && fs > 16) { fs -= 1; ctx.font = `${font || "600"} ${fs}px ${BN2}`; }
    ctx.fillStyle = color; ctx.textBaseline = "middle"; ctx.textAlign = align || "left";
    ctx.fillText(str, x, y); ctx.textAlign = "left";
  }
  function footer(W, H, dark, pad) {
    pad = pad || 56;
    const y = H - (state.size === "916" ? 210 : 70), fg = dark ? "rgba(255,255,255,.82)" : "#333330";
    ctx.fillStyle = dark ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.14)"; ctx.fillRect(pad, y - 34, W - pad * 2, 2);
    ctx.font = `700 26px ${EN}`; ctx.fillStyle = fg; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "1px";
    ctx.fillText(state.site.trim(), pad, y);
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "0px";
    if (state.footer.trim()) oneLine(state.footer.trim(), W - pad, y + 2, W / 2 - pad, 28, fg, "right");
  }
  function credit(x, y, W, onDark) {
    if (!state.credit.trim()) return;
    ctx.font = `600 22px ${BN2}`; const w = ctx.measureText(state.credit.trim()).width + 24;
    ctx.fillStyle = onDark === false ? "rgba(255,255,255,.85)" : "rgba(0,0,0,.55)"; ctx.fillRect(x - w, y - 34, w, 34);
    ctx.fillStyle = onDark === false ? "#000" : "#fff"; ctx.textBaseline = "middle"; ctx.fillText(state.credit.trim(), x - w + 12, y - 16);
  }
  const textCol = () => isLight(state.panel) ? "#000000" : "#FFFFFF";
  const subCol = () => isLight(state.panel) ? "#3A3A37" : "rgba(255,255,255,.78)";
  const story = () => state.size === "916";
  const land = () => state.size === "169";

  // ---------- layouts ----------
  function classic(W, H) {
    ctx.fillStyle = state.panel; ctx.fillRect(0, 0, W, H);
    if (land()) {
      const pw = Math.round(W * 0.52);
      photo(1, 0, 0, pw, H); topShade(pw, 200); credit(pw - 12, H - 12, W);
      wedge(pw, 0, 70, "down-right");
      logoPlate("left", 28, 70, W, true);
      const tx = pw + 56, tw = W - pw - 96;
      let top = 120;
      if (state.category.trim()) chip(state.category.trim(), tx, 70, 50, state.accent, "#fff");
      if (state.showDate) oneLine(dateLabel(), tx, H - 110, tw, 24, subCol());
      const b = text(state.headline, { x: tx, y: top + 30, w: tw, h: H - top - 200 }, { max: 62, min: 30, valign: "middle", align: "left", color: textCol(), high: state.high, placeholder: "শিরোনাম এখানে দেখাবে" });
      if (state.sub.trim()) oneLine(state.sub.trim(), tx, b.bottom + 34, tw, 26, subCol());
      ctx.font = `700 22px ${EN}`; ctx.fillStyle = subCol(); ctx.textBaseline = "middle"; ctx.fillText(state.site.trim(), tx, H - 60);
      return;
    }
    const photoH = Math.round(H * (story() ? 0.5 : state.size === "11" ? 0.56 : 0.58));
    photo(1, 0, 0, W, photoH); topShade(W, story() ? 520 : 260); credit(W - 16, photoH - 14, W);
    ctx.fillStyle = state.accent; ctx.fillRect(0, photoH, W, 8);
    wedge(0, photoH + 8, 60, "down-right");
    const topY = story() ? 230 : 40;
    logoPlate(state.logoPos, topY, 92, W, true);
    if (state.category.trim()) chip(state.category.trim(), state.logoPos === "right" ? 40 : W - 40, topY + 22, 64, state.accent, "#fff", state.logoPos !== "right");
    let boxTop = photoH + 60;
    if (state.showDate) {
      ctx.font = `600 26px ${BN2}`; const w = ctx.measureText(dateLabel()).width + 48;
      chip(dateLabel(), (W - w) / 2, photoH - 24, 52, state.accent, "#fff", false, `600 26px ${BN2}`);
      boxTop = photoH + 76;
    }
    const subH = state.sub.trim() ? 56 : 0, bottom = H - (story() ? 280 : 120) - subH;
    const b = text(state.headline, { x: 70, y: boxTop, w: W - 140, h: bottom - boxTop }, { max: 80, min: 38, valign: "middle", color: textCol(), high: state.high, placeholder: "শিরোনাম এখানে দেখাবে" });
    if (subH) oneLine(state.sub.trim(), state.align === "center" ? W / 2 : 70, b.bottom + 36, W - 140, 30, subCol(), state.align === "center" ? "center" : "left");
    footer(W, H, !isLight(state.panel));
  }

  function full(W, H) {
    ctx.fillStyle = state.panel; ctx.fillRect(0, 0, W, H);
    photo(1, 0, 0, W, H);
    const g = ctx.createLinearGradient(0, H * 0.28, 0, H * 0.7);
    g.addColorStop(0, rgba(state.panel, 0)); g.addColorStop(0.6, rgba(state.panel, 0.82)); g.addColorStop(1, rgba(state.panel, 0.97));
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.28, W, H * 0.42);
    ctx.fillStyle = rgba(state.panel, 0.97); ctx.fillRect(0, H * 0.7 - 1, W, H * 0.3 + 1);
    topShade(W, story() ? 520 : 280);
    const topY = story() ? 230 : 40;
    logoPlate(state.logoPos, topY, land() ? 64 : 92, W, true);
    if (state.category.trim()) chip(state.category.trim(), state.logoPos === "right" ? 40 : W - 40, topY + 22, 62, state.accent, "#fff", state.logoPos !== "right");
    const pad = land() ? 64 : 70, bottom = H - (story() ? 290 : land() ? 96 : 140), subH = state.sub.trim() ? 52 : 0;
    const boxH = H * (land() ? 0.42 : 0.33);
    const b = text(state.headline, { x: pad + 34, y: bottom - boxH - subH, w: W - pad * 2 - 34, h: boxH }, { max: land() ? 60 : 82, min: 34, valign: "bottom", align: "left", color: textCol(), high: state.high, placeholder: "শিরোনাম এখানে দেখাবে" });
    ctx.fillStyle = state.accent; ctx.fillRect(pad, b.top + 6, 12, b.blockH - 4);
    if (state.showDate) chip(dateLabel(), pad, b.top - 78, 50, state.accent, "#fff", false, `600 25px ${BN2}`);
    if (subH) oneLine(state.sub.trim(), pad + 34, b.bottom + 32, W - pad * 2 - 34, 28, subCol());
    credit(W - 16, b.top - 96, W);
    if (land()) { ctx.font = `700 22px ${EN}`; ctx.fillStyle = subCol(); ctx.textBaseline = "middle"; ctx.fillText(state.site.trim(), pad, H - 48); }
    else footer(W, H, !isLight(state.panel));
  }

  function white(W, H) {
    const bg = isLight(state.panel) ? state.panel : "#FFFFFF";
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = state.accent; ctx.fillRect(0, 0, W, 12);
    const m = 48;
    if (land()) {
      const pw = Math.round(W * 0.5);
      photo(1, m, m, pw - m, H - m * 2); credit(pw - 12, H - m - 12, W);
      wedge(m, H - m - 70, 70, "up-right");
      const tx = pw + 48, tw = W - tx - m;
      drawLogoInline(tx, m + 10, 64);
      if (state.category.trim()) chip(state.category.trim(), tx, m + 100, 46, state.accent, "#fff");
      const b = text(state.headline, { x: tx, y: m + 170, w: tw, h: H - m * 2 - 260 }, { max: 58, min: 28, valign: "middle", align: "left", color: "#000", high: state.high === "#FFD400" ? RED : state.high, placeholder: "শিরোনাম এখানে দেখাবে" });
      if (state.sub.trim()) oneLine(state.sub.trim(), tx, b.bottom + 30, tw, 24, "#3A3A37");
      if (state.showDate) oneLine(dateLabel(), tx, H - m - 20, tw, 22, "#5C5C57");
      return;
    }
    const top = story() ? 220 : m + 14, ph = Math.round((W - m * 2) * (story() ? 0.95 : state.size === "11" ? 0.52 : 0.62));
    photo(1, m, top, W - m * 2, ph); credit(W - m - 12, top + ph - 12, W);
    wedge(m, top + ph - 64, 64, "up-right");
    let y = top + ph + 44;
    if (state.category.trim() || state.showDate) {
      ctx.textBaseline = "middle";
      let x = m;
      if (state.category.trim()) {
        ctx.fillStyle = state.accent; ctx.fillRect(x, y - 3, 34, 6); x += 46;
        ctx.font = `700 30px ${BN}`; ctx.fillStyle = state.accent; ctx.fillText(state.category.trim(), x, y + 2); x += ctx.measureText(state.category.trim()).width + 28;
      }
      if (state.showDate) { ctx.font = `600 25px ${BN2}`; ctx.fillStyle = "#5C5C57"; ctx.fillText(dateLabel(), x, y + 2); }
      y += 46;
    }
    const footY = H - (story() ? 300 : 150), subH = state.sub.trim() ? 52 : 0;
    const b = text(state.headline, { x: m, y, w: W - m * 2, h: footY - y - subH - 10 }, { max: 76, min: 36, valign: story() ? "middle" : "top", align: "left", color: "#000", high: state.high === "#FFD400" ? RED : state.high, placeholder: "শিরোনাম এখানে দেখাবে" });
    if (subH) oneLine(state.sub.trim(), m, b.bottom + 30, W - m * 2, 28, "#3A3A37");
    ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(m, footY + 18, W - m * 2, 2);
    drawLogoInline(m, footY + 44, 66);
    ctx.font = `700 25px ${EN}`; ctx.fillStyle = "#333330"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillText(state.site.trim(), W - m, footY + 62); ctx.textAlign = "left";
    if (state.footer.trim()) oneLine(state.footer.trim(), W - m, footY + 98, W / 2, 24, "#5C5C57", "right");
  }
  function drawLogoInline(x, y, h) {
    const img = logos.black; if (!img.naturalWidth) return;
    ctx.drawImage(img, x, y, h * img.naturalWidth / img.naturalHeight, h);
  }

  function breaking(W, H) {
    ctx.fillStyle = state.panel; ctx.fillRect(0, 0, W, H);
    const bandY = story() ? 200 : 0, bandH = land() ? 110 : 150;
    const band = () => {
      ctx.fillStyle = state.accent; ctx.fillRect(0, bandY, W, bandH);
      ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.moveTo(W * 0.62, bandY); ctx.lineTo(W, bandY); ctx.lineTo(W, bandY + bandH); ctx.lineTo(W * 0.62 - 60, bandY + bandH); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(70, bandY + bandH / 2, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(70, bandY + bandH / 2, 24, 0, Math.PI * 2); ctx.stroke();
      ctx.font = `800 ${land() ? 54 : 70}px ${BN}`; ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
      ctx.fillText(state.category.trim() || "ব্রেকিং নিউজ", 116, bandY + bandH / 2 + 6);
      const img = logos.white;
      if (img.naturalWidth) { const lh = bandH * 0.52; ctx.drawImage(img, W - 40 - lh * img.naturalWidth / img.naturalHeight, bandY + (bandH - lh) / 2, lh * img.naturalWidth / img.naturalHeight, lh); }
    };
    if (land()) {
      const pw = Math.round(W * 0.5);
      band();
      photo(1, 0, bandH, pw, H - bandH); credit(pw - 12, H - 12, W);
      const tx = pw + 50, tw = W - tx - 50;
      const b = text(state.headline, { x: tx, y: bandH + 40, w: tw, h: H - bandH - 140 }, { max: 58, min: 28, valign: "middle", align: "left", color: textCol(), high: state.high, placeholder: "ব্রেকিং শিরোনাম এখানে" });
      if (state.showDate) oneLine(dateLabel(), tx, H - 50, tw, 22, subCol());
      return;
    }
    const photoTop = bandY + bandH, photoH = Math.round(H * (story() ? 0.36 : state.size === "11" ? 0.4 : 0.44));
    if (story()) photo(1, 0, 0, W, photoTop + photoH); else photo(1, 0, photoTop, W, photoH);
    band();
    credit(W - 16, photoTop + photoH - 14, W);
    ctx.fillStyle = state.accent; ctx.fillRect(0, photoTop + photoH, W, 8);
    let top = photoTop + photoH + 50;
    if (state.showDate) { oneLine(dateLabel(), state.align === "center" ? W / 2 : 70, top, W - 140, 26, subCol(), state.align === "center" ? "center" : "left"); top += 30; }
    const subH = state.sub.trim() ? 52 : 0, bottom = H - (story() ? 280 : 120) - subH;
    const b = text(state.headline, { x: 70, y: top, w: W - 140, h: bottom - top }, { max: 80, min: 36, valign: "middle", color: textCol(), high: state.high, placeholder: "ব্রেকিং শিরোনাম এখানে" });
    if (subH) oneLine(state.sub.trim(), state.align === "center" ? W / 2 : 70, b.bottom + 34, W - 140, 28, subCol(), state.align === "center" ? "center" : "left");
    footer(W, H, !isLight(state.panel));
  }

  function quote(W, H) {
    ctx.fillStyle = state.panel; ctx.fillRect(0, 0, W, H);
    const dark = !isLight(state.panel);
    const pw = land() ? Math.round(W * 0.38) : Math.round(W * 0.5);
    const ph = land() ? H : Math.round(H * (story() ? 0.52 : 0.52));
    const px = W - pw, py = 0;
    photo(1, px, py, pw, ph);
    const gg = ctx.createLinearGradient(px, 0, px + 160, 0); gg.addColorStop(0, rgba(state.panel, 1)); gg.addColorStop(1, rgba(state.panel, 0));
    ctx.fillStyle = gg; ctx.fillRect(px - 1, py, 161, ph);
    wedge(px, py + ph - 70, 70, "up-right");
    const tx = land() ? 60 : 70, tw = land() ? W - pw - 110 : W - 140;
    const topY = land() ? 34 : story() ? 230 : 44;
    const img = dark ? logos.white : logos.black;
    if (img.naturalWidth) { const lh = land() ? 50 : 76; ctx.drawImage(img, tx, topY, lh * img.naturalWidth / img.naturalHeight, lh); }
    ctx.font = `800 ${land() ? 200 : 300}px Georgia, serif`; ctx.fillStyle = state.accent; ctx.textBaseline = "alphabetic";
    const qy = land() ? 270 : ph + (story() ? 260 : 210);
    ctx.fillText("“", tx - 14, qy);
    const boxTop = land() ? 200 : qy - 110, footY = H - (story() ? 300 : land() ? 120 : 190);
    const b = text(state.headline, { x: tx, y: boxTop, w: land() ? tw : W - 140, h: footY - boxTop - 60 }, { max: land() ? 52 : 70, min: 30, weight: 700, lh: 1.35, valign: "middle", align: "left", color: textCol(), high: state.high, placeholder: "উক্তি এখানে লিখুন" });
    const ny = Math.min(footY, b.bottom + 70);
    ctx.fillStyle = state.accent; ctx.fillRect(tx, ny - 22, 54, 6);
    oneLine(state.qName.trim() || "বক্তার নাম", tx + 72, ny - 18, (land() ? tw : W - 140) - 72, land() ? 30 : 36, textCol(), "left", "700");
    if (state.qRole.trim()) oneLine(state.qRole.trim(), tx + 72, ny + 26, (land() ? tw : W - 140) - 72, land() ? 22 : 26, subCol());
    if (state.showDate && !land()) { ctx.fillStyle = state.accent; ctx.fillRect(tx, topY + 112, 40, 5); oneLine(dateLabel(), tx, topY + 150, W - pw - tx - 40, 25, subCol()); }
    if (!land()) footer(W, H, dark);
  }

  function split(W, H) {
    ctx.fillStyle = state.panel; ctx.fillRect(0, 0, W, H);
    const top = 0;
    const ph = land() ? Math.round(H * 0.62) : Math.round(H * (story() ? 0.54 : state.size === "11" ? 0.54 : 0.56));
    const half = W / 2;
    photo(1, 0, top, half - 4, ph); photo(2, half + 4, top, half - 4, ph); topShade(W, story() ? 520 : 240);
    ctx.fillStyle = state.accent; ctx.fillRect(half - 4, top, 8, ph); ctx.fillRect(0, top + ph, W, 8);
    wedge(0, top + ph + 8, 56, "down-right");
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(half, top + ph / 2, 38, 0, Math.PI * 2); ctx.fill();
    ctx.font = `800 30px ${BN}`; ctx.fillStyle = state.accent; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("বনাম", half, top + ph / 2 + 3); ctx.textAlign = "left";
    logoPlate(state.logoPos, (story() ? 230 : 36), land() ? 60 : 88, W, true);
    if (state.category.trim()) chip(state.category.trim(), state.logoPos === "right" ? 40 : W - 40, (story() ? 246 : 52), 56, state.accent, "#fff", state.logoPos !== "right");
    credit(W - 16, top + ph - 14, W);
    let boxTop = top + ph + (land() ? 30 : 56);
    if (state.showDate && !land()) { oneLine(dateLabel(), state.align === "center" ? W / 2 : 70, boxTop + 6, W - 140, 25, subCol(), state.align === "center" ? "center" : "left"); boxTop += 34; }
    const bottom = H - (story() ? 280 : land() ? 30 : 120);
    text(state.headline, { x: 70, y: boxTop, w: W - 140, h: bottom - boxTop }, { max: land() ? 50 : 76, min: 28, valign: "middle", color: textCol(), high: state.high, placeholder: "শিরোনাম এখানে দেখাবে" });
    if (!land()) footer(W, H, !isLight(state.panel));
  }

  const LAYOUTS = { classic, full, white, breaking, quote, split };

  // ---------- render ----------
  let raf = 0;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }
  function render() {
    const [W, H] = dims();
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    regions = [];
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = "left"; ctx.filter = "none";
    (LAYOUTS[state.layout] || classic)(W, H);
    document.body.classList.toggle("is-quote", state.layout === "quote");
    document.body.classList.toggle("is-split", state.layout === "split");
    $("headlineLabel").textContent = state.layout === "quote" ? "উক্তি" : "শিরোনাম";
  }

  // ---------- photos ----------
  function loadPhoto(file, n) {
    if (!file || !file.type || !file.type.startsWith("image/")) { toast("এটা ছবি না। JPG, PNG বা WebP দিন।", true); return; }
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      photos[n] = { img: im, zoom: 1, ox: 0, oy: 0 };
      if (n === 1) { $("zoom").value = 1; $("drop1Text").textContent = "অন্য ছবি দিতে চাপুন"; }
      else $("drop2Text").textContent = "অন্য দ্বিতীয় ছবি দিন";
      schedule();
    };
    im.onerror = () => toast("ছবিটা খোলা যায়নি। অন্য ছবি দিন।", true);
    im.src = url;
  }
  function loadPhotoUrl(url) {
    const im = new Image(); im.crossOrigin = "anonymous";
    im.onload = () => { photos[1] = { img: im, zoom: 1, ox: 0, oy: 0 }; schedule(); };
    im.onerror = () => toast("লিংকের ছবিটা আনা যায়নি; ছবিটা নামিয়ে এখানে দিন।", true);
    im.src = url;
  }
  $("file1").addEventListener("change", (e) => loadPhoto(e.target.files[0], 1));
  $("file2").addEventListener("change", (e) => loadPhoto(e.target.files[0], 2));

  const stage = $("stage");
  ["dragenter", "dragover"].forEach((ev) => stage.addEventListener(ev, (e) => { e.preventDefault(); stage.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((ev) => stage.addEventListener(ev, (e) => { e.preventDefault(); stage.classList.remove("dragging"); }));
  stage.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files[0]; if (!f) return;
    const r = cv.getBoundingClientRect(), k = cv.width / r.width, x = (e.clientX - r.left) * k;
    loadPhoto(f, state.layout === "split" && x > cv.width / 2 ? 2 : 1);
  });
  document.addEventListener("paste", (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
    if (item) { e.preventDefault(); loadPhoto(item.getAsFile(), state.layout === "split" && photos[1].img && !photos[2].img ? 2 : 1); toast("ছবি পেস্ট হয়েছে"); }
  });

  // drag to reposition inside the frame; wheel to zoom
  let drag = null;
  function hit(e) {
    const r = cv.getBoundingClientRect(), k = cv.width / r.width, x = (e.clientX - r.left) * k, y = (e.clientY - r.top) * k;
    for (let i = regions.length - 1; i >= 0; i--) { const g = regions[i]; if (x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h) return { g, k }; }
    return null;
  }
  cv.addEventListener("pointerdown", (e) => {
    const h = hit(e); if (!h || !photos[h.g.n].img) return;
    drag = { n: h.g.n, x: e.clientX, y: e.clientY, ox: photos[h.g.n].ox, oy: photos[h.g.n].oy, k: h.k };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", (e) => { if (!drag) return; const p = photos[drag.n]; p.ox = drag.ox + (e.clientX - drag.x) * drag.k; p.oy = drag.oy + (e.clientY - drag.y) * drag.k; schedule(); });
  const end = () => { drag = null; };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  cv.addEventListener("wheel", (e) => {
    const h = hit(e); if (!h || !photos[h.g.n].img) return;
    e.preventDefault(); const p = photos[h.g.n];
    p.zoom = Math.min(3, Math.max(1, p.zoom - e.deltaY * 0.0015));
    if (h.g.n === 1) $("zoom").value = p.zoom;
    schedule();
  }, { passive: false });

  $("zoom").addEventListener("input", (e) => { photos[1].zoom = +e.target.value; schedule(); });
  $("resetPhoto").addEventListener("click", () => {
    [1, 2].forEach((n) => Object.assign(photos[n], { zoom: 1, ox: 0, oy: 0 }));
    Object.assign(state, { bright: 100, contrast: 100, gray: false });
    $("zoom").value = 1; $("bright").value = 100; $("contrast").value = 100; $("gray").checked = false; save(); schedule();
  });
  $("removePhoto").addEventListener("click", () => {
    photos[1] = { img: null, zoom: 1, ox: 0, oy: 0 }; photos[2] = { img: null, zoom: 1, ox: 0, oy: 0 };
    $("file1").value = ""; $("file2").value = ""; $("drop1Text").textContent = "ছবি বেছে নিন"; $("drop2Text").textContent = "দ্বিতীয় ছবি বেছে নিন"; schedule();
  });

  // ---------- controls ----------
  function seg(id, key) {
    const el = $(id);
    const sync = () => el.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.v === String(state[key])));
    el.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; state[key] = b.dataset.v; sync(); save(); schedule(); });
    sync();
  }
  seg("layouts", "layout"); seg("sizes", "size"); seg("align", "align"); seg("logoPos", "logoPos");

  function bindText(id, key) { const el = $(id); el.value = state[key] ?? ""; el.addEventListener("input", () => { state[key] = el.value; if (key === "category") syncChips(); save(); schedule(); }); }
  ["headline", "sub", "qName", "qRole", "category", "credit", "site", "footer"].forEach((k) => bindText(k, k));
  function bindCheck(id, key) { const el = $(id); el.checked = !!state[key]; el.addEventListener("change", () => { state[key] = el.checked; save(); schedule(); }); }
  ["showDate", "bangabda", "gray"].forEach((k) => bindCheck(k, k));
  function bindRange(id, key) { const el = $(id); el.value = state[key]; el.addEventListener("input", () => { state[key] = +el.value; save(); schedule(); }); }
  bindRange("fs", "fs"); bindRange("bright", "bright"); bindRange("contrast", "contrast");
  $("date").value = state.date;
  $("date").addEventListener("input", (e) => { state.date = e.target.value || todayISO(); schedule(); });

  const chips = $("chips");
  CATS.forEach((c) => { const b = document.createElement("button"); b.type = "button"; b.textContent = c; b.addEventListener("click", () => { state.category = state.category === c ? "" : c; $("category").value = state.category; syncChips(); save(); schedule(); }); chips.appendChild(b); });
  function syncChips() { chips.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.textContent === state.category.trim())); }
  syncChips();

  const themes = $("themes");
  THEMES.forEach((t, i) => {
    const b = document.createElement("button"); b.type = "button"; b.title = t.name; b.setAttribute("aria-label", t.name);
    b.innerHTML = `<i style="background:${t.panel}"></i><i style="background:${t.accent}"></i><i style="background:${t.high}"></i>`;
    b.addEventListener("click", () => { Object.assign(state, { theme: i, panel: t.panel, accent: t.accent, high: t.high }); syncColors(); save(); schedule(); });
    themes.appendChild(b);
  });
  function syncColors() {
    $("cPanel").value = state.panel; $("cAccent").value = state.accent; $("cHigh").value = state.high;
    themes.querySelectorAll("button").forEach((b, i) => { const t = THEMES[i]; b.classList.toggle("on", t.panel.toLowerCase() === state.panel.toLowerCase() && t.accent.toLowerCase() === state.accent.toLowerCase() && t.high.toLowerCase() === state.high.toLowerCase()); });
  }
  [["cPanel", "panel"], ["cAccent", "accent"], ["cHigh", "high"]].forEach(([id, key]) => $(id).addEventListener("input", (e) => { state[key] = e.target.value; syncColors(); save(); schedule(); }));
  syncColors();

  $("newCard").addEventListener("click", () => {
    Object.assign(state, { headline: "", sub: "", qName: "", qRole: "", category: "", credit: "", date: todayISO() });
    ["headline", "sub", "qName", "qRole", "category", "credit"].forEach((k) => ($(k).value = ""));
    $("date").value = state.date; syncChips();
    $("removePhoto").click(); save(); schedule(); $("headline").focus();
  });

  // ---------- export ----------
  function fileName(ext) {
    const words = (state.headline || "card").replace(/\*/g, "").replace(/[\\/:*?"<>|\n]/g, " ").trim().split(/\s+/).slice(0, 5).join("-");
    return `agamir-shomoy-${state.date}-${words || "card"}.${ext}`;
  }
  function download(type, ext, q) {
    render();
    cv.toBlob((blob) => {
      if (!blob) { toast("ছবি বানানো যায়নি। লিংক থেকে আনা ছবি হলে ছবিটা নামিয়ে আবার দিন।", true); return; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fileName(ext);
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast("ডাউনলোড হয়েছে");
    }, type, q);
  }
  $("dlPng").addEventListener("click", () => download("image/png", "png"));
  $("dlJpg").addEventListener("click", () => download("image/jpeg", "jpg", 0.92));
  $("copyImg").addEventListener("click", async () => {
    try {
      render();
      const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast("কপি হয়েছে, এখন ফেসবুকে Ctrl+V দিয়ে পেস্ট করুন");
    } catch (e) { toast("এই ব্রাউজারে কপি হয় না; ডাউনলোড বাটন ব্যবহার করুন।", true); }
  });
  document.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); download("image/png", "png"); } });

  let toastT = 0;
  function toast(msg, err) { const t = $("toast"); t.textContent = msg; t.style.color = err ? "#C8141B" : "#0a7a2f"; clearTimeout(toastT); toastT = setTimeout(() => (t.textContent = ""), 3500); }

  // ---------- URL prefill: ?title=…&cat=…&sub=…&img=… ----------
  const q = new URLSearchParams(location.search);
  if (q.get("title")) { state.headline = q.get("title"); $("headline").value = state.headline; }
  if (q.get("sub")) { state.sub = q.get("sub"); $("sub").value = state.sub; }
  if (q.get("cat")) { state.category = q.get("cat"); $("category").value = state.category; syncChips(); }
  if (q.get("img")) loadPhotoUrl(q.get("img"));

  Promise.all([
    document.fonts.load(`800 60px "BN Digits"`, "১২৩৪৫৬৭৮৯০"),
    document.fonts.load(`600 30px "BN Digits"`, "১২৩৪৫৬৭৮৯০"),
    document.fonts.load(`800 60px "Anek Bangla"`, "আগামীর সময়"),
    document.fonts.load(`700 60px "Anek Bangla"`, "উক্তি"),
    document.fonts.load(`600 30px "Hind Siliguri"`, "তারিখ"),
    document.fonts.load(`700 26px "Archivo"`, "agamirshomoy.com")
  ]).catch(() => {}).finally(schedule);
  schedule();
})();
