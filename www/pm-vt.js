/* PM-VT V7 - script Pine mac dinh cho khung Pine (chart-nen.html nap file nay) */
window.PMVT = String.raw`//@version=5
indicator("PM-VT_ V7 - FUTURES INDICATOR", shorttitle="PM-VT_ V7 - IND", overlay=true,
     max_labels_count=500,
     max_lines_count=500)

// --- Futures ---
lenC       = input.int(1, "Contracts", minval=1)
gFut       = "Cấu hình Futures"
pointValue = input.float(100000, "Giá trị 1 điểm (VND)", minval=1000, maxval=1000000, step=1000, group=gFut)
VON_PCT    = 7 * lenC + 10

// --- SL / TP ---
gSL      = "SL / TP"
slPct    = input.float(1.2, "Cắt lỗ (SL) %", minval=0.5, maxval=10, step=0.1, group=gSL)
tpPct    = input.float(10, "Chốt lời (TP) %", minval=1, maxval=20, step=0.1, group=gSL)
lineLen  = input.int(15, "Độ dài đường SL/TP (nến)", minval=1, maxval=200, group=gSL)

// --- ATR / RSI filter ---
gFlt         = "Bộ lọc ATR / RSI"
atrLen       = input.int(2, "Chu kỳ ATR", minval=1, maxval=50, group=gFlt)
useRSI       = input.bool(true, "Bật bộ lọc RSI", group=gFlt)
rsiLen       = input.int(5, "Chu kỳ RSI", minval=1, maxval=100, group=gFlt)
rsiOB        = input.float(75.0, "RSI quá mua", minval=0, maxval=100, step=0.1, group=gFlt)
rsiOS        = input.float(27.0, "RSI quá bán", minval=0, maxval=100, step=0.1, group=gFlt)
useATRFilter = input.bool(true, "Bật bộ lọc biến động ATR", group=gFlt)
atrMinMult   = input.float(0.5, "ATR tối thiểu (x ATR MA)", minval=0, maxval=10, step=0.01, group=gFlt)
atrMaLen     = input.int(8, "Chu kỳ ATR MA", minval=1, maxval=100, group=gFlt)

// --- MCDX Long ---
gML             = "MCDX Long"
rsiBaseBanker   = input.int(53, "Banker Base", minval=10, maxval=200, group=gML)
rsiPeriodBanker = input.int(43, "Banker RSI Period", minval=10, maxval=200, group=gML)
sensBanker      = input.float(0.75, "Độ nhạy Banker", minval=0.1, maxval=5, step=0.1, group=gML)
lenb            = input.int(21, "Lenb", minval=1, maxval=100, group=gML)

// --- MCDX Short ---
gMS              = "MCDX Short"
rsiBaseBankerS   = input.int(53, "Banker Base (Short)", minval=10, maxval=200, group=gMS)
rsiPeriodBankerS = input.int(23, "Banker RSI Period (Short)", minval=10, maxval=200, group=gMS)
sensBankerS      = input.float(1.5, "Độ nhạy Banker (Short)", minval=0.1, maxval=5, step=0.1, group=gMS)
lenbS            = input.int(22, "Lenb (Short)", minval=1, maxval=100, group=gMS)

// --- CDV ---
gCDV         = "CDV / Volume Void"
cdvThreshold = input.float(4000, "Ngưỡng CDV breakout", minval=0, maxval=1000000, step=1, group=gCDV)
volVoidRatio = input.float(0.93, "Volume Void Ratio (x KL TB)", minval=0, maxval=5, step=0.01, group=gCDV)
lookbackVol  = input.int(8, "Volume Void SMA Lookback", minval=1, maxval=200, group=gCDV)

// --- Fisher ---
gFis         = "Fisher"
fisherLength = input.int(50, "Fisher Length", minval=20, maxval=150, step=5, group=gFis)
fisherK1     = input.float(0.5, "Fisher K1 (giá)", minval=0.4, maxval=0.9, step=0.05, group=gFis)
fisherK2     = input.float(0.8, "Fisher K2 (nhớ fisher[1])", minval=0.1, maxval=0.9, step=0.05, group=gFis)

// --- HH / LL ---
gHL      = "HH / LL đa chu kỳ"
lengthM1 = input.int(1, "lengthM1", minval=1, maxval=50, group=gHL)
lengthM3 = input.int(2, "lengthM3", minval=1, maxval=50, group=gHL)
lengthM5 = input.int(3, "lengthM5", minval=1, maxval=50, group=gHL)
lengthM7 = input.int(4, "lengthM7", minval=1, maxval=50, group=gHL)
lengthM9 = input.int(5, "lengthM9", minval=1, maxval=50, group=gHL)

// --- % thay đổi giá / KL ---
gPct         = "% thay đổi giá / khối lượng"
minGiaChange = input.float(3.2, "Ngưỡng % thay đổi giá", minval=0, maxval=100, step=0.1, group=gPct)
minVolChange = input.float(0, "Ngưỡng % thay đổi khối lượng", minval=0, maxval=1000, step=1, group=gPct)

// --- TSI ---
gTSI         = "TSI"
longLength   = input.int(15, "TSI Long EMA", minval=1, maxval=200, group=gTSI)
shortLength  = input.int(49, "TSI Short EMA", minval=1, maxval=200, group=gTSI)
signalLength = input.int(50, "TSI Signal EMA", minval=1, maxval=200, group=gTSI)

// --- SMI ---
gSMI     = "SMI"
longlen  = input.int(52, "SMI Long Length", minval=1, maxval=300, group=gSMI)
shortlen = input.int(50, "SMI Short Length", minval=1, maxval=300, group=gSMI)
siglen   = input.int(50, "SMI Signal Length", minval=1, maxval=300, group=gSMI)

// --- Vortex ---
gVtx         = "Vortex"
vortexLength = input.int(13, "Vortex Length", minval=2, maxval=30, group=gVtx)
vortexMargin = input.float(0, "Vortex Margin (VI chênh > margin)", minval=0, maxval=0.2, step=0.05, group=gVtx)

// --- Hiển thị ---
gDsp      = "Hiển thị"
maxLabels = input.int(1, "Giới hạn số Label", minval=1, group=gDsp)

// ============================================================
// ATR / RSI FILTER
// ============================================================
atrValue = ta.atr(atrLen)
atrMA    = ta.sma(atrValue, atrMaLen)
rsiValue = ta.rsi(close, rsiLen)

rsiAllowLong  = not useRSI or rsiValue < rsiOB
rsiAllowShort = not useRSI or rsiValue > rsiOS
atrOK         = not useATRFilter or atrValue > atrMA * atrMinMult

// ============================================================
// MCDX
// ============================================================
mcdx(sens, period, base, cap) =>
    m = sens * (ta.rsi(close, period) - base)
    math.max(math.min(m, cap), 0)

banker    = mcdx(sensBanker,  rsiPeriodBanker,  rsiBaseBanker,  lenb)
maBanker  = ta.sma(banker, 10)
bankerS   = mcdx(sensBankerS, rsiPeriodBankerS, rsiBaseBankerS, lenbS)
maBankerS = ta.sma(bankerS, 10)

// ============================================================
// CDV + Volume Voids
// ============================================================
tw    = high - math.max(open, close)
bw    = math.min(open, close) - low
body  = math.abs(close - open)
total = tw + bw + body

rateUp    = total == 0 ? 0.5 : (0.5 * (tw + bw + (open <= close ? 2 * body : 0))) / total
rateDown  = total == 0 ? 0.5 : (0.5 * (tw + bw + (open >  close ? 2 * body : 0))) / total
deltaUp   = volume * rateUp
deltaDown = volume * rateDown
delta     = close >= open ? deltaUp : -deltaDown
cumDelta  = ta.cum(delta)

cdvUp   = delta >  cdvThreshold and cumDelta > cumDelta[1]
cdvDown = delta < -cdvThreshold and cumDelta < cumDelta[1]

avgVol       = ta.sma(volume, lookbackVol)
volVoidBelow = volume < avgVol * volVoidRatio and low  <= low[1]
volVoidAbove = volume < avgVol * volVoidRatio and high >= high[1]

// ============================================================
// FISHER
// ============================================================
priceF  = hl2
maxHF   = ta.highest(priceF, fisherLength)
minLF   = ta.lowest(priceF, fisherLength)
rangeF0 = maxHF - minLF
rangeF  = rangeF0 == 0 ? 0.001 : rangeF0

float fv = 0.0
fvRaw    = fisherK1 * ((priceF - minLF) / rangeF - 0.5) + fisherK2 * nz(fv[1])
fv      := math.max(-0.999, math.min(0.999, fvRaw))

fisher  = 0.5 * math.log((1 + fv) / (1 - fv))
signalF = fisher[1]

// ============================================================
// HH / LL đa chu kỳ
// ============================================================
hh = (ta.highest(high, lengthM1) + ta.highest(high, lengthM3) + ta.highest(high, lengthM5) + ta.highest(high, lengthM7) + ta.highest(high, lengthM9)) / 5
ll = (ta.lowest(low, lengthM1)   + ta.lowest(low, lengthM3)   + ta.lowest(low, lengthM5)   + ta.lowest(low, lengthM7)   + ta.lowest(low, lengthM9)) / 5

length0 = int((lengthM1 + lengthM3 + lengthM5 + lengthM7 + lengthM9) / 5)

longBreak  = high > hh[1] and high[1] < hh[1]
shortBreak = low  < ll[1] and low[1]  > ll[1]

// ============================================================
// % thay đổi giá / khối lượng
// ============================================================
giaPct = close[1] == 0 ? 0.0 : (close  - close[1])  / close[1]  * 100
volPct = volume[1] == 0 ? 0.0 : (volume - volume[1]) / volume[1] * 100

isUpDown = giaPct > minGiaChange and volPct < -minVolChange

// ============================================================
// MA
// ============================================================
sMa = ta.sma(ohlc4, length0)

// ============================================================
// TSI
// ============================================================
momTsi    = open - open[1]
numTsi    = ta.ema(ta.ema(momTsi, longLength), shortLength)
denTsi    = ta.ema(ta.ema(math.abs(momTsi), longLength), shortLength)
tsi       = denTsi == 0 ? na : 100 * numTsi / denTsi
signalTsi = ta.ema(tsi, signalLength)

longCondTSI = ta.crossover(tsi, signalTsi)

// ============================================================
// SMI
// ============================================================
momSmi = close - close[1]
numSmi = ta.ema(ta.ema(momSmi, longlen), shortlen)
denSmi = ta.ema(ta.ema(math.abs(momSmi), longlen), shortlen)
erg    = denSmi == 0 ? na : 100 * numSmi / denSmi
sig    = ta.ema(erg, siglen)

longCondSMI = ta.crossover(erg, sig)

// ============================================================
// VORTEX
// ============================================================
trV     = ta.tr(true)
vmPlus  = math.abs(high - low[1])
vmMinus = math.abs(low  - high[1])

sumTR    = math.sum(trV,     vortexLength)
sumPlus  = math.sum(vmPlus,  vortexLength)
sumMinus = math.sum(vmMinus, vortexLength)

validVortex = bar_index > vortexLength
viPlus  = validVortex and sumTR != 0 ? sumPlus  / sumTR : 0.0
viMinus = validVortex and sumTR != 0 ? sumMinus / sumTR : 0.0

// ============================================================
// TÍN HIỆU BUY / SELL (chỉ xác nhận khi đóng nến -> không repaint)
// ============================================================
buyType1 = barstate.isconfirmed and cdvDown and volVoidAbove and close > sMa and rsiAllowShort and atrOK
buyType2 = barstate.isconfirmed and longBreak and banker < maBanker and close > sMa and rsiAllowShort and atrOK
buyType3 = barstate.isconfirmed and high > hh[1] and cdvDown and close > sMa and rsiAllowShort and atrOK
buyType4 = barstate.isconfirmed and ((isUpDown and close > sMa and rsiAllowShort and atrOK) or (longCondTSI and rsiAllowShort and atrOK) or (longCondSMI and rsiAllowShort and atrOK))
buyType5 = barstate.isconfirmed and (viPlus - viMinus) > vortexMargin and ta.crossover(fisher, signalF) and rsiAllowShort and atrOK

sellType1 = barstate.isconfirmed and cdvUp and volVoidBelow and close < sMa and rsiAllowLong and atrOK
sellType2 = barstate.isconfirmed and shortBreak and bankerS > maBankerS[1] and rsiAllowLong and atrOK
sellType3 = barstate.isconfirmed and low < ll[1] and cdvUp and close < sMa and rsiAllowLong and atrOK
sellType4 = barstate.isconfirmed and (viMinus - viPlus) > vortexMargin and ta.crossover(signalF, fisher) and rsiAllowLong and atrOK

buySignal  = buyType1 or buyType2 or buyType3 or buyType4 or buyType5
sellSignal = sellType1 or sellType2 or sellType3 or sellType4

// ============================================================
// SL/TP THAM CHIẾU THEO %
// ============================================================
slLongPrice  = close * (1 - slPct / 100)
tpLongPrice  = open  * (1 + tpPct / 100)
slShortPrice = close * (1 + slPct / 100)
tpShortPrice = open  * (1 - tpPct / 100)

// ============================================================
// STATE MACHINE  (exitKind: 0 = không, 1 = SL, 2 = TP, 3 = tín hiệu ngược)
// ============================================================
var int   state = 0
var float curSL = na
var float curTP = na

bool  buyArr   = false
bool  shortArr = false
bool  exitSig  = false
int   exitKind = 0
float exitPx   = na

if state == 1
    if low <= curSL
        state    := 0
        exitKind := 1
        exitPx   := math.min(open, curSL)
    else if high >= curTP
        state    := 0
        exitKind := 2
        exitPx   := math.max(open, curTP)
    else if sellSignal
        state    := 0
        exitSig  := true
        exitKind := 3
        exitPx   := close
    else if buySignal
        curSL := math.max(curSL, slLongPrice)
        curTP := math.max(curTP, tpLongPrice)
else if state == -1
    if high >= curSL
        state    := 0
        exitKind := 1
        exitPx   := math.max(open, curSL)
    else if low <= curTP
        state    := 0
        exitKind := 2
        exitPx   := math.min(open, curTP)
    else if buySignal
        state    := 0
        exitSig  := true
        exitKind := 3
        exitPx   := close
    else if sellSignal
        curSL := math.min(curSL, slShortPrice)
        curTP := math.min(curTP, tpShortPrice)

if state == 0
    if buySignal
        buyArr := true
        state  := 1
        curSL  := slLongPrice
        curTP  := tpLongPrice
    else if sellSignal
        shortArr := true
        state    := -1
        curSL    := slShortPrice
        curTP    := tpShortPrice

// ============================================================
// MÔ PHỎNG LỆNH (thay cho strategy.*)
// ============================================================
var int   posDir      = 0
var float entPx       = na
var float totalPts    = 0.0
var int   nTrades     = 0
var int   nWins       = 0
var int   losingStreak    = 0
var int   maxLosingStreak = 0

if buyArr[1] or shortArr[1]
    posDir := buyArr[1] ? 1 : -1
    entPx  := open

if exitKind != 0 and posDir != 0
    float pnl = (exitPx - entPx) * posDir
    totalPts += pnl
    nTrades  += 1
    if pnl > 0
        nWins += 1
    if pnl < 0
        losingStreak += 1
        maxLosingStreak := math.max(maxLosingStreak, losingStreak)
    else
        losingStreak := 0
    posDir := 0

// ============================================================
// VẼ: MA, nến, mũi tên, SL/TP
// ============================================================
plot(sMa, "MA", color = sMa[1] > sMa[2] ? color.green : color.red, linewidth=2)

posColor = posDir == 1 ? color.new(color.lime, 0) : posDir == -1 ? color.new(color.red, 0) : na
barcolor(posColor)
bgcolor(posDir == 1 ? color.new(color.green, 88) : posDir == -1 ? color.new(color.red, 88) : na)

plotshape(buyType1,  "B1", shape.labelup,   location.belowbar, color.green,                text="B1", textcolor=color.white, size=size.tiny)
plotshape(buyType2,  "B2", shape.labelup,   location.belowbar, color.rgb(0, 200, 0),       text="B2", textcolor=color.white, size=size.tiny)
plotshape(buyType3,  "B3", shape.labelup,   location.belowbar, color.new(color.green, 40), text="B3", textcolor=color.white, size=size.tiny)
plotshape(buyType4,  "B4", shape.labelup,   location.belowbar, color.teal,                 text="B4", textcolor=color.white, size=size.tiny)
plotshape(buyType5,  "B5", shape.labelup,   location.belowbar, color.aqua,                 text="B5", textcolor=color.white, size=size.tiny)

plotshape(sellType1, "S1", shape.labeldown, location.abovebar, color.red,                  text="S1", textcolor=color.white, size=size.tiny)
plotshape(sellType2, "S2", shape.labeldown, location.abovebar, color.orange,               text="S2", textcolor=color.white, size=size.tiny)
plotshape(sellType3, "S3", shape.labeldown, location.abovebar, color.maroon,               text="S3", textcolor=color.white, size=size.tiny)
plotshape(sellType4, "S4", shape.labeldown, location.abovebar, color.purple,               text="S4", textcolor=color.white, size=size.tiny)

plotshape(state == 1  ? curSL : na, "SL Long",  shape.triangledown, location.absolute, color.orange, size=size.tiny)
plotshape(state == 1  ? curTP : na, "TP Long",  shape.triangleup,   location.absolute, color.lime,   size=size.tiny)
plotshape(state == -1 ? curSL : na, "SL Short", shape.triangleup,   location.absolute, color.orange, size=size.tiny)
plotshape(state == -1 ? curTP : na, "TP Short", shape.triangledown, location.absolute, color.lime,   size=size.tiny)

plotshape(exitKind == 1 ? exitPx : na, "Thoát SL",  shape.xcross,  location.absolute, color.red,    size=size.small)
plotshape(exitKind == 2 ? exitPx : na, "Thoát TP",  shape.diamond, location.absolute, color.lime,   size=size.small)
plotshape(exitKind == 3 ? exitPx : na, "Thoát ngược", shape.circle, location.absolute, color.yellow, size=size.small)

// ============================================================
// NHÃN V / SL / TP / VỐN + ĐƯỜNG SL/TP
// ============================================================
var label[] labels  = array.new<label>()
var label[] slLbls  = array.new<label>()
var label[] tpLbls  = array.new<label>()
var line[]  slLines = array.new<line>()
var line[]  tpLines = array.new<line>()

f_addLabel(_lbl) =>
    array.push(labels, _lbl)
    if array.size(labels) > maxLabels
        old = array.shift(labels)
        label.delete(old)

f_trimLbl(arr, n) =>
    while array.size(arr) > n
        label.delete(array.shift(arr))

f_trimLine(arr, n) =>
    while array.size(arr) > n
        line.delete(array.shift(arr))

f_mainTxt(o, sl, tp, von) =>
    "V:" + str.tostring(o, "#.0") + "\nSL:" + str.tostring(sl, "#.0") + "\nTP:" + str.tostring(tp, "#.0") + "\nvốn:" + str.tostring(von, "#,###") + "\nHD: " + str.tostring(lenC, format.mintick)

atr14 = ta.atr(14)
float entSL = (buyArr or shortArr) ? curSL : na
float entTP = (buyArr or shortArr) ? curTP : na

var label  curMain = na
var line   curSlLn = na
var line   curTpLn = na
var label  curSlLb = na
var label  curTpLb = na
var float  shSL    = na
var float  shTP    = na
var float  entOpen = na
var float  entVon  = na
var string curDir  = ""

// --- Lệnh mới (bar sau tín hiệu) ---
if buyArr[1] or shortArr[1]
    bool isL = buyArr[1]
    entOpen := open
    entVon  := math.round(open * pointValue * VON_PCT / 100 / 1000)
    shSL    := entSL[1]
    shTP    := entTP[1]
    curDir  := isL ? "L" : "S"

    mainLbl = label.new(bar_index, isL ? low - atr14 * 0.5 : high + atr14 * 0.5, f_mainTxt(entOpen, shSL, shTP, entVon), style=isL ? label.style_label_up : label.style_label_down, color=isL ? color.rgb(42, 134, 35) : color.rgb(131, 45, 45), textcolor=color.white, size=size.large)
    f_addLabel(mainLbl)
    curMain := mainLbl

    curSlLn := line.new(bar_index, shSL, bar_index + lineLen, shSL, color=color.orange, style=line.style_dashed, width=1)
    curTpLn := line.new(bar_index, shTP, bar_index + lineLen, shTP, color=color.lime,   style=line.style_dashed, width=1)
    curSlLb := label.new(bar_index + lineLen, shSL, curDir + " SL: " + str.tostring(shSL, "#.0"), style=label.style_label_left, color=color.orange, textcolor=color.white, size=size.large)
    curTpLb := label.new(bar_index + lineLen, shTP, curDir + " TP: " + str.tostring(shTP, "#.0"), style=label.style_label_left, color=color.green,  textcolor=color.white, size=size.large)

    array.push(slLines, curSlLn)
    array.push(tpLines, curTpLn)
    array.push(slLbls,  curSlLb)
    array.push(tpLbls,  curTpLb)
    f_trimLine(slLines, maxLabels)
    f_trimLine(tpLines, maxLabels)
    f_trimLbl(slLbls,  maxLabels)
    f_trimLbl(tpLbls,  maxLabels)

// --- Cùng trend nâng/hạ SL/TP -> cập nhật nhãn + đường ---
if not na(curMain) and state != 0 and not (buyArr or shortArr or exitSig) and (curSL != shSL or curTP != shTP)
    shSL := curSL
    shTP := curTP
    label.set_text(curMain, f_mainTxt(entOpen, shSL, shTP, entVon))
    line.set_y1(curSlLn, shSL)
    line.set_y2(curSlLn, shSL)
    line.set_y1(curTpLn, shTP)
    line.set_y2(curTpLn, shTP)
    label.set_y(curSlLb, shSL)
    label.set_text(curSlLb, curDir + " SL: " + str.tostring(shSL, "#.0"))
    label.set_y(curTpLb, shTP)
    label.set_text(curTpLb, curDir + " TP: " + str.tostring(shTP, "#.0"))

// ============================================================
// BẢNG THỐNG KÊ (mô phỏng) - góc dưới phải
// ============================================================
var table stats = table.new(position.bottom_right, 2, 5, bgcolor=color.new(color.black, 20), frame_width=0)

if barstate.islast
    table.cell(stats, 0, 0, "Số lệnh",            text_color=color.white, text_halign=text.align_left)
    table.cell(stats, 1, 0, str.tostring(nTrades), text_color=color.white)
    table.cell(stats, 0, 1, "Tỉ lệ thắng",        text_color=color.white, text_halign=text.align_left)
    table.cell(stats, 1, 1, nTrades > 0 ? str.tostring(nWins / nTrades * 100, "#.0") + "%" : "NA", text_color=color.white)
    table.cell(stats, 0, 2, "Tổng điểm",          text_color=color.white, text_halign=text.align_left)
    table.cell(stats, 1, 2, str.tostring(totalPts, "#.0"), text_color=totalPts >= 0 ? color.lime : color.red)
    table.cell(stats, 0, 3, "Thua liên tiếp",     text_color=color.white, text_halign=text.align_left)
    table.cell(stats, 1, 3, str.tostring(losingStreak), text_color=color.white)
    table.cell(stats, 0, 4, "Thua liên tiếp MAX", text_color=color.white, text_halign=text.align_left)
    table.cell(stats, 1, 4, str.tostring(maxLosingStreak), text_color=color.orange)

// ============================================================
// BẢNG THÔNG TIN VỊ THẾ - góc trên phải
// ============================================================
var table info = table.new(position.top_right, 1, 4, bgcolor=color.new(color.black, 100), frame_width=0)

if barstate.islast
    if state == 1
        table.cell(info, 0, 0, ">>> LONG <<<", text_color=color.lime, text_halign=text.align_left)
        table.cell(info, 0, 1, "Giá hiện tại: " + str.tostring(close, "0.00"), text_color=color.white, text_halign=text.align_left)
        table.cell(info, 0, 2, "SL (đang áp dụng): " + str.tostring(curSL, "0.00"), text_color=color.orange, text_halign=text.align_left)
        table.cell(info, 0, 3, "TP (đang áp dụng): " + str.tostring(curTP, "0.00"), text_color=color.aqua, text_halign=text.align_left)
    else if state == -1
        table.cell(info, 0, 0, ">>> SHORT <<<", text_color=color.red, text_halign=text.align_left)
        table.cell(info, 0, 1, "Giá hiện tại: " + str.tostring(close, "0.00"), text_color=color.white, text_halign=text.align_left)
        table.cell(info, 0, 2, "SL (đang áp dụng): " + str.tostring(curSL, "0.00"), text_color=color.orange, text_halign=text.align_left)
        table.cell(info, 0, 3, "TP (đang áp dụng): " + str.tostring(curTP, "0.00"), text_color=color.aqua, text_halign=text.align_left)
    else
        table.cell(info, 0, 0, "")
        table.cell(info, 0, 1, "")
        table.cell(info, 0, 2, "")
        table.cell(info, 0, 3, "")

// ============================================================
// ALERT
// ============================================================
alertcondition(buyArr,    "PM-VT: MUA (vào open bar kế)",  "PM-VT: Tín hiệu MUA - vào lệnh tại open bar kế tiếp")
alertcondition(shortArr,  "PM-VT: BÁN (vào open bar kế)",  "PM-VT: Tín hiệu BÁN - vào lệnh tại open bar kế tiếp")
alertcondition(exitSig,   "PM-VT: Thoát do tín hiệu ngược", "PM-VT: Thoát lệnh do tín hiệu ngược trend")
alertcondition(exitKind == 1, "PM-VT: Chạm SL", "PM-VT: Chạm SL")
alertcondition(exitKind == 2, "PM-VT: Chạm TP", "PM-VT: Chạm TP")

// ============================================================
// DATA WINDOW
// ============================================================
plot(banker,    "Banker",   display=display.data_window)
plot(maBanker,  "MA_Bnkr",  display=display.data_window)
plot(bankerS,   "BankerS",  display=display.data_window)
plot(maBankerS, "MA_BnkS",  display=display.data_window)
plot(tsi,       "TSI",      display=display.data_window)
plot(erg,       "SMI",      display=display.data_window)
plot(viPlus,    "VI+",      display=display.data_window)
plot(viMinus,   "VI-",      display=display.data_window)
plot(fisher,    "Fisher",   display=display.data_window)
plot(state,     "Trạng thái", display=display.data_window)
`;
