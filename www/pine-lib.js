/* Thu vien chi bao co san (Pine v5) - chon trong khung Pine > "Thu vien..." */
window.PINELIB = {
"MA: SMA + EMA": String.raw`//@version=5
indicator("MA (SMA + EMA)", overlay=true)
len1 = input.int(20, "Chu kỳ SMA", minval=1)
len2 = input.int(50, "Chu kỳ EMA", minval=1)
src  = input.source(close, "Nguồn")
plot(ta.sma(src, len1), "SMA", color=color.yellow, linewidth=2)
plot(ta.ema(src, len2), "EMA", color=color.aqua, linewidth=2)
`,
"Bollinger Bands": String.raw`//@version=5
indicator("Bollinger Bands", overlay=true)
len  = input.int(20, "Chu kỳ", minval=1)
mult = input.float(2.0, "Hệ số lệch chuẩn", minval=0.1, step=0.1)
basis = ta.sma(close, len)
dev   = mult * ta.stdev(close, len)
plot(basis, "Basis", color=color.orange)
plot(basis + dev, "Upper", color=color.blue)
plot(basis - dev, "Lower", color=color.blue)
`,
"Donchian Channels": String.raw`//@version=5
indicator("Donchian Channels", overlay=true)
len = input.int(20, "Chu kỳ", minval=1)
hi = ta.highest(high, len)
lo = ta.lowest(low, len)
plot(hi, "Upper", color=color.green)
plot(lo, "Lower", color=color.red)
plot((hi + lo) / 2, "Middle", color=color.gray)
`,
"Supertrend": String.raw`//@version=5
indicator("Supertrend", overlay=true)
len  = input.int(10, "ATR chu kỳ", minval=1)
mult = input.float(3.0, "Hệ số ATR", minval=0.1, step=0.1)
atrV = ta.atr(len)
up = hl2 - mult * atrV
up1 = nz(up[1], up)
up := close[1] > up1 ? math.max(up, up1) : up
dn = hl2 + mult * atrV
dn1 = nz(dn[1], dn)
dn := close[1] < dn1 ? math.min(dn, dn1) : dn
var int trend = 1
trend := trend == -1 and close > dn1 ? 1 : trend == 1 and close < up1 ? -1 : trend
plot(trend == 1 ? up : na, "Up", color=color.green, linewidth=2)
plot(trend == -1 ? dn : na, "Down", color=color.red, linewidth=2)
plotshape(trend == 1 and trend[1] == -1, "Mua", shape.labelup, location.belowbar, color.green, text="Mua", textcolor=color.white)
plotshape(trend == -1 and trend[1] == 1, "Bán", shape.labeldown, location.abovebar, color.red, text="Bán", textcolor=color.white)
alertcondition(trend == 1 and trend[1] == -1, "Supertrend: MUA", "Supertrend đổi sang tăng")
alertcondition(trend == -1 and trend[1] == 1, "Supertrend: BÁN", "Supertrend đổi sang giảm")
`,
"RSI": String.raw`//@version=5
indicator("RSI", overlay=false)
len = input.int(14, "Chu kỳ", minval=1)
ob  = input.float(70, "Quá mua")
os  = input.float(30, "Quá bán")
plot(ta.rsi(close, len), "RSI", color=color.purple, linewidth=2)
hline(ob, "Quá mua", color=color.red)
hline(os, "Quá bán", color=color.green)
`,
"MACD": String.raw`//@version=5
indicator("MACD", overlay=false)
fastLen = input.int(12, "Fast", minval=1)
slowLen = input.int(26, "Slow", minval=1)
sigLen  = input.int(9, "Signal", minval=1)
macd   = ta.ema(close, fastLen) - ta.ema(close, slowLen)
signal = ta.ema(macd, sigLen)
hist   = macd - signal
plot(hist, "Histogram", color = hist >= 0 ? color.green : color.red, style=plot.style_histogram)
plot(macd, "MACD", color=color.aqua)
plot(signal, "Signal", color=color.orange)
hline(0, "0", color=color.gray)
`,
};
