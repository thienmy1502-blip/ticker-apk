/* pine.js - bo chay Pine Script (tap con, v4/v5) bang JavaScript.
   Pine.run(source, bars) -> {meta, plots, markers, hlines}
   bars: [{time, open, high, low, close, vol}, ...]
   Ho tro: bien, var, :=, +=, if/else, for, ?:, and/or/not, x[n], input.*,
           ta.sma/ema/rma/rsi/atr/highest/lowest/stdev/sum/change/crossover/crossunder,
           math.*, plot, plotshape, plotchar, hline, color.*
   Chua ho tro: strategy.*, ham tu dinh nghia (=>), label/line/box, array, request.security, ta.macd/bb (tuple). */
(function (root) {
"use strict";
const COLORS = { red: "#ef2d4a", green: "#22c55e", blue: "#3b82f6", orange: "#fb923c", yellow: "#f5c518", aqua: "#22d3ee",
  white: "#ffffff", black: "#000000", gray: "#8a8a93", silver: "#c0c0c0", purple: "#a855f7", lime: "#84cc16",
  teal: "#14b8a6", maroon: "#9f1239", navy: "#1e3a8a", olive: "#808000", fuchsia: "#d946ef" };
const rgba = (r, g, b, t) => `rgba(${r},${g},${b},${((100 - (t || 0)) / 100).toFixed(2)})`;
const COL = Object.assign({}, COLORS, {
  new(c, t) {
    const m = /^#([0-9a-f]{6})/i.exec(c || "");
    if (!m) return c;
    const h = m[1];
    return rgba(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), t);
  },
  rgb: (r, g, b, t) => rgba(r, g, b, t),
});

/* ---------- runtime ---------- */
let I = 0, S = null, B = null, meta = null, plots = null, markers = null, hlines = null, OBJS = [], TABLES = [], BG = [], BARC = [], ALRT = [], ADEF = {}, INPUTS = {}, OVR = {};
const RT = { n: 0, lastOpen: false };
const H = (a, i, k) => { const x = i - k; return x >= 0 ? a[x] : NaN; };
const NZ = (x, r) => (x === x && x != null ? x : r === undefined ? 0 : r);
const ISNA = x => x !== x;
const AVG = (...a) => a.reduce((s, x) => s + x, 0) / a.length;
const K = n => ({ __k: n });
function PA(a) {
  const pos = [], named = {};
  for (let j = 0; j < a.length; j++) {
    if (a[j] && a[j].__k) named[a[j].__k] = a[++j]; else pos.push(a[j]);
  }
  return { pos, named };
}
const INP = (id, kind, ...a) => {
  const { pos, named } = PA(a);
  const def = named.defval !== undefined ? named.defval : pos[0];
  let t = kind.replace("input.", "");
  if (t === "input") t = typeof def === "boolean" ? "bool" : typeof def === "string" ? (/^(#|rgba)/.test(def) ? "color" : "string") : "float";
  const rec = INPUTS[id] || (INPUTS[id] = { id, type: t, def, title: String(named.title !== undefined ? named.title : typeof pos[1] === "string" ? pos[1] : "input " + id), min: named.minval, max: named.maxval, step: named.step, group: typeof named.group === "string" ? named.group : "" });
  let v = def;
  if (t !== "source" && OVR[id] !== undefined && OVR[id] !== null) {
    v = OVR[id];
    if (t === "int") v = Math.round(+v); else if (t === "float") v = +v; else if (t === "bool") v = !!v;
  }
  rec.val = v;
  return v === undefined ? NaN : v;
};

const st = id => S[id] || (S[id] = {});
const win = (id, x) => { const s = st(id); return s.a || (s.a = []), (s.a[I] = x), s.a; };
function ma(s, x, len, alpha) {          // RMA/seed bang SMA
  if (x !== x) return NaN;
  s.n = (s.n || 0) + 1;
  if (s.n <= len) { s.s = (s.s || 0) + x; if (s.n === len) { s.v = s.s / len; return s.v; } return NaN; }
  s.v = alpha * x + (1 - alpha) * s.v;
  return s.v;
}
const TA = {
  sma(id, x, len) { const a = win(id, x); if (I < len - 1) return NaN; let t = 0; for (let k = I - len + 1; k <= I; k++) { const y = a[k]; if (y !== y) return NaN; t += y; } return t / len; },
  sum(id, x, len) { const a = win(id, x); if (I < len - 1) return NaN; let t = 0; for (let k = I - len + 1; k <= I; k++) t += a[k]; return t; },
  highest(id, x, len) { const a = win(id, x); if (I < len - 1) return NaN; let m = -Infinity; for (let k = I - len + 1; k <= I; k++) { if (a[k] !== a[k]) return NaN; if (a[k] > m) m = a[k]; } return m; },
  lowest(id, x, len) { const a = win(id, x); if (I < len - 1) return NaN; let m = Infinity; for (let k = I - len + 1; k <= I; k++) { if (a[k] !== a[k]) return NaN; if (a[k] < m) m = a[k]; } return m; },
  stdev(id, x, len) { const a = win(id, x); if (I < len - 1) return NaN; let t = 0; for (let k = I - len + 1; k <= I; k++) t += a[k]; const m = t / len; let q = 0; for (let k = I - len + 1; k <= I; k++) q += (a[k] - m) ** 2; return Math.sqrt(q / len); },
  change(id, x, n) { const a = win(id, x); n = n || 1; return I >= n ? x - a[I - n] : NaN; },
  ema(id, x, len) { const s = st(id); if (x !== x) return NaN; const al = 2 / (len + 1); s.v = s.v === undefined ? x : al * x + (1 - al) * s.v; return s.v; },
  rma(id, x, len) { return ma(st(id), x, len, 1 / len); },
  rsi(id, x, len) {
    const s = st(id);
    if (s.p === undefined) { s.p = x; return NaN; }
    const ch = x - s.p; s.p = x;
    const u = ma(s.u || (s.u = {}), Math.max(ch, 0), len, 1 / len), d = ma(s.d || (s.d = {}), Math.max(-ch, 0), len, 1 / len);
    if (u !== u) return NaN;
    return d === 0 ? 100 : 100 - 100 / (1 + u / d);
  },
  tr(id) { const pc = I > 0 ? B.close[I - 1] : NaN; return I > 0 ? Math.max(B.high[I] - B.low[I], Math.abs(B.high[I] - pc), Math.abs(B.low[I] - pc)) : B.high[I] - B.low[I]; },
  cum(id, x) { const s = st(id); s.v = (s.v || 0) + (x === x ? x : 0); return s.v; },
  atr(id, len) {
    const pc = I > 0 ? B.close[I - 1] : NaN;
    const tr = I > 0 ? Math.max(B.high[I] - B.low[I], Math.abs(B.high[I] - pc), Math.abs(B.low[I] - pc)) : B.high[I] - B.low[I];
    return ma(st(id), tr, len, 1 / len);
  },
  crossover(id, a, b) { const s = st(id); const r = s.pa !== undefined && a > b && s.pa <= s.pb; s.pa = a; s.pb = b; return r; },
  crossunder(id, a, b) { const s = st(id); const r = s.pa !== undefined && a < b && s.pa >= s.pb; s.pa = a; s.pb = b; return r; },
};
const SHAPES = { triangleup: "arrowUp", arrowup: "arrowUp", labelup: "arrowUp", triangledown: "arrowDown", arrowdown: "arrowDown", labeldown: "arrowDown", circle: "circle", square: "square", diamond: "square", xcross: "circle", cross: "circle", flag: "circle" };
const PL = {
  indicator(...a) { const { pos, named } = PA(a); meta.title = named.title || pos[0] || meta.title; meta.overlay = named.overlay === true; },
  strategy(...a) { PL.indicator(...a); },
  plot(id, ...a) {
    const { pos, named } = PA(a);
    if (/data_window|none/.test(String(named.display || ""))) return;
    let r = plots[id];
    const color = named.color !== undefined ? named.color : pos[2];
    if (!r) r = plots[id] = { id, title: named.title || (typeof pos[1] === "string" ? pos[1] : "plot" + id), color: color || "#6aa8ff", lw: named.linewidth || pos[3] || 2, style: String(named.style || pos[4] || ""), data: [] };
    const v = pos[0], t = B.time[I];
    r.data.push(typeof v === "number" && isFinite(v) ? (color ? { time: t, value: v, color } : { time: t, value: v }) : { time: t });
  },
  plotshape(id, ...a) {
    const { pos, named } = PA(a);
    const cond = pos[0];
    const g = (n, i) => (named[n] !== undefined ? named[n] : pos[i]);
    if (/absolute/.test(String(g("location", 3)))) {     // ve cham tai muc gia
      const r = plots[id] || (plots[id] = { id, title: String(g("title", 1) || ""), color: g("color", 4) || "#f5c518", lw: 2, style: "circles", data: [] });
      r.data.push(typeof cond === "number" && isFinite(cond) ? { time: B.time[I], value: cond } : { time: B.time[I] });
      return;
    }
    if (!cond) return;
    const style = String(g("style", 2) || "").replace(/^shape\./, ""), loc = String(g("location", 3) || "abovebar").replace(/^location\./, "");
    markers.push({ time: B.time[I], position: loc === "belowbar" ? "belowBar" : loc === "absolute" ? "inBar" : "aboveBar", shape: SHAPES[style] || "circle", color: g("color", 4) || "#f5c518", text: g("text", 6) || g("char", 2) && undefined });
  },
  plotchar(id, ...a) { PL.plotshape(id, ...a); },
  hline(id, ...a) {
    const { pos, named } = PA(a);
    if (!hlines[id]) hlines[id] = { price: pos[0], title: named.title || pos[1] || "", color: named.color || pos[2] || "#8a8a93" };
  },
  bgcolor(id, ...a) { const { pos, named } = PA(a); const c = named.color !== undefined ? named.color : pos[0]; if (typeof c === "string") BG.push({ time: B.time[I], color: c }); },
  barcolor(...a) { const { pos, named } = PA(a); const c = named.color !== undefined ? named.color : pos[0]; if (typeof c === "string") BARC.push({ time: B.time[I], color: c }); },
  alertcondition(...a) {
    const { pos, named } = PA(a);
    const t = String(named.title !== undefined ? named.title : pos[1] || "Alert");
    const m = String(named.message !== undefined ? named.message : pos[2] || t);
    ADEF[t] = m;
    const c = named.condition !== undefined ? named.condition : pos[0];
    if (c) ALRT.push({ idx: I, time: B.time[I], title: t, msg: m, src: "ind" });
  },
  alert(...a) {
    const { pos } = PA(a);
    ADEF["alert()"] = "";
    ALRT.push({ idx: I, time: B.time[I], title: "alert()", msg: String(pos[0]), src: "ind" });
  },
};
const strNum = (x, f) => {
  if (typeof x !== "number") return String(x);
  if (x !== x) return "NaN";
  if (typeof f !== "string" || f.startsWith("format.")) return String(+x.toFixed(10));
  let s = Math.abs(x).toFixed((f.split(".")[1] || "").length);
  if (f.includes(",")) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (x < 0 ? "-" : "") + s;
};
function stratOrder(a, entry) {
  const { pos, named } = PA(a);
  const id = String(named.id !== undefined ? named.id : pos[0]), d = String(named.direction !== undefined ? named.direction : pos[1]);
  const long = /long/.test(d), px = B.close[I];
  ADEF["strategy.*"] = "";
  ALRT.push({ idx: I, time: B.time[I], title: "Chiến lược: " + (long ? "MUA" : "BÁN"), msg: (long ? "MUA " : "BÁN ") + id + " @ " + px, src: "str" });
  markers.push({ time: B.time[I], position: long ? "belowBar" : "aboveBar", shape: long ? "arrowUp" : "arrowDown", color: long ? "#22c55e" : "#ef2d4a", text: id });
}
function stratClose(a) {
  const { pos, named } = PA(a);
  const id = String(named.id !== undefined ? named.id : pos[0]);
  ADEF["strategy.*"] = "";
  ALRT.push({ idx: I, time: B.time[I], title: "Chiến lược: ĐÓNG", msg: "ĐÓNG " + id + " @ " + B.close[I], src: "str" });
  markers.push({ time: B.time[I], position: "aboveBar", shape: "circle", color: "#f5c518", text: "x " + id });
}
const isObj = o => o && typeof o === "object";
const LIB = {
  "str.tostring": strNum,
  "array.push": (a, x) => { a.push(x); }, "array.size": a => a.length, "array.shift": a => a.shift(), "array.pop": a => a.pop(),
  "label.new": (...a) => { const { pos, named } = PA(a); const o = { kind: "label", x: pos[0], y: pos[1], text: String(named.text !== undefined ? named.text : pos[2] === undefined ? "" : pos[2]), style: String(named.style || ""), color: named.color, tc: named.textcolor, size: String(named.size || ""), del: false }; OBJS.push(o); return o; },
  "label.set_text": (o, t) => { if (isObj(o)) o.text = String(t); }, "label.set_y": (o, y) => { if (isObj(o)) o.y = y; }, "label.delete": o => { if (isObj(o)) o.del = true; },
  "line.new": (...a) => { const { pos, named } = PA(a); const o = { kind: "line", x1: pos[0], y1: pos[1], x2: pos[2], y2: pos[3], color: named.color, del: false }; OBJS.push(o); return o; },
  "line.set_y1": (o, y) => { if (isObj(o)) o.y1 = y; }, "line.set_y2": (o, y) => { if (isObj(o)) o.y2 = y; }, "line.delete": o => { if (isObj(o)) o.del = true; },
  "strategy.entry": (...a) => stratOrder(a, true), "strategy.order": (...a) => stratOrder(a, true),
  "strategy.close": (...a) => stratClose(a), "strategy.close_all": (...a) => stratClose([K("id"), "tất cả", ...a]), "strategy.exit": () => {},
  "table.new": (...a) => { const { pos } = PA(a); const t = { pos: String(pos[0] || "position.top_right"), cells: {} }; TABLES.push(t); return t; },
  "table.cell": (t, ...a) => { const { pos, named } = PA(a); if (isObj(t)) t.cells[pos[1] + "," + pos[0]] = { col: pos[0], row: pos[1], text: String(named.text !== undefined ? named.text : pos[2] === undefined ? "" : pos[2]), color: named.text_color, bg: named.bgcolor }; },
};


/* ---------- bien dich Pine -> JS ---------- */
const SERIES = new Set(["open", "high", "low", "close", "volume", "time", "hl2", "hlc3", "ohlc4", "bar_index"]);
const KAWARE = new Set(["alert", "plot", "plotshape", "plotchar", "hline", "bgcolor", "barcolor", "alertcondition", "indicator", "strategy", "input", "input.int", "input.float", "input.bool", "input.string", "input.source", "input.color"]);
const SITED = new Set(["plot", "plotshape", "plotchar", "hline", "bgcolor"]);
const CONST_PREFIX = /^(plot|shape|location|size|display|line|hline|extend|format|position|text|label|barmerge|currency|scale|table)\./;
const MATH_OK = new Set(["abs", "max", "min", "sqrt", "pow", "log", "exp", "round", "floor", "ceil", "sign"]);
const BSM = { "barstate.isconfirmed": "($i<R.n-1||!R.lastOpen) ", "barstate.islast": "($i===R.n-1) ", "barstate.isfirst": "($i===0) ", "barstate.ishistory": "($i<R.n-1) ", "barstate.isrealtime": "($i===R.n-1) ", "barstate.isnew": "true " };
const TYPES = new Set(["int", "float", "bool", "string", "color", "label", "line", "table", "box", "linefill"]);
const ASSIGN = ["=", ":=", "+=", "-=", "*=", "/="];
const TOK = /\s*(?:("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(#[0-9a-fA-F]{6,8}\b)|(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+)|([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)|(:=|==|!=|<=|>=|=>|\+=|-=|\*=|\/=|[-+*\/%<>=?:(),\[\]!]))/y;

function stripComment(s) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; }
    else if (c === '"' || c === "'") q = c;
    else if (c === "/" && s[i + 1] === "/") return s.slice(0, i);
  }
  return s;
}
function parenDepth(s) {
  let d = 0, q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; }
    else if (c === '"' || c === "'") q = c;
    else if (c === "(" || c === "[") d++;
    else if (c === ")" || c === "]") d--;
  }
  return d;
}
function lex(s, ln) {
  const out = []; let pos = 0;
  for (;;) {
    TOK.lastIndex = pos;
    const m = TOK.exec(s);
    if (!m) { if (/^\s*$/.test(s.slice(pos))) break; throw new Error("Dòng " + ln + ": ký tự lạ gần '" + s.slice(pos).trim().slice(0, 8) + "'"); }
    pos = TOK.lastIndex;
    if (m[1]) out.push({ t: "str", v: m[1] });
    else if (m[2]) out.push({ t: "str", v: JSON.stringify(m[2]) });
    else if (m[3]) out.push({ t: "num", v: m[3] });
    else if (m[4]) out.push({ t: "id", v: m[4] });
    else out.push({ t: "op", v: m[5] });
  }
  return out;
}
function decl(tk) {          // [var] [kieu] ten (=|:=|+=...) -> {isVar, j} (j = vi tri ten)
  let j = 0, isVar = false;
  if (tk[0].v === "var" || tk[0].v === "varip") { isVar = true; j = 1; }
  if (tk[j] && tk[j].t === "id" && TYPES.has(tk[j].v) && tk[j + 1]) {
    if (tk[j + 1].t === "id") j++;
    else if (tk[j + 1].v === "[" && tk[j + 2] && tk[j + 2].v === "]" && tk[j + 3] && tk[j + 3].t === "id") j += 3;
  }
  if (tk[j] && tk[j].t === "id" && tk[j + 1] && tk[j + 1].t === "op" && ASSIGN.includes(tk[j + 1].v)) return { isVar, j };
  return null;
}

function compile(src) {
  const logical = []; let buf = null;
  src.replace(/\r/g, "").split("\n").forEach((raw, k) => {
    const s = stripComment(raw);
    if (buf) buf.text += " " + s.trim();
    else { if (!s.trim()) return; buf = { ind: s.match(/^[ \t]*/)[0].replace(/\t/g, "    ").length, text: s, ln: k + 1 }; }
    if (parenDepth(buf.text) <= 0) { logical.push(buf); buf = null; }
  });
  if (buf) logical.push(buf);
  const prog = logical.map(L => ({ ind: L.ind, ln: L.ln, tk: lex(L.text, L.ln) })).filter(L => L.tk.length);

  const assigned = new Set(), varNames = new Set(), userFns = new Set(), topLocals = new Set();
  const fns = [], main = [];
  for (let p = 0; p < prog.length; p++) {
    const L = prog[p], tk = L.tk;
    if (tk[0].t === "id" && tk[1] && tk[1].v === "(" && tk.some(x => x.v === "=>")) {
      const body = [];
      while (p + 1 < prog.length && prog[p + 1].ind > L.ind) body.push(prog[++p]);
      fns.push({ L, body }); userFns.add(tk[0].v);
    } else {
      main.push(L);
      const d = decl(tk);
      if (d) { assigned.add(tk[d.j].v); if (d.isVar) varNames.add(tk[d.j].v); }
      else if (tk[0].v === "for" && tk[1]) topLocals.add(tk[1].v);
    }
  }

  let site = 0, curLocals = topLocals, inFn = false;
  const siteId = () => (inFn ? `$c+"/${site++}"` : String(site++));

  function tx(tk, L) {
    const E = m => new Error("Dòng " + L.ln + ": " + m);
    let o = ""; const stk = [];
    for (let j = 0; j < tk.length; j++) {
      const t = tk[j], n = tk[j + 1], p = tk[j - 1], v = t.v;
      if (t.t === "num" || t.t === "str") { o += v + " "; continue; }
      if (t.t === "id") {
        if (v === "and") { o += "& "; continue; }      // & | (khong ngat mach) de cac ham ta.* luon duoc goi moi nen
        if (v === "or") { o += "| "; continue; }
        if (v === "not") { o += "! "; continue; }
        if (v === "true" || v === "false") { o += v + " "; continue; }
        const top = stk[stk.length - 1];
        if (n && n.v === "=" && top && top.call && p && (p.v === "(" || p.v === ",")) {
          if (top.k) o += "K(" + JSON.stringify(v) + "),";
          j++; continue;
        }
        if (v === "array.new" && n && n.v === "<") {
          let q = j + 1; while (tk[q] && tk[q].v !== ">") q++;
          j = q;
          if (tk[j + 1] && tk[j + 1].v === "(") { let d = 0; do { const x = tk[j + 1].v; if (x === "(") d++; else if (x === ")") d--; j++; } while (d > 0 && tk[j + 1]); }
          o += "[] "; continue;
        }
        if (n && n.v === "(") {
          let head, extra = "", k = false;
          const tn = v.startsWith("ta.") ? v.slice(3) : v === "math.sum" ? "sum" : (TA[v] ? v : null);
          if (userFns.has(v)) { head = "F." + v + "("; extra = `$c+"@${site++}"`; }
          else if (v === "na") head = "ISNA(";
          else if (v === "nz") head = "NZ(";
          else if (v === "int") head = "Math.trunc(";
          else if (LIB[v]) { head = "LIB[" + JSON.stringify(v) + "]("; k = true; }
          else if (tn) { if (!TA[tn]) throw E("ta." + tn + " chưa hỗ trợ"); head = "TA." + tn + "("; extra = siteId(); }
          else if (v.startsWith("math.") || MATH_OK.has(v)) {
            const f = v.replace(/^math\./, "");
            if (f === "avg") head = "AVG("; else if (MATH_OK.has(f)) head = "Math." + f + "("; else throw E("math." + f + " chưa hỗ trợ");
          }
          else if (v === "color.new") head = "COL.new(";
          else if (v === "color.rgb") head = "COL.rgb(";
          else if (KAWARE.has(v)) { if (v.startsWith("input")) { head = "INP("; extra = siteId() + "," + JSON.stringify(v); } else { head = "PL." + v + "("; if (SITED.has(v)) extra = siteId(); } k = true; }
          else throw E("hàm " + v + " chưa hỗ trợ");
          o += head + extra;
          if (extra && !(tk[j + 2] && tk[j + 2].v === ")")) o += ",";
          stk.push({ call: true, k: k || KAWARE.has(v) }); j++; continue;
        }
        if (v === "na") { o += "NaN "; continue; }
        if (curLocals.has(v)) {
          if (n && n.v === "[") throw E("chưa hỗ trợ lấy giá trị quá khứ [] của tham số/biến cục bộ '" + v + "'");
          o += v + " "; continue;
        }
        if (BSM[v]) { o += BSM[v]; continue; }
        const arr = SERIES.has(v) ? "B." + v : assigned.has(v) ? "V." + v : null;
        if (arr) {
          if (n && n.v === "[") { o += "H(" + arr + ",$i,"; stk.push({ hist: true }); j++; }
          else o += arr + "[$i] ";
          continue;
        }
        if (v.startsWith("color.")) { if (!(v.slice(6) in COLORS)) throw E("không có màu " + v); o += "COL." + v.slice(6) + " "; continue; }
        if (CONST_PREFIX.test(v) || /^strategy\.(long|short|percent_of_equity|cash|fixed|commission\.\w+|oca\.\w+)$/.test(v)) { o += JSON.stringify(v) + " "; continue; }
        throw E("chưa biết '" + v + "'");
      }
      if (v === "(") { stk.push({ call: false }); o += "("; continue; }
      if (v === ")") { stk.pop(); o += ") "; continue; }
      if (v === "[") throw E("dấu [ chỉ dùng lấy giá trị quá khứ của biến, vd close[1] (không dùng sau hàm/ngoặc)");
      if (v === "]") { const s = stk.pop(); if (!s || !s.hist) throw E("thừa ]"); o += ") "; continue; }
      if (v === "=>") throw E("=> chỉ dùng khi định nghĩa hàm ở đầu dòng");
      if (v === "=" || v === ":=") throw E("dấu = không hợp lệ ở đây (so sánh dùng ==)");
      o += v + " ";
    }
    return o;
  }

  function emitBlock(lines, ctx) {
    let out = "", stack = [];
    const base = lines[0].ind;
    lines.forEach((L, idx) => {
      while (stack.length && L.ind <= stack[stack.length - 1]) { out += "}\n"; stack.pop(); }
      const tk = L.tk, f = tk[0].v;
      if (f === "if") { out += "if(" + tx(tk.slice(1), L) + "){\n"; stack.push(L.ind); return; }
      if (f === "else") { out += tk[1] && tk[1].v === "if" ? "else if(" + tx(tk.slice(2), L) + "){\n" : "else{\n"; stack.push(L.ind); return; }
      if (f === "while") { out += "while(" + tx(tk.slice(1), L) + "){\n"; stack.push(L.ind); return; }
      if (f === "for") {
        const a = tk.findIndex(x => x.t === "id" && x.v === "to"), b = tk.findIndex(x => x.t === "id" && x.v === "by");
        if (a < 0) throw new Error("Dòng " + L.ln + ": for cần dạng: for i = 0 to 9");
        const nm = tk[1].v;
        out += `for(let ${nm}=${tx(tk.slice(3, a), L)};${nm}<=${tx(tk.slice(a + 1, b < 0 ? undefined : b), L)};${nm}+=${b < 0 ? 1 : tx(tk.slice(b + 1), L)}){\n`;
        stack.push(L.ind); return;
      }
      const isLast = ctx.ret && idx === lines.length - 1 && L.ind === base;
      const d = decl(tk);
      if (d) {
        const nm = tk[d.j].v, op = tk[d.j + 1].v, e = tx(tk.slice(d.j + 2), L);
        if (curLocals.has(nm)) { const jop = op === ":=" ? "=" : op; out += isLast ? `return (${nm}${jop}${e});\n` : `${nm}${jop}${e};\n`; }
        else if (d.isVar) out += `if($i===0)V.${nm}[0]=${e};\n`;
        else if (op === "=" || op === ":=") out += `V.${nm}[$i]=${e};\n`;
        else out += `V.${nm}[$i]${op}${e};\n`;
      } else out += (isLast ? "return " : "") + tx(tk, L) + ";\n";
    });
    while (stack.length) { out += "}\n"; stack.pop(); }
    return out;
  }

  function compileFn({ L, body }) {
    const tk = L.tk, name = tk[0].v, ci = tk.findIndex(x => x.v === "=>");
    const params = tk.slice(2, ci).filter(x => x.t === "id").map(x => x.v);
    const rest = tk.slice(ci + 1);
    const lines = rest.length ? [{ ind: L.ind + 1, tk: rest, ln: L.ln }] : body;
    if (!lines.length) throw new Error("Dòng " + L.ln + ": hàm " + name + " không có thân hàm");
    const loc = new Set(params), own = new Set();
    for (const X of lines) { const d = decl(X.tk); if (d) own.add(X.tk[d.j].v); else if (X.tk[0].v === "for") loc.add(X.tk[1].v); }
    own.forEach(x => loc.add(x));
    const saved = [curLocals, inFn]; curLocals = loc; inFn = true;
    const code = emitBlock(lines, { ret: true });
    [curLocals, inFn] = saved;
    const decls = [...own].filter(x => !params.includes(x));
    return `F.${name}=function($c${params.map(x => "," + x).join("")}){${decls.length ? "let " + decls.join(",") + ";" : ""}${code}};\n`;
  }

  let fnsOut = "";
  for (const f of fns) fnsOut += compileFn(f);
  const bodyOut = main.length ? emitBlock(main, { ret: false }) : "";
  const pre = [...varNames].map(n => `if($i>0)V.${n}[$i]=V.${n}[$i-1];`).join("");
  let fn;
  try { fn = new Function("B", "V", "H", "TA", "PL", "COL", "K", "NZ", "ISNA", "AVG", "INP", "LIB", "R", `let $i=0;const $c="";const F={};${fnsOut}return function(i){$i=i;${pre}${bodyOut}}`); }
  catch (e) { throw new Error("Lỗi cú pháp Pine: " + e.message); }
  return { make: (b, v) => fn(b, v, H, TA, PL, COL, K, NZ, ISNA, AVG, INP, LIB, RT), names: [...assigned] };
}

function run(src, bars, opts) {
  const c = compile(src), n = bars.length;
  B = { open: [], high: [], low: [], close: [], volume: [], time: [], hl2: [], hlc3: [], ohlc4: [], bar_index: [] };
  bars.forEach((b, i) => {
    B.open.push(b.open); B.high.push(b.high); B.low.push(b.low); B.close.push(b.close); B.volume.push(b.vol || 0);
    B.time.push(b.time); B.hl2.push((b.high + b.low) / 2); B.hlc3.push((b.high + b.low + b.close) / 3);
    B.ohlc4.push((b.open + b.high + b.low + b.close) / 4); B.bar_index.push(i);
  });
  const V = Object.create(null);
  c.names.forEach(k => { V[k] = new Array(n).fill(NaN); });
  S = {}; plots = {}; markers = []; hlines = {}; OBJS = []; TABLES = []; BG = []; BARC = []; ALRT = []; ADEF = {}; INPUTS = {}; OVR = (opts && opts.inputs) || {};
  meta = { title: "Pine", overlay: true };
  RT.n = n; RT.lastOpen = !!(opts && opts.lastOpen);
  const bar = c.make(B, V);
  for (I = 0; I < n; I++) {
    try { bar(I); }
    catch (e) { throw new Error("Lỗi khi chạy ở nến #" + I + ": " + e.message); }
  }
  return { meta, plots: Object.values(plots), markers, hlines: Object.values(hlines),
    lines: OBJS.filter(o => o.kind === "line" && !o.del), labels: OBJS.filter(o => o.kind === "label" && !o.del), tables: TABLES, bg: BG, barColors: BARC, alerts: ALRT.filter(x => x.idx >= n - 5), alertDefs: Object.keys(ADEF), inputs: Object.values(INPUTS) };
}

root.Pine = { run };
if (typeof module !== "undefined") module.exports = root.Pine;
})(typeof window !== "undefined" ? window : globalThis);
