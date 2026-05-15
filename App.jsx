/* ==============================================================
   ひらがな・カタカナ かきかたマスター ＋ ことばあつめ
   --------------------------------------------------------------
   小学１年生のための、ひらがな・カタカナ反復練習＋単語収集アプリ
   - 50音表から文字を選び、なぞり書きで反復練習
   - 筆順を間違えると自動で書き順アニメを表示（再学習）
   - 書けた文字は「マスター済み」として記録（LocalStorage保存）
   - マスターした文字を使って、自分だけの「ことばずかん」を作れる

   先生がカスタマイズしたい場合は、下の "// ★カスタマイズポイント"
   と書かれた箇所を中心に書き換えてみてください。
   ============================================================== */

const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ──────────────────────────────────────────────────────────────
   1. データ定数  ── 50音表 と お手本ことば（自由に書き換えOK）
   ────────────────────────────────────────────────────────────── */

// ★カスタマイズポイント: 50音表（空文字 '' はマス目のスペース）
const HIRA_TABLE = [
  'あ','い','う','え','お',
  'か','き','く','け','こ',
  'さ','し','す','せ','そ',
  'た','ち','つ','て','と',
  'な','に','ぬ','ね','の',
  'は','ひ','ふ','へ','ほ',
  'ま','み','む','め','も',
  'や','' ,'ゆ','' ,'よ',
  'ら','り','る','れ','ろ',
  'わ','' ,'' ,'' ,'を',
  'ん','' ,'' ,'' ,''
];
const KATA_TABLE = [
  'ア','イ','ウ','エ','オ',
  'カ','キ','ク','ケ','コ',
  'サ','シ','ス','セ','ソ',
  'タ','チ','ツ','テ','ト',
  'ナ','ニ','ヌ','ネ','ノ',
  'ハ','ヒ','フ','ヘ','ホ',
  'マ','ミ','ム','メ','モ',
  'ヤ','' ,'ユ','' ,'ヨ',
  'ラ','リ','ル','レ','ロ',
  'ワ','' ,'' ,'' ,'ヲ',
  'ン','' ,'' ,'' ,''
];
const HIRA_LIST = HIRA_TABLE.filter(c => c);
const KATA_LIST = KATA_TABLE.filter(c => c);

// ★カスタマイズポイント: 「ことばあつめ」のお手本（こどもの語彙ヒント）
const WORD_HINTS_HIRA = [
  { w:'あめ', e:'🍬' }, { w:'いぬ', e:'🐶' }, { w:'うみ', e:'🌊' }, { w:'えき', e:'🚉' },
  { w:'おに', e:'👹' }, { w:'かに', e:'🦀' }, { w:'きく', e:'🌼' }, { w:'くも', e:'☁️' },
  { w:'こま', e:'🪀' }, { w:'さくら', e:'🌸' }, { w:'すいか', e:'🍉' }, { w:'そら', e:'🌌' },
  { w:'たこ', e:'🐙' }, { w:'つき', e:'🌙' }, { w:'にじ', e:'🌈' }, { w:'はな', e:'🌺' },
  { w:'ふね', e:'🚢' }, { w:'ほし', e:'⭐' }, { w:'みず', e:'💧' }, { w:'もも', e:'🍑' },
  { w:'やま', e:'⛰️' }, { w:'ゆき', e:'❄️' }, { w:'りんご', e:'🍎' }, { w:'れもん', e:'🍋' },
];
const WORD_HINTS_KATA = [
  { w:'アイス', e:'🍦' }, { w:'イルカ', e:'🐬' }, { w:'ウサギ', e:'🐰' }, { w:'エビ', e:'🦐' },
  { w:'オムレツ', e:'🍳' }, { w:'カバ', e:'🦛' }, { w:'キリン', e:'🦒' }, { w:'クマ', e:'🐻' },
  { w:'ケーキ', e:'🍰' }, { w:'コアラ', e:'🐨' }, { w:'サメ', e:'🦈' }, { w:'シマウマ', e:'🦓' },
  { w:'スイカ', e:'🍉' }, { w:'タコ', e:'🐙' }, { w:'チーズ', e:'🧀' }, { w:'トマト', e:'🍅' },
  { w:'ネコ', e:'🐱' }, { w:'ヘビ', e:'🐍' }, { w:'バナナ', e:'🍌' }, { w:'ライオン', e:'🦁' },
];

// ★カスタマイズポイント: 絵文字選択肢
const EMOJI_CHOICES = ['😀','🍎','🐶','🐱','🌸','⭐','🌈','🍰','🚗','⚽','🎈','💧','🌙','☀️','🦋','🐟','🍓','🍙','🚀','🎵'];

// LocalStorage キー
const KEY_MASTERED = 'kkm_v2_mastered';
const KEY_WORDS    = 'kkm_v2_words';
const KEY_COUNT    = 'kkm_v2_count';

/* ──────────────────────────────────────────────────────────────
   2. 音と演出（Web Audio API でかんたんな効果音）
   ────────────────────────────────────────────────────────────── */
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playTone(freq, type, duration, vol = 0.1) {
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}
const playPingPong = () => { initAudio(); playTone(659.25, 'sine', 0.15, 0.1); setTimeout(() => playTone(880, 'sine', 0.3, 0.1), 100); };
const playBuzzer   = () => { initAudio(); playTone(150, 'square', 0.2, 0.05); };
const playFanfare  = () => { initAudio(); [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.4, 0.15), i*150)); };
const playPickup   = () => { initAudio(); playTone(880, 'sine', 0.1); setTimeout(() => playTone(1108, 'sine', 0.15), 80); };

function burstConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const colors = ['#fde68a','#fca5a5','#bae6fd','#a7f3d0','#c7d2fe','#fbcfe8'];
  const particles = Array.from({ length: 80 }, () => ({
    x: canvas.width/2, y: canvas.height/2,
    r: Math.random()*8+4,
    dx: Math.random()*12-6, dy: Math.random()*-12-4,
    color: colors[Math.floor(Math.random()*colors.length)],
    tilt: Math.random()*0.07+0.05, ang: 0
  }));
  function render() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let active = 0;
    particles.forEach(p => {
      p.ang += p.tilt;
      p.y += (Math.cos(p.ang)+1+p.r/2)/2;
      p.x += Math.sin(p.ang)*2 + p.dx;
      p.dy += 0.15; p.y += p.dy;
      if (p.y <= canvas.height) active++;
      ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color;
      ctx.moveTo(p.x+p.r, p.y); ctx.lineTo(p.x, p.y+p.r); ctx.stroke();
    });
    if (active > 0) requestAnimationFrame(render);
  }
  render();
}

/* ──────────────────────────────────────────────────────────────
   3. KanjiVG（書き順データ）取得 ── オンライン共有データを利用
   ────────────────────────────────────────────────────────────── */
const kanjiPathsCache = {};
async function fetchKanjiVG(char) {
  if (kanjiPathsCache[char]) return kanjiPathsCache[char];
  const hex = char.charCodeAt(0).toString(16).padStart(5, '0');
  const url = `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${hex}.svg`;
  try {
    const res = await fetch(url); if (!res.ok) throw new Error();
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const paths = Array.from(doc.querySelectorAll('path')).map(p => p.getAttribute('d')).filter(Boolean);
    kanjiPathsCache[char] = paths; return paths;
  } catch (e) { return null; }
}

// path文字列から、線の始点(s)と終点(e)を 0〜1 の比率で取得
function getStartEndPoints(pathStr) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  const p = document.createElementNS(svgNS, 'path');
  p.setAttribute('d', pathStr); svg.appendChild(p);
  document.body.appendChild(svg);
  const len = p.getTotalLength();
  const s = p.getPointAtLength(0), e = p.getPointAtLength(len);
  document.body.removeChild(svg);
  return { s: { x: s.x/109, y: s.y/109 }, e: { x: e.x/109, y: e.y/109 } };
}

/* ──────────────────────────────────────────────────────────────
   4. カスタムフック ── useLocalStorage
   ────────────────────────────────────────────────────────────── */
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { const r = localStorage.getItem(key); return r != null ? JSON.parse(r) : initial; }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

/* ──────────────────────────────────────────────────────────────
   5. アイコン（lucide風インラインSVG・依存ゼロ）
   ────────────────────────────────────────────────────────────── */
const SvgIcon = ({ size=20, className='', children }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>{children}</svg>
);
const IconPencil   = (p) => <SvgIcon {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></SvgIcon>;
const IconBook     = (p) => <SvgIcon {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></SvgIcon>;
const IconSparkle  = (p) => <SvgIcon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></SvgIcon>;
const IconRotate   = (p) => <SvgIcon {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></SvgIcon>;
const IconX        = (p) => <SvgIcon {...p}><path d="M18 6 6 18M6 6l12 12"/></SvgIcon>;
const IconPlay     = (p) => <SvgIcon {...p}><path d="M6 4l14 8-14 8z"/></SvgIcon>;
const IconPlus     = (p) => <SvgIcon {...p}><path d="M12 5v14M5 12h14"/></SvgIcon>;
const IconTrash    = (p) => <SvgIcon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></SvgIcon>;
const IconBulb     = (p) => <SvgIcon {...p}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 4 12.7c-.7.6-1 1.4-1 2.3v1H9v-1c0-.9-.3-1.7-1-2.3A7 7 0 0 1 12 2z"/></SvgIcon>;
const IconStar     = (p) => <SvgIcon {...p}><path d="M12 2l3 7 7 .8-5 5 1.5 7L12 18l-6.5 3.8L7 14l-5-5L9 8z"/></SvgIcon>;
const IconCheck    = (p) => <SvgIcon {...p}><path d="m5 12 5 5L20 7"/></SvgIcon>;
const IconSettings = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></SvgIcon>;

/* ──────────────────────────────────────────────────────────────
   6. <Header> ── アプリのタイトル＆右側にメニュー類
   ────────────────────────────────────────────────────────────── */
function Header({ view, setView, mastered, onReset }) {
  return (
    <nav className="bg-white border-b-4 border-amber-500 px-4 md:px-6 py-2.5 flex justify-between items-center shadow-sm z-10 sticky top-0">
      {/* 左：ロゴ + アプリ名 */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center shadow-md">
          <IconPencil size={20}/>
        </div>
        <h1 className="text-sm md:text-xl font-black text-slate-700 tracking-tight leading-tight">
          ひらがな・カタカナ<br className="md:hidden"/>かきかたマスター
        </h1>
      </div>

      {/* 中央：ビュー切替タブ（書く / ことばあつめ） */}
      <div className="hidden sm:flex bg-amber-50 rounded-full p-1 shadow-inner border border-amber-100">
        <button
          onClick={() => setView('practice')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-black transition-all active:scale-95 ${
            view === 'practice' ? 'bg-amber-400 text-white shadow' : 'text-amber-700 hover:bg-amber-100'
          }`}>
          <IconPencil size={16}/> もじをかく
        </button>
        <button
          onClick={() => setView('words')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-black transition-all active:scale-95 ${
            view === 'words' ? 'bg-amber-400 text-white shadow' : 'text-amber-700 hover:bg-amber-100'
          }`}>
          <IconBook size={16}/> ことばずかん
        </button>
      </div>

      {/* 右：マスター数 + リセット */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <div className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-black text-xs md:text-sm shadow-inner flex items-center gap-1">
          <IconStar size={14}/> {mastered.length}
        </div>
        <button onClick={onReset}
          title="データをリセット"
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-all active:scale-95 shadow-sm">
          <IconSettings size={18}/>
        </button>
      </div>
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────
   7. <Footer> ── 著作権 + 開発者リンク
   ────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200 pt-3 pb-2 text-center text-sm text-slate-500 font-bold shadow-sm">
      ©2026 ひらがな・カタカナかきかたマスター ・
      <a href="https://note.com/cute_borage86" target="_blank" rel="noopener noreferrer"
         className="text-amber-600 hover:text-amber-700 hover:underline ml-1">
        GIGA山
      </a>
    </footer>
  );
}

/* ──────────────────────────────────────────────────────────────
   8. <ModeTabs> ── スマホ用のビュー切替（Header外）
   ────────────────────────────────────────────────────────────── */
function ModeTabsMobile({ view, setView }) {
  return (
    <div className="sm:hidden flex bg-white rounded-full p-1 shadow-sm border border-amber-100 mx-3 mt-2">
      <button onClick={() => setView('practice')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-sm font-black transition-all active:scale-95 ${
          view === 'practice' ? 'bg-amber-400 text-white shadow' : 'text-amber-700'
        }`}>
        <IconPencil size={14}/> もじをかく
      </button>
      <button onClick={() => setView('words')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-sm font-black transition-all active:scale-95 ${
          view === 'words' ? 'bg-amber-400 text-white shadow' : 'text-amber-700'
        }`}>
        <IconBook size={14}/> ことばずかん
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   9. <KanaTable> ── 50音表（マスター済み文字に💮）
   ────────────────────────────────────────────────────────────── */
function KanaTable({ kanaMode, setKanaMode, mastered, currentChar, onSelect, onSequence, onRandom }) {
  const table = kanaMode === 'katakana' ? KATA_TABLE : HIRA_TABLE;
  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-amber-100 p-3 md:p-4 flex flex-col h-full">
      {/* ひらがな/カタカナ切替 */}
      <div className="flex gap-2 mb-3 shrink-0">
        <button onClick={() => setKanaMode('hiragana')}
          className={`flex-1 py-2 rounded-xl font-black text-base md:text-lg transition-all active:scale-95 border-2 ${
            kanaMode === 'hiragana' ? 'bg-amber-400 text-white border-amber-500 shadow' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>ひらがな</button>
        <button onClick={() => setKanaMode('katakana')}
          className={`flex-1 py-2 rounded-xl font-black text-base md:text-lg transition-all active:scale-95 border-2 ${
            kanaMode === 'katakana' ? 'bg-amber-400 text-white border-amber-500 shadow' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>カタカナ</button>
      </div>

      {/* 50音グリッド */}
      <div className="flex-1 overflow-y-auto bg-amber-50/40 rounded-xl p-2 md:p-3 border border-amber-100">
        <div className="grid grid-cols-5 gap-1.5 md:gap-2 max-w-sm mx-auto">
          {table.map((char, i) => {
            if (!char) return <div key={i} className="aspect-square"/>;
            const isMastered = mastered.includes(char);
            const isCurrent  = currentChar === char;
            return (
              <button key={i}
                onClick={() => onSelect(char)}
                className={`aspect-square rounded-lg font-black text-2xl md:text-3xl border-2 shadow-sm relative transition-all active:scale-95 ${
                  isCurrent ? 'bg-sky-400 text-white border-sky-500 scale-110 z-10 shadow-lg'
                  : isMastered ? 'bg-amber-100 text-amber-700 border-amber-400'
                  : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50'
                }`}>
                {char}
                {isMastered && !isCurrent && (
                  <span className="absolute -top-1 -right-1 text-xs">💮</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 連続練習モード */}
      <div className="flex gap-2 mt-3 shrink-0">
        <button onClick={onSequence}
          className="flex-1 py-2.5 rounded-xl font-black text-sm md:text-base bg-emerald-400 text-white shadow border-b-4 border-emerald-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 flex items-center justify-center gap-1.5">
          <IconCheck size={16}/> あいうえお<span className="hidden md:inline">じゅん</span>
        </button>
        <button onClick={onRandom}
          className="flex-1 py-2.5 rounded-xl font-black text-sm md:text-base bg-violet-400 text-white shadow border-b-4 border-violet-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 flex items-center justify-center gap-1.5">
          <IconSparkle size={16}/> ばらばら
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   10. <PracticeBoard> ── 練習キャンバス（筆順判定）
   ────────────────────────────────────────────────────────────── */
const TOLERANCE = 0.18; // 始点・終点の許容距離（0〜1）

function PracticeBoard({ char, paths, onMastered, practiceCount }) {
  const writeRef = useRef(null);
  const inkRef   = useRef(null);
  const guideRef = useRef(null);
  const wrapRef  = useRef(null);

  const [currentStroke, setCurrentStroke] = useState(0);
  const [isCleared, setIsCleared]   = useState(false);
  const [showAnime, setShowAnime]   = useState(false);
  const [mistaken, setMistaken]     = useState(false);
  const drawingRef = useRef(false);
  const lastRef    = useRef({ x: 0, y: 0 });

  // 文字が切り替わったら状態リセット
  useEffect(() => {
    setCurrentStroke(0); setIsCleared(false); setMistaken(false); setShowAnime(false);
    clearAll();
    if (paths) requestAnimationFrame(() => { resize(); redrawGuide(); });
  }, [char, paths]);

  // リサイズ追従
  useEffect(() => {
    const onR = () => { resize(); redrawGuide(); redrawInk(); };
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  });

  function clearAll() {
    [writeRef, inkRef, guideRef].forEach(r => {
      const c = r.current; if (!c) return;
      const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height);
    });
  }

  function resize() {
    const wrap = wrapRef.current; if (!wrap) return;
    const size = Math.min(wrap.clientWidth, wrap.clientHeight);
    if (size === 0) return;
    [writeRef, inkRef, guideRef].forEach(r => {
      if (r.current) { r.current.width = size; r.current.height = size; }
    });
  }
  function redrawGuide() {
    const c = guideRef.current; if (!c || !paths) return;
    const ctx = c.getContext('2d'); const s = c.width;
    ctx.clearRect(0,0,s,s);
    ctx.save(); ctx.scale(s/109, s/109);
    ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    paths.forEach(p => ctx.stroke(new Path2D(p)));
    ctx.restore();
  }
  function redrawInk() {
    const c = inkRef.current; if (!c || !paths) return;
    const ctx = c.getContext('2d'); const s = c.width;
    ctx.clearRect(0,0,s,s); if (currentStroke === 0) return;
    ctx.save(); ctx.scale(s/109, s/109);
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < currentStroke; i++) ctx.stroke(new Path2D(paths[i]));
    ctx.restore();
  }

  useEffect(() => { redrawGuide(); redrawInk(); /* eslint-disable-line */ }, [currentStroke, paths]);

  function startDraw(e) {
    if (!paths || isCleared) return;
    e.preventDefault?.();
    initAudio();
    const c = writeRef.current; const rect = c.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const py = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    if (currentStroke >= paths.length) return;
    const target = getStartEndPoints(paths[currentStroke]).s;
    const dist = Math.hypot(px/c.width - target.x, py/c.height - target.y);
    if (dist > TOLERANCE) { onMistake(); return; }
    drawingRef.current = true; lastRef.current = { x: px, y: py };
    const ctx = c.getContext('2d');
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = c.width * 0.07; ctx.strokeStyle = 'rgba(14,165,233,0.75)';
    ctx.beginPath(); ctx.moveTo(px, py); ctx.stroke();
  }
  function moveDraw(e) {
    if (!drawingRef.current) return;
    e.preventDefault?.();
    const c = writeRef.current; const rect = c.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const py = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const ctx = c.getContext('2d');
    ctx.beginPath(); ctx.moveTo(lastRef.current.x, lastRef.current.y); ctx.lineTo(px, py); ctx.stroke();
    lastRef.current = { x: px, y: py };
  }
  function endDraw() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const c = writeRef.current; if (!paths) return;
    const target = getStartEndPoints(paths[currentStroke]).e;
    const { x, y } = lastRef.current;
    const dist = Math.hypot(x/c.width - target.x, y/c.height - target.y);
    const ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
    if (dist < TOLERANCE) {
      const next = currentStroke + 1;
      setCurrentStroke(next);
      if (next >= paths.length) {
        // 完成！
        setIsCleared(true);
        playFanfare(); burstConfetti();
        onMastered(char, !mistaken);
      } else {
        playPingPong();
      }
    } else {
      onMistake();
    }
  }
  function onMistake() {
    setMistaken(true); playBuzzer();
    setShowAnime(true); // 自動で書き順アニメ
  }
  function restart() {
    setCurrentStroke(0); setIsCleared(false); setMistaken(false);
    clearAll(); redrawGuide();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-orange-100 p-3 md:p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-2 shrink-0">
        <span className="text-xs md:text-sm font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
          {char ? `「${char}」を なぞって かこう` : 'もじを えらんでね 👆'}
        </span>
        {char && (
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            🏆 {practiceCount[char] || 0} かい
          </span>
        )}
      </div>

      {/* キャンバスエリア */}
      <div ref={wrapRef} className="flex-1 flex items-center justify-center min-h-0 relative w-full">
        <div className="relative aspect-square h-full max-h-[420px] w-auto bg-white rounded-2xl border-4 border-orange-200 shadow-inner overflow-hidden">
          {/* 補助線 */}
          <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-amber-200 pointer-events-none"/>
          <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-amber-200 pointer-events-none"/>
          <canvas ref={guideRef} className="absolute inset-0 w-full h-full z-0"/>
          <canvas ref={inkRef}   className="absolute inset-0 w-full h-full z-10"/>
          <canvas ref={writeRef} className="absolute inset-0 w-full h-full z-20 touch-none cursor-crosshair"
            onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}
          />
          {!char && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-7xl pointer-events-none">？</div>
          )}
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="flex gap-2 mt-3 shrink-0">
        <button onClick={restart} disabled={!char}
          className="flex-1 py-2.5 rounded-xl font-black text-sm md:text-base bg-orange-50 text-orange-600 shadow-sm border-b-4 border-orange-200 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-40 flex items-center justify-center gap-1.5">
          <IconRotate size={16}/> やりなおし
        </button>
        <button onClick={() => setShowAnime(true)} disabled={!char}
          className="flex-1 py-2.5 rounded-xl font-black text-sm md:text-base bg-sky-100 text-sky-600 shadow-sm border-b-4 border-sky-300 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-40 flex items-center justify-center gap-1.5">
          <IconPlay size={16}/> かきじゅん
        </button>
      </div>

      {/* 書き順アニメモーダル */}
      {showAnime && paths && (
        <StrokeOrderAnime paths={paths} char={char} onClose={() => setShowAnime(false)} />
      )}
      {/* よくできましたポップアップ */}
      {isCleared && <ExcellentPopup />}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   11. <StrokeOrderAnime> ── 書き順アニメ表示
   ────────────────────────────────────────────────────────────── */
function StrokeOrderAnime({ paths, char, onClose }) {
  const svgRef = useRef(null);
  const [speed, setSpeed] = useState(5);
  const [playing, setPlaying] = useState(false);
  const lengthsRef = useRef([]);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    svg.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const bgG = document.createElementNS(svgNS,'g'); svg.appendChild(bgG);
    const stG = document.createElementNS(svgNS,'g'); svg.appendChild(stG);
    const nuG = document.createElementNS(svgNS,'g'); svg.appendChild(nuG);
    const lens = []; const placed = [];

    paths.forEach((d, i) => {
      const bg = document.createElementNS(svgNS,'path');
      bg.setAttribute('d', d); bg.setAttribute('stroke', '#fef3c7'); bg.setAttribute('stroke-width','6');
      bg.setAttribute('fill','none'); bg.setAttribute('stroke-linecap','round'); bg.setAttribute('stroke-linejoin','round');
      bgG.appendChild(bg);

      // 描画用パス（始めは隠す）
      const tmpSvg = document.createElementNS(svgNS,'svg');
      const tp = document.createElementNS(svgNS,'path'); tp.setAttribute('d', d);
      tmpSvg.appendChild(tp); document.body.appendChild(tmpSvg);
      const len = tp.getTotalLength()+8;
      const sp  = tp.getPointAtLength(0);
      document.body.removeChild(tmpSvg);
      lens.push(len);

      const p = document.createElementNS(svgNS,'path');
      p.setAttribute('d', d); p.setAttribute('stroke', '#0f172a'); p.setAttribute('stroke-width','6');
      p.setAttribute('fill','none'); p.setAttribute('stroke-linecap','round'); p.setAttribute('stroke-linejoin','round');
      p.id = `kkm-anime-${i}`;
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len; p.style.opacity = '0';
      stG.appendChild(p);

      // 番号バッジ（重ならないように少し位置調整）
      let cx = Math.max(8, Math.min(101, sp.x - 12));
      let cy = Math.max(8, Math.min(101, sp.y - 12));
      let collision = true, ang = 0, rad = 0, step = 0; const bx = cx, by = cy;
      while (collision && step < 50) {
        collision = false;
        if (cx < 8 || cx > 101 || cy < 8 || cy > 101) collision = true;
        if (!collision) for (const q of placed) if (Math.hypot(cx-q.x, cy-q.y) < 13) { collision = true; break; }
        if (collision) { step++; ang += Math.PI/3; if (step % 6 === 0) rad += 6; cx = bx+Math.cos(ang)*(6+rad); cy = by+Math.sin(ang)*(6+rad); }
      }
      placed.push({ x: cx, y: cy });
      const g = document.createElementNS(svgNS,'g'); g.id = `kkm-num-${i}`; g.style.opacity = '0';
      const c = document.createElementNS(svgNS,'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r','5.5');
      c.setAttribute('fill','#ffffff'); c.setAttribute('stroke','#f97316'); c.setAttribute('stroke-width','1.2');
      const t = document.createElementNS(svgNS,'text');
      t.setAttribute('x', cx); t.setAttribute('y', cy+0.5);
      t.setAttribute('text-anchor','middle'); t.setAttribute('dominant-baseline','central');
      t.setAttribute('font-size','6'); t.setAttribute('font-weight','900'); t.setAttribute('fill','#f97316');
      t.textContent = (i+1).toString();
      g.appendChild(c); g.appendChild(t); nuG.appendChild(g);
    });

    lengthsRef.current = lens;
  }, [paths]);

  async function play() {
    if (playing) return; setPlaying(true); initAudio();
    paths.forEach((_, i) => {
      const p = document.getElementById(`kkm-anime-${i}`);
      const n = document.getElementById(`kkm-num-${i}`);
      if (p) { p.style.transition = 'none'; p.style.strokeDashoffset = lengthsRef.current[i]; p.style.opacity = '0'; }
      if (n) n.style.opacity = '0';
    });
    await new Promise(r => setTimeout(r, 100));
    for (let i = 0; i < paths.length; i++) {
      const p = document.getElementById(`kkm-anime-${i}`);
      const n = document.getElementById(`kkm-num-${i}`); if (!p) continue;
      if (n) n.style.opacity = '1';
      await new Promise(r => setTimeout(r, 400));
      const len = lengthsRef.current[i] || 50;
      const dur = Math.max(220, (len/50) * (11-speed) * 130);
      p.style.opacity = '1';
      p.style.transition = `stroke-dashoffset ${dur}ms linear`;
      void p.getBoundingClientRect();
      p.style.strokeDashoffset = '0';
      playTone(500 + i*40, 'triangle', dur/1000, 0.05);
      await new Promise(r => setTimeout(r, dur+50));
    }
    setPlaying(false);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
         onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-sky-200 p-4 md:p-6 max-w-md w-full"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-black text-sky-700 bg-sky-100 px-3 py-1 rounded-full">
            「{char}」のかきじゅん
          </span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95">
            <IconX size={16}/>
          </button>
        </div>
        <div className="aspect-square bg-white rounded-2xl border-4 border-sky-200 shadow-inner relative overflow-hidden mb-3">
          <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-sky-200"/>
          <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-sky-200"/>
          <svg ref={svgRef} viewBox="0 0 109 109" className="w-full h-full relative z-10"/>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={play} disabled={playing}
            className="px-5 py-2.5 rounded-xl font-black text-white bg-sky-400 shadow border-b-4 border-sky-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-50 flex items-center gap-1.5">
            <IconPlay size={18}/> {playing ? 'さいせいちゅう' : 'みる'}
          </button>
          <div className="flex-1">
            <input type="range" min="1" max="10" value={speed} onChange={(e) => setSpeed(+e.target.value)}
              className="w-full accent-sky-500"/>
            <div className="flex justify-between text-[10px] text-sky-500 font-bold">
              <span>🐢 ゆっくり</span><span>はやい 🐇</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   12. <ExcellentPopup>
   ────────────────────────────────────────────────────────────── */
function ExcellentPopup() {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(true); const t = setTimeout(() => setShow(false), 1400); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed inset-0 z-[150] pointer-events-none flex items-center justify-center transition-all duration-500 ${
      show ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
    }`}>
      <div className="bg-white/95 backdrop-blur px-6 md:px-10 py-4 md:py-6 rounded-3xl shadow-2xl border-4 border-emerald-400 -rotate-3">
        <span className="text-3xl md:text-6xl font-black text-emerald-500 tracking-widest">💮 よくできました</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   13. <WordCollection> ── ことばあつめ画面
   ────────────────────────────────────────────────────────────── */
function WordCollection({ kanaMode, setKanaMode, mastered, words, onAdd, onDelete }) {
  const [addOpen, setAddOpen] = useState(false);

  const collected = words.filter(w => w.kanaMode === kanaMode);
  const hints = kanaMode === 'katakana' ? WORD_HINTS_KATA : WORD_HINTS_HIRA;
  const list  = kanaMode === 'katakana' ? KATA_LIST : HIRA_LIST;
  const availableHints = hints.filter(h => h.w.split('').every(c => mastered.includes(c)));

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-amber-100 p-3 md:p-5 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-black text-amber-700">
          <IconBook size={22}/> あつめた ことば
          <span className="ml-2 text-xs bg-amber-100 px-2 py-0.5 rounded-full">{collected.length}</span>
        </h2>
        <div className="flex bg-amber-50 rounded-full p-1 border border-amber-100">
          <button onClick={() => setKanaMode('hiragana')}
            className={`px-3 py-1 rounded-full text-xs md:text-sm font-black transition-all active:scale-95 ${
              kanaMode === 'hiragana' ? 'bg-amber-400 text-white shadow' : 'text-amber-700'
            }`}>ひらがな</button>
          <button onClick={() => setKanaMode('katakana')}
            className={`px-3 py-1 rounded-full text-xs md:text-sm font-black transition-all active:scale-95 ${
              kanaMode === 'katakana' ? 'bg-amber-400 text-white shadow' : 'text-amber-700'
            }`}>カタカナ</button>
        </div>
      </div>

      {/* あつめた ことば 一覧 */}
      <div className="flex-1 overflow-y-auto bg-amber-50/40 rounded-xl p-3 border border-amber-100 mb-3">
        {collected.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 py-10">
            <IconBook size={48} className="opacity-50"/>
            <p className="font-black">まだ ことばが ありません</p>
            <p className="text-xs">したの「＋ ふやす」ボタンから あたらしい ことばを ついかしよう！</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {collected.slice().reverse().map(w => (
              <div key={w.id} className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-3 flex flex-col items-center gap-1 relative group">
                <span className="text-4xl">{w.emoji || '✨'}</span>
                <span className="font-black text-lg text-slate-700">{w.text}</span>
                <button onClick={() => onDelete(w.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-50 text-rose-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all active:scale-95">
                  <IconTrash size={12}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ヒント */}
      {availableHints.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-2.5 mb-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-black text-yellow-700 mb-1.5">
            <IconBulb size={14}/> いまの じで つくれる ことば
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableHints.slice(0, 8).map(h => (
              <button key={h.w} onClick={() => onAdd({ text: h.w, emoji: h.e, kanaMode })}
                className="bg-white border border-yellow-300 rounded-full px-2.5 py-1 text-xs font-black text-yellow-700 hover:bg-yellow-100 transition-all active:scale-95 shadow-sm">
                {h.e} {h.w}
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => setAddOpen(true)}
        className="py-3 rounded-xl font-black text-base md:text-lg bg-amber-400 text-white shadow border-b-4 border-amber-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 flex items-center justify-center gap-2 shrink-0">
        <IconPlus size={20}/> あたらしい ことばを ふやす
      </button>

      {addOpen && (
        <WordAddModal kanaMode={kanaMode} mastered={mastered} list={list}
          onCancel={() => setAddOpen(false)}
          onSave={(w) => { onAdd(w); setAddOpen(false); }}/>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   14. <WordAddModal> ── 文字を選んで言葉を作る
   ────────────────────────────────────────────────────────────── */
function WordAddModal({ kanaMode, mastered, list, onCancel, onSave }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0]);
  const table = kanaMode === 'katakana' ? KATA_TABLE : HIRA_TABLE;
  const canSave = text.length >= 1;

  function addChar(c) { if (text.length < 8) setText(t => t + c); }
  function backspace() { setText(t => t.slice(0, -1)); }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3" onClick={onCancel}>
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-4 md:p-6 max-w-lg w-full max-h-[92vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-black text-lg text-amber-700 flex items-center gap-2">
            <IconPlus size={20}/> ことばを つくろう
          </h3>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95">
            <IconX size={16}/>
          </button>
        </div>

        {/* プレビュー */}
        <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-3 md:p-4 mb-3 flex items-center gap-3 min-h-[80px]">
          <span className="text-4xl md:text-5xl">{emoji}</span>
          <span className="flex-1 text-2xl md:text-3xl font-black text-slate-700 break-all">
            {text || <span className="text-slate-300">なにを かこうかな？</span>}
          </span>
          {text.length > 0 && (
            <button onClick={backspace}
              className="w-9 h-9 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center transition-all active:scale-95">
              <IconX size={18}/>
            </button>
          )}
        </div>

        {/* 絵文字選択 */}
        <div className="mb-3">
          <div className="text-xs font-black text-slate-500 mb-1.5">えもじ を えらぼう</div>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`w-9 h-9 md:w-10 md:h-10 text-xl md:text-2xl rounded-lg border-2 transition-all active:scale-95 ${
                  emoji === e ? 'bg-amber-100 border-amber-400 scale-110' : 'bg-white border-slate-200'
                }`}>{e}</button>
            ))}
          </div>
        </div>

        {/* かなボタン（マスター済みのみアクティブ） */}
        <div className="mb-3">
          <div className="text-xs font-black text-slate-500 mb-1.5">
            まだ おぼえてない じは つかえないよ
          </div>
          <div className="grid grid-cols-5 gap-1.5 bg-amber-50/40 p-2 rounded-xl border border-amber-100">
            {table.map((c, i) => {
              if (!c) return <div key={i} className="aspect-square"/>;
              const ok = mastered.includes(c);
              return (
                <button key={i} disabled={!ok} onClick={() => addChar(c)}
                  className={`aspect-square rounded-lg font-black text-xl md:text-2xl border-2 transition-all active:scale-95 ${
                    ok ? 'bg-white border-amber-300 text-amber-700 hover:bg-amber-100 shadow-sm'
                       : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60'
                  }`}>{c}</button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-black text-sm bg-slate-100 text-slate-500 shadow-sm border-b-4 border-slate-300 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2">
            やめる
          </button>
          <button disabled={!canSave}
            onClick={() => onSave({ text, emoji, kanaMode })}
            className="flex-[2] py-2.5 rounded-xl font-black text-base bg-amber-400 text-white shadow border-b-4 border-amber-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
            <IconCheck size={18}/> ずかんに ついか
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   15. <ResetModal>
   ────────────────────────────────────────────────────────────── */
function ResetModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-rose-300 p-6 max-w-sm w-full flex flex-col items-center gap-3"
           onClick={(e) => e.stopPropagation()}>
        <div className="text-rose-500 text-5xl">⚠️</div>
        <p className="text-base md:text-lg font-black text-slate-700 text-center leading-relaxed">
          いままで れんしゅうした<br/>データを ぜんぶ けしますか？
        </p>
        <div className="flex gap-2 w-full mt-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-black bg-slate-100 text-slate-500 shadow-sm border-b-4 border-slate-300 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2">やめる</button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-black bg-rose-500 text-white shadow border-b-4 border-rose-700 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2">けす</button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   16. <MainBoard> ── 練習画面（左：50音表 / 右：練習エリア）
   ────────────────────────────────────────────────────────────── */
function MainBoard({ kanaMode, setKanaMode, mastered, addMastered, practiceCount, bumpCount }) {
  const [currentChar, setCurrentChar] = useState(null);
  const [paths, setPaths] = useState(null);
  const [playMode, setPlayMode] = useState('free');

  // 文字選択
  const selectChar = useCallback(async (c, mode='free') => {
    setPlayMode(mode); setCurrentChar(c); setPaths(null);
    const p = await fetchKanjiVG(c);
    setPaths(p || []);
  }, []);

  // 連続モード（あいうえおじゅん／ばらばら）
  function startSequence() {
    const list = kanaMode === 'katakana' ? KATA_LIST : HIRA_LIST;
    const target = list.find(c => !mastered.includes(c)) || list[0];
    selectChar(target, 'sequential');
  }
  function startRandom() {
    const list = kanaMode === 'katakana' ? KATA_LIST : HIRA_LIST;
    let pool = list.filter(c => !mastered.includes(c));
    if (pool.length === 0) pool = list;
    const target = pool[Math.floor(Math.random()*pool.length)];
    selectChar(target, 'random');
  }
  function nextChar() {
    if (!currentChar) return;
    const list = kanaMode === 'katakana' ? KATA_LIST : HIRA_LIST;
    if (playMode === 'random') return startRandom();
    const idx = list.indexOf(currentChar);
    const nx  = list[(idx+1) % list.length];
    selectChar(nx, playMode);
  }

  // 完成したら呼ばれる
  function handleMastered(char, firstTry) {
    bumpCount(char);
    if (firstTry) addMastered(char);
    setTimeout(() => {
      if (playMode !== 'free') nextChar();
    }, 1500);
  }

  // 文字モード切替時にリセット
  useEffect(() => { setCurrentChar(null); setPaths(null); }, [kanaMode]);

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 p-3 md:p-4 min-h-0 overflow-hidden">
      <KanaTable kanaMode={kanaMode} setKanaMode={setKanaMode}
        mastered={mastered} currentChar={currentChar}
        onSelect={(c) => selectChar(c,'free')}
        onSequence={startSequence} onRandom={startRandom}/>
      <PracticeBoard char={currentChar} paths={paths}
        onMastered={handleMastered} practiceCount={practiceCount}/>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   17. <App> ── ルートコンポーネント
   ────────────────────────────────────────────────────────────── */
function App() {
  const [view, setView] = useState('practice');         // 'practice' | 'words'
  const [kanaMode, setKanaMode] = useState('hiragana'); // 'hiragana' | 'katakana'
  const [mastered, setMastered] = useLocalStorage(KEY_MASTERED, []);
  const [words, setWords]       = useLocalStorage(KEY_WORDS, []);
  const [practiceCount, setPracticeCount] = useLocalStorage(KEY_COUNT, {});
  const [resetOpen, setResetOpen] = useState(false);

  const addMastered = useCallback((char) => {
    setMastered(prev => prev.includes(char) ? prev : [...prev, char]);
  }, [setMastered]);
  const bumpCount = useCallback((char) => {
    setPracticeCount(prev => ({ ...prev, [char]: (prev[char] || 0) + 1 }));
  }, [setPracticeCount]);

  const addWord = useCallback((w) => {
    setWords(prev => [...prev, { id: Date.now() + Math.random(), ...w, date: Date.now() }]);
    playPickup();
  }, [setWords]);
  const deleteWord = useCallback((id) => {
    setWords(prev => prev.filter(w => w.id !== id));
  }, [setWords]);

  const resetAll = () => { localStorage.clear(); window.location.reload(); };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/40" style={{ fontFamily: "'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', sans-serif", fontWeight: 700 }}>
      <canvas id="confettiCanvas" className="fixed inset-0 pointer-events-none z-[400]"/>
      <Header view={view} setView={setView} mastered={mastered} onReset={() => setResetOpen(true)}/>
      <ModeTabsMobile view={view} setView={setView}/>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {view === 'practice' ? (
          <MainBoard kanaMode={kanaMode} setKanaMode={setKanaMode}
            mastered={mastered} addMastered={addMastered}
            practiceCount={practiceCount} bumpCount={bumpCount}/>
        ) : (
          <div className="flex-1 p-3 md:p-4 min-h-0 overflow-hidden">
            <WordCollection kanaMode={kanaMode} setKanaMode={setKanaMode}
              mastered={mastered} words={words}
              onAdd={addWord} onDelete={deleteWord}/>
          </div>
        )}
      </main>

      <Footer/>

      {resetOpen && <ResetModal onCancel={() => setResetOpen(false)} onConfirm={resetAll}/>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   18. レンダリング ── DOMに描き出す
   ────────────────────────────────────────────────────────────── */
const rootEl = document.getElementById('root');
ReactDOM.createRoot(rootEl).render(<App/>);
