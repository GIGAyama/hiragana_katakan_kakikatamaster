/* ==============================================================
   ひらがな・カタカナ かきかたマスター ＋ ことばあつめ
   --------------------------------------------------------------
   小学１年生のための、ひらがな・カタカナ反復練習＋単語収集アプリ

   ＜たのしさUPの追加機能＞
   - 音声よみあげ（タップで読んでくれる）
   - マスコット「ひよこさん」のおうえん
   - 連続学習日数のストリーク 🔥
   - レベル（しょうごう）と バッジ図鑑 🎖
   - きょうの もじ（デイリーチャレンジ）

   先生がカスタマイズしたい場合は、下の "// ★カスタマイズポイント"
   と書かれた箇所を中心に書き換えてみてください。
   ============================================================== */

const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ──────────────────────────────────────────────────────────────
   1. データ定数
   ────────────────────────────────────────────────────────────── */

// ★カスタマイズポイント: 50音表
const HIRA_TABLE = [
  'あ','い','う','え','お',  'か','き','く','け','こ',
  'さ','し','す','せ','そ',  'た','ち','つ','て','と',
  'な','に','ぬ','ね','の',  'は','ひ','ふ','へ','ほ',
  'ま','み','む','め','も',  'や','' ,'ゆ','' ,'よ',
  'ら','り','る','れ','ろ',  'わ','' ,'' ,'' ,'を',  'ん','' ,'' ,'' ,''
];
const KATA_TABLE = [
  'ア','イ','ウ','エ','オ',  'カ','キ','ク','ケ','コ',
  'サ','シ','ス','セ','ソ',  'タ','チ','ツ','テ','ト',
  'ナ','ニ','ヌ','ネ','ノ',  'ハ','ヒ','フ','ヘ','ホ',
  'マ','ミ','ム','メ','モ',  'ヤ','' ,'ユ','' ,'ヨ',
  'ラ','リ','ル','レ','ロ',  'ワ','' ,'' ,'' ,'ヲ',  'ン','' ,'' ,'' ,''
];
const HIRA_LIST = HIRA_TABLE.filter(c => c);
const KATA_LIST = KATA_TABLE.filter(c => c);

// ★カスタマイズポイント: 「ことばあつめ」のヒント
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
const EMOJI_CHOICES = ['😀','🍎','🐶','🐱','🌸','⭐','🌈','🍰','🚗','⚽','🎈','💧','🌙','☀️','🦋','🐟','🍓','🍙','🚀','🎵'];

// ★カスタマイズポイント: レベル（しょうごう）
const LEVELS = [
  { min:  0, title: 'みならい',       icon: '🌱', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { min:  5, title: 'がんばりや',     icon: '🌷', color: 'bg-rose-100 text-rose-700 border-rose-300' },
  { min: 15, title: 'もじチャレンジャー', icon: '🌟', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { min: 30, title: 'もじはかせ',     icon: '📖', color: 'bg-sky-100 text-sky-700 border-sky-300' },
  { min: 50, title: 'もじマスター',   icon: '👑', color: 'bg-violet-100 text-violet-700 border-violet-300' },
  { min: 80, title: 'もじキング',     icon: '🏆', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { min: 92, title: 'でんせつの もじびと', icon: '🐉', color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300' },
];
function getCurrentLevel(masteredCount) {
  return [...LEVELS].reverse().find(l => masteredCount >= l.min) || LEVELS[0];
}

// ★カスタマイズポイント: バッジ（ごほうびシール）
const BADGES = [
  { id: 'first',     title: 'はじめの いっぽ',   icon: '🌱', desc: 'はじめての じを マスター',     check: ({m,w,s}) => m.length >= 1 },
  { id: 'hira5',     title: 'ひらがな ５じ',     icon: '🌷', desc: 'ひらがなを ５じ おぼえた',     check: ({m})     => m.filter(c => HIRA_LIST.includes(c)).length >= 5 },
  { id: 'hira23',    title: 'ひらがな はんぶん', icon: '🌸', desc: 'ひらがなを ２３じ おぼえた',   check: ({m})     => m.filter(c => HIRA_LIST.includes(c)).length >= 23 },
  { id: 'hiraAll',   title: 'ひらがな かんぺき', icon: '🌻', desc: 'ひらがなを ぜんぶ おぼえた',   check: ({m})     => HIRA_LIST.every(c => m.includes(c)) },
  { id: 'kata5',     title: 'カタカナ ５じ',     icon: '⭐', desc: 'カタカナを ５じ おぼえた',     check: ({m})     => m.filter(c => KATA_LIST.includes(c)).length >= 5 },
  { id: 'kata23',    title: 'カタカナ はんぶん', icon: '✨', desc: 'カタカナを ２３じ おぼえた',   check: ({m})     => m.filter(c => KATA_LIST.includes(c)).length >= 23 },
  { id: 'kataAll',   title: 'カタカナ かんぺき', icon: '🎀', desc: 'カタカナを ぜんぶ おぼえた',   check: ({m})     => KATA_LIST.every(c => m.includes(c)) },
  { id: 'word5',     title: 'ことば あつめ びと', icon: '🍎', desc: 'ことばを ５こ あつめた',       check: ({w})     => w.length >= 5 },
  { id: 'word20',    title: 'ことば コレクター', icon: '🍰', desc: 'ことばを ２０こ あつめた',     check: ({w})     => w.length >= 20 },
  { id: 'word50',    title: 'ことば はかせ',     icon: '👑', desc: 'ことばを ５０こ あつめた',     check: ({w})     => w.length >= 50 },
  { id: 'streak3',   title: '３にち つづけた',   icon: '🔥', desc: '３にち れんぞくで れんしゅう', check: ({s})     => s >= 3 },
  { id: 'streak7',   title: '１しゅうかん',      icon: '🚀', desc: '７にち れんぞくで れんしゅう', check: ({s})     => s >= 7 },
  { id: 'allKana',   title: 'もじキング！',      icon: '🏆', desc: 'ひらがな・カタカナ ぜんぶ',    check: ({m})     => HIRA_LIST.every(c => m.includes(c)) && KATA_LIST.every(c => m.includes(c)) },
];

// LocalStorage キー
const KEY_MASTERED = 'kkm_v2_mastered';        // 旧データ（マイグレーション用）
const KEY_PROGRESS = 'kkm_v3_progress';        // ★新：文字ごとの学習ステージ
const KEY_WORDS    = 'kkm_v2_words';
const KEY_COUNT    = 'kkm_v2_count';
const KEY_STREAK   = 'kkm_v2_streak';   // { count, lastDate }
const KEY_BADGES   = 'kkm_v2_badges';   // 取得済みバッジID
const KEY_VOICE    = 'kkm_v2_voice';    // 音声よみあげON/OFF

/* ──────────────────────────────────────────────────────────────
   学習ステージ（あたらしい設計）
   ────────────────────────────────────────────────────────────── */
// 0: 未学習
// 1: 書き順アニメをみた
// 2: なぞり書きを TRACE_REQUIRED 回 こなした
// 3: ガイドなしで FREE_REQUIRED 回 れんぞくでせいかい（ほぼマスター）
// 4: その文字を使ったことばを 1つ以上あつめた（完全マスター 💮）
const TRACE_REQUIRED = 2;
const FREE_REQUIRED  = 3;

const STAGE_INFO = [
  { key: 0, icon: '🔒', label: 'みがくぜん',    color: 'text-slate-400'   },
  { key: 1, icon: '📺', label: 'かきじゅん',   color: 'text-sky-500'     },
  { key: 2, icon: '✏️', label: 'なぞりがき',   color: 'text-emerald-500' },
  { key: 3, icon: '✒️', label: 'じぶんでかく', color: 'text-violet-500'  },
  { key: 4, icon: '💮', label: 'かんぺき',     color: 'text-amber-500'   },
];

function newStageObj(stage=0) {
  return { stage, traced: 0, free: 0, freeStreak: 0, sawAnime: false };
}
function getStage(progress, char) { return progress?.[char]?.stage ?? 0; }
function getMasteredList(progress) {
  return Object.keys(progress || {}).filter(c => progress[c].stage >= 4);
}
function getUsableInWordsList(progress) {
  // ステージ3以上の文字は「ことばあつめ」に使える（ことばを使うことでステージ4に到達できる）
  return Object.keys(progress || {}).filter(c => progress[c].stage >= 3);
}
function loadInitialProgress() {
  try {
    const r = localStorage.getItem(KEY_PROGRESS);
    if (r != null) return JSON.parse(r);
    // 旧 mastered からの移行（既存ユーザーの進捗を維持）
    const old = JSON.parse(localStorage.getItem(KEY_MASTERED) || '[]');
    const initial = {};
    old.forEach(c => {
      initial[c] = { stage: 4, traced: TRACE_REQUIRED, free: FREE_REQUIRED, freeStreak: FREE_REQUIRED, sawAnime: true };
    });
    return initial;
  } catch { return {}; }
}

/* ──────────────────────────────────────────────────────────────
   2. 音と演出
   ────────────────────────────────────────────────────────────── */
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playTone(freq, type, duration, vol = 0.1) {
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, audioCtx.currentTime);
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
const playBadge    = () => { initAudio(); [659.25, 783.99, 987.77, 1318.5].forEach((f, i) => setTimeout(() => playTone(f, 'triangle', 0.3, 0.12), i*120)); };

// 音声よみあげ（Web Speech API）
let cachedJaVoice = null;
function getJaVoice() {
  if (cachedJaVoice) return cachedJaVoice;
  if (!window.speechSynthesis) return null;
  const voices = speechSynthesis.getVoices();
  cachedJaVoice = voices.find(v => v.lang && v.lang.startsWith('ja')) || null;
  return cachedJaVoice;
}
function speakText(text, enabled = true) {
  if (!enabled || !text || !window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.9;
    u.pitch = 1.1;
    const v = getJaVoice(); if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) {}
}

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
   3. KanjiVG
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
function getStartEndPoints(pathStr) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  const p = document.createElementNS(svgNS, 'path');
  p.setAttribute('d', pathStr); svg.appendChild(p); document.body.appendChild(svg);
  const len = p.getTotalLength();
  const s = p.getPointAtLength(0), e = p.getPointAtLength(len);
  document.body.removeChild(svg);
  return { s: { x: s.x/109, y: s.y/109 }, e: { x: e.x/109, y: e.y/109 } };
}

/* ──────────────────────────────────────────────────────────────
   4. カスタムフック
   ────────────────────────────────────────────────────────────── */
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { const r = localStorage.getItem(key); return r != null ? JSON.parse(r) : initial; }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// 連続学習日数（ストリーク）
function useStreak() {
  const [state, setState] = useLocalStorage(KEY_STREAK, { count: 0, lastDate: null });
  // アプリ起動時に今日の日付をチェック
  useEffect(() => {
    const today = new Date().toDateString();
    if (state.lastDate === today) return; // 今日もう更新済み
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yesterday = y.toDateString();
    let newCount;
    if (state.lastDate === yesterday) newCount = (state.count || 0) + 1;
    else newCount = 1;
    setState({ count: newCount, lastDate: today });
    // eslint-disable-next-line
  }, []);
  return state.count || 0;
}

// きょうの もじ（毎日変わるデイリーチャレンジ）
function useDailyChallenge(kanaMode, mastered) {
  return useMemo(() => {
    const list = kanaMode === 'katakana' ? KATA_LIST : HIRA_LIST;
    const unmastered = list.filter(c => !mastered.includes(c));
    const pool = unmastered.length > 0 ? unmastered : list;
    // 今日の日付をシードに（同じ日は同じ文字）
    const today = new Date();
    const seed = today.getFullYear()*10000 + (today.getMonth()+1)*100 + today.getDate();
    const idx = seed % pool.length;
    return pool[idx];
  }, [kanaMode, mastered]);
}

// 取得済みバッジ管理
function useAchievements({ mastered, words, streak, earned, setEarned, onNew }) {
  useEffect(() => {
    const ctx = { m: mastered, w: words, s: streak };
    const nowEarned = BADGES.filter(b => b.check(ctx)).map(b => b.id);
    const fresh = nowEarned.filter(id => !earned.includes(id));
    if (fresh.length > 0) {
      setEarned(nowEarned);
      fresh.forEach(id => onNew && onNew(BADGES.find(b => b.id === id)));
    }
    // eslint-disable-next-line
  }, [mastered, words, streak]);
}

/* ──────────────────────────────────────────────────────────────
   5. アイコン（lucide風）
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
const IconVolume   = (p) => <SvgIcon {...p}><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></SvgIcon>;
const IconVolumeX  = (p) => <SvgIcon {...p}><path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></SvgIcon>;
const IconFlame    = (p) => <SvgIcon {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.4 0 2.5-1 2.5-2.5 0-1.2-.5-2.2-1.5-3 .5-1 1.5-1.5 3-1.5A4.5 4.5 0 0 1 19 14.5c0 4-3 7.5-7 7.5s-7-3-7-7c0-1.7.6-3.4 2-4.5C8 11.7 8.5 13 8.5 14.5zM13 12V8c0-1.8-1.2-3-3-3 .5 2-1 4-3 4 0 0 1.4 1 1.4 3.5"/></SvgIcon>;
const IconTrophy   = (p) => <SvgIcon {...p}><path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M6 5h12v6a6 6 0 0 1-12 0zM12 17v4M8 21h8"/></SvgIcon>;
const IconCalendar = (p) => <SvgIcon {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></SvgIcon>;

/* ──────────────────────────────────────────────────────────────
   6. <Mascot> ── ひよこさんが応援
   ────────────────────────────────────────────────────────────── */
function Mascot({ message, mood = 'happy', size = 'normal' }) {
  // mood: happy / cheer / wow / sad
  const face = { happy: '🐤', cheer: '🐥', wow: '🌟🐤', sad: '🐣' }[mood] || '🐤';
  const wrap = size === 'small' ? 'text-2xl' : 'text-4xl md:text-5xl';
  return (
    <div className="flex items-end gap-2">
      <div className={`${wrap} animate-bounce`} style={{ animationDuration: '2s' }}>{face}</div>
      {message && (
        <div className="relative bg-white border-2 border-amber-300 rounded-2xl rounded-bl-none px-3 py-1.5 shadow-sm">
          <span className="text-xs md:text-sm font-black text-amber-700">{message}</span>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   7. <LevelBadge> / <StreakBadge>
   ────────────────────────────────────────────────────────────── */
function LevelBadge({ masteredCount, onClick }) {
  const lv = getCurrentLevel(masteredCount);
  return (
    <button onClick={onClick}
      className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-black shadow-sm transition-all active:scale-95 ${lv.color}`}>
      <span>{lv.icon}</span><span>{lv.title}</span>
    </button>
  );
}
function StreakBadge({ streak }) {
  if (streak <= 0) return null;
  return (
    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border-2 border-orange-300 text-xs font-black shadow-sm">
      🔥 {streak}<span className="hidden md:inline">にち</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   8. <Header>
   ────────────────────────────────────────────────────────────── */
function Header({ view, setView, mastered, onReset, onOpenBadges, streak, voiceOn, setVoiceOn, earnedCount }) {
  return (
    <nav className="shrink-0 bg-white border-b-4 border-amber-500 px-3 md:px-6 py-1.5 md:py-2.5 flex justify-between items-center shadow-sm z-10 gap-2">
      {/* 左：ロゴ + アプリ名 */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0 min-w-0">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center shadow-md text-xl shrink-0">🐤</div>
        <h1 className="text-sm md:text-xl font-black text-slate-700 tracking-tight leading-tight truncate">
          ひらがな・カタカナ<br className="md:hidden"/>かきかたマスター
        </h1>
      </div>

      {/* 中央：ビュー切替 */}
      <div className="hidden sm:flex bg-amber-50 rounded-full p-1 shadow-inner border border-amber-100">
        <button onClick={() => setView('practice')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-black transition-all active:scale-95 ${
            view === 'practice' ? 'bg-amber-400 text-white shadow' : 'text-amber-700 hover:bg-amber-100'
          }`}><IconPencil size={16}/> もじをかく</button>
        <button onClick={() => setView('words')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-black transition-all active:scale-95 ${
            view === 'words' ? 'bg-amber-400 text-white shadow' : 'text-amber-700 hover:bg-amber-100'
          }`}><IconBook size={16}/> ことばずかん</button>
      </div>

      {/* 右：ステータス類 */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <StreakBadge streak={streak}/>
        <LevelBadge masteredCount={mastered.length} onClick={onOpenBadges}/>
        <button onClick={onOpenBadges} title="ごほうびシール"
          className="relative w-9 h-9 rounded-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700 flex items-center justify-center transition-all active:scale-95 shadow-sm">
          <IconTrophy size={18}/>
          {earnedCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{earnedCount}</span>
          )}
        </button>
        <button onClick={() => setVoiceOn(v => !v)} title="おとを よみあげる"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm ${
            voiceOn ? 'bg-sky-100 text-sky-700 hover:bg-sky-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}>
          {voiceOn ? <IconVolume size={18}/> : <IconVolumeX size={18}/>}
        </button>
        <button onClick={onReset} title="データをリセット"
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-all active:scale-95 shadow-sm">
          <IconSettings size={18}/>
        </button>
      </div>
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────
   9. <Footer>
   ────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="shrink-0 w-full bg-white border-t border-slate-200 py-1 text-center text-[10px] md:text-xs text-slate-500 font-bold">
      ©2026 ひらがな・カタカナかきかたマスター ・
      <a href="https://note.com/cute_borage86" target="_blank" rel="noopener noreferrer"
         className="text-amber-600 hover:text-amber-700 hover:underline ml-1">GIGA山</a>
    </footer>
  );
}

/* ──────────────────────────────────────────────────────────────
   10. <ModeTabsMobile>
   ────────────────────────────────────────────────────────────── */
function ModeTabsMobile({ view, setView }) {
  return (
    <div className="sm:hidden flex bg-white rounded-full p-1 shadow-sm border border-amber-100 mx-3 mt-2">
      <button onClick={() => setView('practice')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-sm font-black transition-all active:scale-95 ${
          view === 'practice' ? 'bg-amber-400 text-white shadow' : 'text-amber-700'
        }`}><IconPencil size={14}/> もじをかく</button>
      <button onClick={() => setView('words')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-sm font-black transition-all active:scale-95 ${
          view === 'words' ? 'bg-amber-400 text-white shadow' : 'text-amber-700'
        }`}><IconBook size={14}/> ことばずかん</button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   11. <DailyChallenge> ── きょうの もじ
   ────────────────────────────────────────────────────────────── */
function DailyChallenge({ char, kanaMode, progress, onPick }) {
  if (!char) return null;
  const stage = getStage(progress, char);
  const isMastered = stage >= 4;
  return (
    <button onClick={() => onPick(char)}
      className="w-full bg-gradient-to-r from-amber-100 via-rose-50 to-amber-100 border-2 border-amber-300 rounded-2xl p-2 md:p-3 flex items-center gap-2 md:gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
      <div className="flex items-center justify-center bg-white rounded-xl w-10 h-10 md:w-16 md:h-16 border-2 border-amber-400 shadow-inner shrink-0">
        <span className="text-2xl md:text-4xl font-black text-amber-700">{char}</span>
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="text-[10px] md:text-xs font-black text-amber-600 flex items-center gap-1">
          <IconCalendar size={12}/> きょうの もじ ・ {kanaMode === 'katakana' ? 'カタカナ' : 'ひらがな'}
        </div>
        <div className="text-xs md:text-base font-black text-slate-700 truncate">
          {isMastered ? '💮 もう おぼえたよ！ もう いっかい かいてみよう' : 'チャレンジ してみよう！'}
        </div>
      </div>
      <div className="text-xl md:text-3xl shrink-0">✨</div>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────
   12. <KanaTable>
   ────────────────────────────────────────────────────────────── */
function KanaTable({ kanaMode, setKanaMode, progress, currentChar, onSelect, onSequence, onRandom }) {
  const table = kanaMode === 'katakana' ? KATA_TABLE : HIRA_TABLE;
  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-amber-100 p-2 md:p-4 flex flex-col h-full min-h-0">
      <div className="flex gap-1.5 md:gap-2 mb-2 md:mb-3 shrink-0">
        <button onClick={() => setKanaMode('hiragana')}
          className={`flex-1 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-lg transition-all active:scale-95 border-2 ${
            kanaMode === 'hiragana' ? 'bg-amber-400 text-white border-amber-500 shadow' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>ひらがな</button>
        <button onClick={() => setKanaMode('katakana')}
          className={`flex-1 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-lg transition-all active:scale-95 border-2 ${
            kanaMode === 'katakana' ? 'bg-amber-400 text-white border-amber-500 shadow' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>カタカナ</button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-amber-50/40 rounded-xl p-1.5 md:p-3 border border-amber-100">
        <div className="grid grid-cols-5 gap-1 md:gap-2 max-w-sm mx-auto">
          {table.map((char, i) => {
            if (!char) return <div key={i} className="aspect-square"/>;
            const stage = getStage(progress, char);
            const isCurrent = currentChar === char;
            // ステージに応じた見た目
            let cls = 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50';
            if (stage === 1) cls = 'bg-sky-50 text-sky-700 border-sky-300';
            else if (stage === 2) cls = 'bg-emerald-50 text-emerald-700 border-emerald-300';
            else if (stage === 3) cls = 'bg-violet-50 text-violet-700 border-violet-400 ring-1 ring-violet-200';
            else if (stage === 4) cls = 'bg-amber-100 text-amber-700 border-amber-400 ring-2 ring-amber-300';
            if (isCurrent) cls = 'bg-sky-400 text-white border-sky-500 scale-110 z-10 shadow-lg';
            const info = STAGE_INFO[stage];
            return (
              <button key={i} onClick={() => onSelect(char)}
                className={`aspect-square rounded-lg font-black text-lg md:text-3xl border-2 shadow-sm relative transition-all active:scale-95 ${cls}`}>
                {char}
                {!isCurrent && stage > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs leading-none">{info.icon}</span>
                )}
              </button>
            );
          })}
        </div>
        {/* ステージはんれい */}
        <div className="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1 text-[10px] font-black text-slate-500 px-1">
          {STAGE_INFO.slice(1).map(s => (
            <span key={s.key} className="inline-flex items-center gap-0.5"><span>{s.icon}</span><span className={s.color}>{s.label}</span></span>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 md:gap-2 mt-2 md:mt-3 shrink-0">
        <button onClick={onSequence}
          className="flex-1 py-1.5 md:py-2.5 rounded-xl font-black text-xs md:text-base bg-emerald-400 text-white shadow border-b-4 border-emerald-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 flex items-center justify-center gap-1 md:gap-1.5">
          <IconCheck size={14}/> あいうえお<span className="hidden md:inline">じゅん</span>
        </button>
        <button onClick={onRandom}
          className="flex-1 py-1.5 md:py-2.5 rounded-xl font-black text-xs md:text-base bg-violet-400 text-white shadow border-b-4 border-violet-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 flex items-center justify-center gap-1 md:gap-1.5">
          <IconSparkle size={14}/> ばらばら
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   13. <PracticeBoard> ── 練習キャンバス
   ────────────────────────────────────────────────────────────── */
const TOLERANCE = 0.22; // 始点・終点の許容範囲（大きいほど優しい）

// ステージごとの初期メッセージ
function stageMascotMessage(char, stage, so) {
  if (!char) return '';
  if (stage === 0) return `「${char}」の かきじゅんを みてみよう！`;
  if (stage === 1) {
    const left = Math.max(0, TRACE_REQUIRED - (so?.traced || 0));
    return `お手本を なぞって かこう！（あと ${left}かい）`;
  }
  if (stage === 2) {
    const left = Math.max(0, FREE_REQUIRED - (so?.freeStreak || 0));
    return `じぶんで かいてみよう！（れんぞく ${so?.freeStreak || 0}/${FREE_REQUIRED}）`;
  }
  if (stage === 3) return 'もうすこし！ ことばを 1こ あつめて 💮 にしよう！';
  return '💮 かんぺき！ もう いちど かいてみる？';
}

function PracticeBoard({ char, paths, stageObj, onAnimeViewed, onRoundComplete, onMistakeStreakReset, onNext, playMode, practiceCount, voiceOn, onGoToWords }) {
  const writeRef = useRef(null);
  const inkRef   = useRef(null);
  const guideRef = useRef(null);
  const [currentStroke, setCurrentStroke] = useState(0);
  const [isCleared, setIsCleared] = useState(false);
  const [showAnime, setShowAnime] = useState(false);
  const [mistakes, setMistakes]   = useState(0);
  const [hasMistaken, setHasMistaken] = useState(false);
  const [mascotMsg, setMascotMsg] = useState('');
  const [mascotMood, setMascotMood] = useState('cheer');
  const prevStageRef = useRef(stageObj?.stage ?? 0);
  const [stageUp, setStageUp] = useState(null); // { from, to }
  const drawingRef = useRef(false);
  const lastRef    = useRef({ x: 0, y: 0 });

  // ステージから派生するモード
  const stage = stageObj?.stage ?? 0;
  const isTraceMode = stage < 2;   // ステージ0,1 → なぞり書き（ガイド表示）
  // 最新stateをrefにキャッシュ（native event listenerでのstale closure対策）
  const stateRef = useRef({});
  stateRef.current = { paths, currentStroke, isCleared, char, mistakes, hasMistaken, voiceOn, stage };

  /* --- ライフサイクル --- */
  useEffect(() => {
    setCurrentStroke(0); setIsCleared(false);
    setMistakes(0); setHasMistaken(false);
    // 未学習の文字を選んだら、まず書き順アニメを自動再生（スキップ可）
    const initialStage = stageObj?.stage ?? 0;
    prevStageRef.current = initialStage;
    if (char && initialStage === 0) {
      setShowAnime(true);
    } else {
      setShowAnime(false);
    }
    setMascotMsg(char ? stageMascotMessage(char, initialStage, stageObj) : '');
    setMascotMood(initialStage >= 4 ? 'wow' : 'cheer');
    clearAll();
    if (paths) requestAnimationFrame(() => { resize(); redrawGuide(); });
    if (char && voiceOn) setTimeout(() => speakText(char, voiceOn), 200);
    // eslint-disable-next-line
  }, [char, paths]);

  // ステージアップ検知
  useEffect(() => {
    const prev = prevStageRef.current;
    if (stage > prev) {
      // ステージ1（書き順アニメをみた直後）はポップアップを出さない
      // ── なぞり書き／自力書きを完了したときだけ祝う
      if (stage >= 2) {
        setStageUp({ from: prev, to: stage });
      }
      if (stage === 3) {
        setMascotMsg('もうすこし！ ことばを 1こ あつめて 💮 にしよう！');
        setMascotMood('wow');
        playFanfare();
      } else if (stage === 2) {
        setMascotMsg('なぞりばっちり！ こんどは ガイドなしで かいてみよう！');
        setMascotMood('wow');
        playPingPong();
      } else if (stage === 4) {
        setMascotMsg('💮 かんぺき！');
        setMascotMood('wow');
      } else if (stage === 1) {
        // 書き順アニメをみたあとは、つぎになぞるよう声をかける
        setMascotMsg(stageMascotMessage(char, 1, stageObj));
        setMascotMood('cheer');
      }
    }
    prevStageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    const onR = () => { resize(); redrawGuide(); redrawInk(); };
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  useEffect(() => { redrawInk(); /* eslint-disable-line */ }, [currentStroke, paths]);
  // ステージが変わるとガイドの表示も切り替わる
  useEffect(() => { redrawGuide(); /* eslint-disable-line */ }, [stage]);

  /* --- ネイティブイベント（passive:false でpreventDefault可能に） --- */
  useEffect(() => {
    const canvas = writeRef.current;
    if (!canvas) return;
    const ts = (e) => { if (e.touches[0]) { e.preventDefault(); doStart(e.touches[0].clientX, e.touches[0].clientY); } };
    const tm = (e) => { if (e.touches[0]) { e.preventDefault(); doMove(e.touches[0].clientX, e.touches[0].clientY); } };
    const te = (e) => { e.preventDefault(); doEnd(); };
    canvas.addEventListener('touchstart',  ts, { passive: false });
    canvas.addEventListener('touchmove',   tm, { passive: false });
    canvas.addEventListener('touchend',    te, { passive: false });
    canvas.addEventListener('touchcancel', te, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart',  ts);
      canvas.removeEventListener('touchmove',   tm);
      canvas.removeEventListener('touchend',    te);
      canvas.removeEventListener('touchcancel', te);
    };
  }, []);

  /* --- 描画ヘルパー --- */
  function clearAll() {
    [writeRef, inkRef, guideRef].forEach(r => {
      const c = r.current; if (!c) return;
      const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height);
    });
  }
  function resize() {
    const c = writeRef.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    const size = Math.round(Math.min(rect.width, rect.height));
    if (size <= 0) return;
    [writeRef, inkRef, guideRef].forEach(r => {
      if (r.current && r.current.width !== size) {
        r.current.width = size; r.current.height = size;
      }
    });
  }
  function redrawGuide() {
    const c = guideRef.current; const p = stateRef.current.paths;
    if (!c || !p) return;
    const ctx = c.getContext('2d'); const s = c.width;
    ctx.clearRect(0,0,s,s);
    // 自力モード（ステージ2以上）ではガイドを描かない
    if (stateRef.current.stage >= 2) return;
    ctx.save(); ctx.scale(s/109, s/109);
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    p.forEach(d => ctx.stroke(new Path2D(d)));
    ctx.restore();
  }
  function redrawInk() {
    const c = inkRef.current; const p = stateRef.current.paths;
    if (!c || !p) return;
    const ctx = c.getContext('2d'); const s = c.width;
    ctx.clearRect(0,0,s,s);
    const cs = stateRef.current.currentStroke;
    if (cs === 0) return;
    ctx.save(); ctx.scale(s/109, s/109);
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < cs; i++) ctx.stroke(new Path2D(p[i]));
    ctx.restore();
  }

  /* --- 座標変換ヘルパー --- */
  function toCanvas(clientX, clientY) {
    const c = writeRef.current; if (!c) return null;
    const rect = c.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top)  / rect.height;
    return { nx, ny, cx: nx * c.width, cy: ny * c.height };
  }

  /* --- 描画ロジック（マウス/タッチ共用） --- */
  function doStart(clientX, clientY) {
    const { paths: ps, currentStroke: cs, isCleared: ic } = stateRef.current;
    if (!ps || ps.length === 0 || ic) return;
    initAudio();
    if (cs >= ps.length) return;
    const pt = toCanvas(clientX, clientY); if (!pt) return;
    const target = getStartEndPoints(ps[cs]).s;
    const dist = Math.hypot(pt.nx - target.x, pt.ny - target.y);
    if (dist > TOLERANCE) { onMistake(); return; }
    drawingRef.current = true;
    lastRef.current = { x: pt.cx, y: pt.cy };
    const c = writeRef.current;
    const ctx = c.getContext('2d');
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = c.width * 0.07;
    ctx.strokeStyle = 'rgba(14,165,233,0.75)';
    ctx.beginPath(); ctx.moveTo(pt.cx, pt.cy); ctx.stroke();
  }
  function doMove(clientX, clientY) {
    if (!drawingRef.current) return;
    const pt = toCanvas(clientX, clientY); if (!pt) return;
    const ctx = writeRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(pt.cx, pt.cy);
    ctx.stroke();
    lastRef.current = { x: pt.cx, y: pt.cy };
  }
  function doEnd() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const { paths: ps, currentStroke: cs, char: ch, hasMistaken: hm } = stateRef.current;
    if (!ps || ps.length === 0) return;
    const target = getStartEndPoints(ps[cs]).e;
    const c = writeRef.current;
    const nx = lastRef.current.x / c.width;
    const ny = lastRef.current.y / c.height;
    const dist = Math.hypot(nx - target.x, ny - target.y);
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    if (dist < TOLERANCE) {
      const next = cs + 1;
      setCurrentStroke(next);
      if (next >= ps.length) {
        setIsCleared(true); playFanfare(); burstConfetti();
        setMascotMsg('💮 よくできました！'); setMascotMood('wow');
        if (voiceOn) setTimeout(() => speakText('よくできました', voiceOn), 200);
        onRoundComplete(ch, !hm);
        // 同じ文字でくり返し練習できるよう、少し待ってからキャンバスをリセット
        setTimeout(() => {
          setCurrentStroke(0); setIsCleared(false);
          setMistakes(0); setHasMistaken(false);
          clearAll(); redrawGuide();
        }, 1500);
      } else {
        playPingPong();
        setMascotMsg('いい ちょうし！'); setMascotMood('happy');
        setMistakes(0); // この画の成功でミスカウントをリセット
      }
    } else {
      onMistake();
    }
  }
  function onMistake() {
    playBuzzer();
    setHasMistaken(true);
    // 自力モード（ステージ2以上）では、ミスした瞬間にれんぞくカウントをリセット
    if (stateRef.current.stage >= 2) {
      onMistakeStreakReset && onMistakeStreakReset(stateRef.current.char);
    }
    setMistakes(m => {
      const nm = m + 1;
      if (nm >= 3) {
        // ３回まちがえたら自動で書き順アニメ
        setShowAnime(true);
        setMascotMsg('かきじゅんを みてみよう'); setMascotMood('sad');
        return 0;
      } else {
        setMascotMsg(nm === 1 ? '🔴の ところから かいてね！' : 'もういちど ちょうせん！');
        setMascotMood('sad');
        return nm;
      }
    });
  }
  function restart() {
    setCurrentStroke(0); setIsCleared(false);
    setMistakes(0); setHasMistaken(false);
    clearAll(); redrawGuide();
    setMascotMsg('もう いっかい がんばろう！'); setMascotMood('cheer');
  }

  /* --- 始点ヒント（赤い点滅マーカー） --- */
  const startHint = useMemo(() => {
    if (!paths || paths.length === 0 || currentStroke >= paths.length || isCleared) return null;
    const s = getStartEndPoints(paths[currentStroke]).s;
    return { x: s.x * 100, y: s.y * 100 };
  }, [paths, currentStroke, isCleared]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-orange-100 p-2 md:p-4 flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center mb-1 md:mb-2 shrink-0 gap-2">
        <span className={`text-[10px] md:text-sm font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full truncate ${
          isTraceMode ? 'text-emerald-700 bg-emerald-100' : 'text-violet-700 bg-violet-100'
        }`}>
          {char ? (isTraceMode ? `「${char}」を なぞって かこう` : `「${char}」を じぶんで かこう`) : 'もじを えらんでね 👆'}
        </span>
        {char && (
          <span className="text-[10px] md:text-xs font-bold text-amber-600 bg-amber-50 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full shrink-0">
            🏆 {practiceCount[char] || 0} かい
          </span>
        )}
      </div>

      {/* ステージ・ステッパー */}
      {char && (
        <StageStepper stage={stage} stageObj={stageObj}/>
      )}

      {char && (
        <div className="mb-1 md:mb-2 shrink-0">
          <Mascot message={mascotMsg} mood={mascotMood} size="small"/>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center min-h-0 min-w-0 relative w-full">
        <div className="relative aspect-square h-full max-h-full max-w-full bg-white rounded-2xl border-4 border-orange-200 shadow-inner overflow-hidden">
          <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-amber-200 pointer-events-none z-[5]"/>
          <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-amber-200 pointer-events-none z-[5]"/>
          <canvas ref={guideRef} className="absolute inset-0 w-full h-full z-[1]"/>
          <canvas ref={inkRef}   className="absolute inset-0 w-full h-full z-[10]"/>
          {/* 始点ヒント（赤い点滅マーカー） */}
          {startHint && (
            <div className="absolute z-[15] pointer-events-none"
                 style={{ left: `${startHint.x}%`, top: `${startHint.y}%`, transform: 'translate(-50%, -50%)' }}>
              <span className="absolute inset-0 inline-flex h-5 w-5 rounded-full bg-rose-400 opacity-75 animate-ping"/>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 border-2 border-white shadow"/>
            </div>
          )}
          <canvas ref={writeRef}
            className="absolute inset-0 w-full h-full z-[20] cursor-crosshair"
            style={{ touchAction: 'none' }}
            onMouseDown={(e) => doStart(e.clientX, e.clientY)}
            onMouseMove={(e) => doMove(e.clientX, e.clientY)}
            onMouseUp={() => doEnd()}
            onMouseLeave={() => doEnd()}
          />
          {!char && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-7xl pointer-events-none">？</div>
          )}
        </div>
      </div>

      {/* ステージ3 → ことばで💮 への大きなCTA */}
      {char && stage === 3 && (
        <button onClick={onGoToWords}
          className="mt-1 md:mt-2 py-1.5 md:py-2 px-3 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 text-amber-900 font-black text-xs md:text-base shadow border-b-4 border-amber-500 active:translate-y-0.5 active:border-b-2 transition-all flex items-center justify-center gap-2 shrink-0">
          🎀 ことばを 1こ あつめて 💮 にしよう！
        </button>
      )}

      <div className="flex gap-1.5 md:gap-2 mt-2 md:mt-3 shrink-0">
        <button onClick={restart} disabled={!char}
          className="flex-1 py-1.5 md:py-2.5 rounded-xl font-black text-xs md:text-base bg-orange-50 text-orange-600 shadow-sm border-b-4 border-orange-200 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-40 flex items-center justify-center gap-1 md:gap-1.5">
          <IconRotate size={14}/> やりなおし
        </button>
        <button onClick={() => char && speakText(char, voiceOn)} disabled={!char || !voiceOn}
          className="flex-1 py-1.5 md:py-2.5 rounded-xl font-black text-xs md:text-base bg-emerald-100 text-emerald-700 shadow-sm border-b-4 border-emerald-300 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-40 flex items-center justify-center gap-1 md:gap-1.5">
          <IconVolume size={14}/> よんで
        </button>
        <button onClick={() => setShowAnime(true)} disabled={!char}
          className="flex-1 py-1.5 md:py-2.5 rounded-xl font-black text-xs md:text-base bg-sky-100 text-sky-600 shadow-sm border-b-4 border-sky-300 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-40 flex items-center justify-center gap-1 md:gap-1.5">
          <IconPlay size={14}/> かきじゅん
        </button>
      </div>

      {showAnime && paths && (
        <StrokeOrderAnime paths={paths} char={char}
          onClose={() => { setShowAnime(false); onAnimeViewed && onAnimeViewed(char); }}/>
      )}
      {isCleared && <ExcellentPopup/>}
      {stageUp && <StageUpPopup info={stageUp} onClose={() => setStageUp(null)} onGoToWords={onGoToWords}/>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   13.5. <StageStepper> / <StageUpPopup>
   ────────────────────────────────────────────────────────────── */
function StageStepper({ stage, stageObj }) {
  const steps = [
    { idx: 1, icon: '📺', label: 'かきじゅん' },
    { idx: 2, icon: '✏️', label: 'なぞる',   sub: `${Math.min(stageObj?.traced || 0, TRACE_REQUIRED)}/${TRACE_REQUIRED}` },
    { idx: 3, icon: '✒️', label: 'じぶんで', sub: `${Math.min(stageObj?.freeStreak || 0, FREE_REQUIRED)}/${FREE_REQUIRED}` },
    { idx: 4, icon: '💮', label: 'ことば' },
  ];
  return (
    <div className="flex items-stretch gap-0.5 md:gap-1 mb-2 shrink-0 text-[10px] md:text-xs font-black">
      {steps.map((s, i) => {
        const done = stage >= s.idx;
        const active = stage + 1 === s.idx || (stage === s.idx && s.idx < 4) || (stage === 0 && s.idx === 1);
        const cls = done
          ? 'bg-amber-200 text-amber-800 border-amber-400'
          : active
            ? 'bg-white text-slate-700 border-amber-300 ring-2 ring-amber-200'
            : 'bg-slate-50 text-slate-400 border-slate-200';
        return (
          <div key={i} className={`flex-1 rounded-lg border-2 px-1 py-1 text-center ${cls}`}>
            <div className="text-base md:text-lg leading-none">{done ? '✅' : s.icon}</div>
            <div className="leading-tight mt-0.5">{s.label}</div>
            {s.sub && !done && active && <div className="text-[9px] opacity-70">{s.sub}</div>}
          </div>
        );
      })}
    </div>
  );
}

function StageUpPopup({ info, onClose, onGoToWords }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
    // ステージ3に上がったときは、ことばあつめへの導線を残すため長めに表示
    const dur = info.to === 3 ? 5500 : 2200;
    const t = setTimeout(() => { setShow(false); setTimeout(onClose, 400); }, dur);
    return () => clearTimeout(t);
  }, [onClose, info.to]);
  const msgMap = {
    2: { title: 'なぞり クリア！', sub: 'つぎは じぶんで かいてみよう！', color: 'from-emerald-200 to-emerald-100 border-emerald-400 text-emerald-700' },
    3: { title: 'ほぼマスター！', sub: 'ことばを 1こ あつめれば 💮 かんぺき！', color: 'from-violet-200 to-violet-100 border-violet-400 text-violet-700' },
    4: { title: '💮 かんぺき！', sub: 'ほんとうに じぶんの じに なったよ！', color: 'from-amber-200 to-amber-100 border-amber-400 text-amber-700' },
  };
  const m = msgMap[info.to];
  if (!m) return null;
  return (
    <div className={`fixed inset-0 z-[180] pointer-events-none flex items-center justify-center transition-all duration-400 ${
      show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
    }`}>
      <div className={`bg-gradient-to-br ${m.color} px-5 md:px-8 py-4 md:py-6 rounded-3xl shadow-2xl border-4 max-w-sm mx-3 text-center pointer-events-auto -rotate-2`}>
        <div className="text-xl md:text-3xl font-black">{m.title}</div>
        <div className="text-xs md:text-base font-black mt-1 opacity-90">{m.sub}</div>
        {info.to === 3 && onGoToWords && (
          <button onClick={onGoToWords}
            className="mt-3 px-4 py-2 rounded-xl bg-white text-violet-700 font-black text-sm shadow border-b-4 border-violet-400 active:translate-y-0.5 active:border-b-2">
            ことばずかんへ →
          </button>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   14. <StrokeOrderAnime>
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
      const tmpSvg = document.createElementNS(svgNS,'svg');
      const tp = document.createElementNS(svgNS,'path'); tp.setAttribute('d', d);
      tmpSvg.appendChild(tp); document.body.appendChild(tmpSvg);
      const len = tp.getTotalLength()+8; const sp = tp.getPointAtLength(0);
      document.body.removeChild(tmpSvg); lens.push(len);
      const p = document.createElementNS(svgNS,'path');
      p.setAttribute('d', d); p.setAttribute('stroke', '#0f172a'); p.setAttribute('stroke-width','6');
      p.setAttribute('fill','none'); p.setAttribute('stroke-linecap','round'); p.setAttribute('stroke-linejoin','round');
      p.id = `kkm-anime-${i}`;
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len; p.style.opacity = '0';
      stG.appendChild(p);
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-sky-200 p-4 md:p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-black text-sky-700 bg-sky-100 px-3 py-1 rounded-full">「{char}」のかきじゅん</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95"><IconX size={16}/></button>
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
            <input type="range" min="1" max="10" value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full accent-sky-500"/>
            <div className="flex justify-between text-[10px] text-sky-500 font-bold"><span>🐢 ゆっくり</span><span>はやい 🐇</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   15. <ExcellentPopup>
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
   15.5. <WordMasterPopup> ── ことばで文字が💮になった瞬間の演出
   ────────────────────────────────────────────────────────────── */
function WordMasterPopup({ info, onClose }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
    const t = setTimeout(() => { setShow(false); setTimeout(onClose, 400); }, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!info) return null;
  return (
    <div className={`fixed inset-0 z-[350] pointer-events-none flex items-center justify-center transition-all duration-500 ${
      show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
    }`}>
      <div className="bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-100 px-6 md:px-10 py-5 md:py-7 rounded-3xl shadow-2xl border-4 border-amber-400 max-w-md mx-3 pointer-events-auto" onClick={onClose}>
        <div className="text-center">
          <div className="text-xs md:text-sm font-black text-amber-700 opacity-80 mb-1">🎉 ことばで めざめたよ！</div>
          <div className="flex justify-center gap-2 my-2 md:my-3">
            {info.chars.map((c, i) => (
              <div key={i} className="relative">
                <span className="inline-block bg-white rounded-2xl border-4 border-amber-400 w-14 h-14 md:w-20 md:h-20 flex items-center justify-center text-3xl md:text-5xl font-black text-amber-700 shadow-lg animate-pulse">{c}</span>
                <span className="absolute -top-2 -right-2 text-2xl md:text-3xl">💮</span>
              </div>
            ))}
          </div>
          <div className="text-base md:text-xl font-black text-amber-700 mt-1">
            「{info.text}」で <span className="text-rose-500">かんぺき</span>！
          </div>
          <div className="text-[10px] md:text-xs text-amber-600 mt-2 opacity-80">タップしてとじる</div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   16. <BadgeToast> ── バッジ獲得トースト
   ────────────────────────────────────────────────────────────── */
function BadgeToast({ badge, onClose }) {
  useEffect(() => { playBadge(); const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  if (!badge) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] animate-bounce" style={{ animationDuration:'1.5s', animationIterationCount:2 }}>
      <div className="bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-300 border-4 border-amber-500 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3">
        <div className="text-4xl">{badge.icon}</div>
        <div>
          <div className="text-[10px] font-black text-amber-800 opacity-80">🎉 シールゲット！</div>
          <div className="text-base md:text-lg font-black text-amber-900">{badge.title}</div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   17. <AchievementsModal> ── ごほうびシールずかん
   ────────────────────────────────────────────────────────────── */
function AchievementsModal({ earned, mastered, words, streak, onClose }) {
  const lv = getCurrentLevel(mastered.length);
  const nextLv = LEVELS.find(l => l.min > mastered.length);
  const totalHira = mastered.filter(c => HIRA_LIST.includes(c)).length;
  const totalKata = mastered.filter(c => KATA_LIST.includes(c)).length;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-yellow-300 max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-black text-amber-700 flex items-center gap-2">
            <IconTrophy size={26}/> ごほうびシールずかん
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95"><IconX size={18}/></button>
        </div>

        {/* レベル＆統計 */}
        <div className={`rounded-2xl border-2 p-3 mb-3 ${lv.color}`}>
          <div className="flex items-center gap-3">
            <div className="text-4xl md:text-5xl">{lv.icon}</div>
            <div className="flex-1">
              <div className="text-[10px] font-black opacity-70">いまの しょうごう</div>
              <div className="text-lg md:text-xl font-black">{lv.title}</div>
            </div>
            <div className="text-right text-xs font-black opacity-80">
              <div>🏆 {mastered.length}じ</div>
              {nextLv && <div className="opacity-70">つぎ：あと{nextLv.min - mastered.length}じ</div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-2 text-center">
            <div className="text-[10px] font-black text-amber-600">ひらがな</div>
            <div className="text-xl font-black text-amber-700">{totalHira}/46</div>
          </div>
          <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-2 text-center">
            <div className="text-[10px] font-black text-sky-600">カタカナ</div>
            <div className="text-xl font-black text-sky-700">{totalKata}/46</div>
          </div>
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-2 text-center">
            <div className="text-[10px] font-black text-emerald-600">ことば</div>
            <div className="text-xl font-black text-emerald-700">{words.length}こ</div>
          </div>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-2 text-center">
            <div className="text-[10px] font-black text-orange-600">れんぞく</div>
            <div className="text-xl font-black text-orange-700">🔥 {streak}にち</div>
          </div>
        </div>

        {/* バッジグリッド */}
        <div className="text-xs font-black text-slate-500 mb-2">
          ゲットしたシール {earned.length} / {BADGES.length}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {BADGES.map(b => {
            const has = earned.includes(b.id);
            return (
              <div key={b.id}
                className={`rounded-xl border-2 p-2.5 flex flex-col items-center text-center transition-all ${
                  has ? 'bg-gradient-to-br from-yellow-100 to-amber-100 border-amber-400 shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                }`}>
                <div className={`text-3xl md:text-4xl ${has ? '' : 'grayscale'}`}>{has ? b.icon : '🔒'}</div>
                <div className={`text-[11px] font-black mt-1 ${has ? 'text-amber-800' : 'text-slate-500'}`}>{b.title}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{b.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   18. <WordCollection> ── ことばあつめ
   ────────────────────────────────────────────────────────────── */
function WordCollection({ kanaMode, setKanaMode, progress, mastered, usableInWords, words, onAdd, onDelete, voiceOn }) {
  const [addOpen, setAddOpen] = useState(false);
  const collected = words.filter(w => w.kanaMode === kanaMode);
  const hints = kanaMode === 'katakana' ? WORD_HINTS_KATA : WORD_HINTS_HIRA;
  const list  = kanaMode === 'katakana' ? KATA_LIST : HIRA_LIST;
  const availableHints = hints.filter(h => h.w.split('').every(c => usableInWords.includes(c)) && !words.some(w => w.text === h.w));
  // ステージ3（あと一歩で💮）の文字一覧 — モチベーション用
  const almostChars = (kanaMode === 'katakana' ? KATA_LIST : HIRA_LIST).filter(c => getStage(progress, c) === 3);

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-amber-100 p-3 md:p-5 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-3 shrink-0 gap-2">
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-black text-amber-700 truncate">
          <IconBook size={22}/> あつめた ことば
          <span className="ml-1 text-xs bg-amber-100 px-2 py-0.5 rounded-full">{collected.length}</span>
        </h2>
        <div className="flex bg-amber-50 rounded-full p-1 border border-amber-100 shrink-0">
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

      <div className="flex-1 overflow-y-auto bg-amber-50/40 rounded-xl p-3 border border-amber-100 mb-3">
        {collected.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 py-10">
            <Mascot message="まだ なにも ないよ！" mood="cheer"/>
            <p className="text-xs mt-3">したの「＋ ふやす」ボタンから あたらしい ことばを ついかしよう！</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {collected.slice().reverse().map(w => (
              <div key={w.id} className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-3 flex flex-col items-center gap-1 relative group">
                <span className="text-4xl">{w.emoji || '✨'}</span>
                <button onClick={() => speakText(w.text, voiceOn)} disabled={!voiceOn}
                  className="font-black text-lg text-slate-700 hover:text-amber-600 transition-all active:scale-95 disabled:cursor-default">
                  {w.text}
                </button>
                <button onClick={() => onDelete(w.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-50 text-rose-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all active:scale-95">
                  <IconTrash size={12}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* あとひと押しで 💮 になる文字（モチベ強化） */}
      {almostChars.length > 0 && (
        <div className="bg-gradient-to-r from-violet-50 via-fuchsia-50 to-violet-50 border-2 border-violet-300 rounded-xl p-2.5 mb-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-black text-violet-700 mb-1.5">
            ✨ この じを つかうと 💮 に なるよ！
          </div>
          <div className="flex flex-wrap gap-1.5">
            {almostChars.map(c => (
              <span key={c} className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border-2 border-violet-400 font-black text-violet-700 text-xl shadow-sm">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {availableHints.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-2.5 mb-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-black text-yellow-700 mb-1.5">
            <IconBulb size={14}/> いまの じで つくれる ことば
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableHints.slice(0, 8).map(h => {
              // この単語が💮を作る数を表示
              const willMaster = h.w.split('').filter(c => getStage(progress, c) === 3).length;
              return (
                <button key={h.w} onClick={() => { onAdd({ text: h.w, emoji: h.e, kanaMode }); speakText(h.w, voiceOn); }}
                  className={`relative border rounded-full px-2.5 py-1 text-xs font-black transition-all active:scale-95 shadow-sm ${
                    willMaster > 0 ? 'bg-amber-100 border-amber-400 text-amber-800 ring-2 ring-amber-200' : 'bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                  }`}>
                  {h.e} {h.w}
                  {willMaster > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">+{willMaster}💮</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={() => setAddOpen(true)}
        className="py-3 rounded-xl font-black text-base md:text-lg bg-amber-400 text-white shadow border-b-4 border-amber-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 flex items-center justify-center gap-2 shrink-0">
        <IconPlus size={20}/> あたらしい ことばを ふやす
      </button>

      {addOpen && (
        <WordAddModal kanaMode={kanaMode} progress={progress} usableInWords={usableInWords} list={list} voiceOn={voiceOn}
          onCancel={() => setAddOpen(false)}
          onSave={(w) => { onAdd(w); speakText(w.text, voiceOn); setAddOpen(false); }}/>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   19. <WordAddModal>
   ────────────────────────────────────────────────────────────── */
function WordAddModal({ kanaMode, progress, usableInWords, list, voiceOn, onCancel, onSave }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0]);
  const table = kanaMode === 'katakana' ? KATA_TABLE : HIRA_TABLE;
  const canSave = text.length >= 1;
  // この単語で💮になる数（プレビュー）
  const willMaster = useMemo(() => Array.from(new Set(text.split(''))).filter(c => getStage(progress, c) === 3), [text, progress]);
  function addChar(c) { if (text.length < 8) { setText(t => t + c); speakText(c, voiceOn); } }
  function backspace() { setText(t => t.slice(0, -1)); }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3" onClick={onCancel}>
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-4 md:p-6 max-w-lg w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-black text-lg text-amber-700 flex items-center gap-2"><IconPlus size={20}/> ことばを つくろう</h3>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95"><IconX size={16}/></button>
        </div>

        <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-3 md:p-4 mb-3 flex items-center gap-3 min-h-[80px]">
          <span className="text-4xl md:text-5xl">{emoji}</span>
          <span className="flex-1 text-2xl md:text-3xl font-black text-slate-700 break-all">
            {text || <span className="text-slate-300">なにを かこうかな？</span>}
          </span>
          {text.length > 0 && (
            <>
              <button onClick={() => speakText(text, voiceOn)} disabled={!voiceOn}
                className="w-9 h-9 rounded-full bg-sky-100 text-sky-500 flex items-center justify-center transition-all active:scale-95 disabled:opacity-40">
                <IconVolume size={18}/>
              </button>
              <button onClick={backspace}
                className="w-9 h-9 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center transition-all active:scale-95">
                <IconX size={18}/>
              </button>
            </>
          )}
        </div>

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

        {willMaster.length > 0 && (
          <div className="mb-2 bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 border-2 border-amber-400 rounded-xl px-3 py-2 text-center text-xs md:text-sm font-black text-amber-800">
            ✨ この ことばで <span className="text-rose-500 text-base">{willMaster.length}</span>こ の じが 💮 になるよ！
            <div className="mt-1 flex justify-center gap-1.5">
              {willMaster.map(c => (
                <span key={c} className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white border-2 border-amber-400 text-amber-700 text-base">{c}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3">
          <div className="text-xs font-black text-slate-500 mb-1.5">じぶんで かける じだけ つかえるよ（💮 = ことばで かんぺき）</div>
          <div className="grid grid-cols-5 gap-1.5 bg-amber-50/40 p-2 rounded-xl border border-amber-100">
            {table.map((c, i) => {
              if (!c) return <div key={i} className="aspect-square"/>;
              const ok = usableInWords.includes(c);
              const stage = getStage(progress, c);
              const willPromote = stage === 3;
              return (
                <button key={i} disabled={!ok} onClick={() => addChar(c)}
                  className={`relative aspect-square rounded-lg font-black text-xl md:text-2xl border-2 transition-all active:scale-95 ${
                    ok
                      ? (willPromote
                          ? 'bg-violet-50 border-violet-400 text-violet-700 hover:bg-violet-100 shadow-sm ring-2 ring-violet-200'
                          : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-100 shadow-sm')
                      : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60'
                  }`}>
                  {c}
                  {willPromote && <span className="absolute -top-1 -right-1 text-[10px]">✨</span>}
                  {stage === 4 && <span className="absolute -top-1 -right-1 text-[10px]">💮</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-black text-sm bg-slate-100 text-slate-500 shadow-sm border-b-4 border-slate-300 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2">やめる</button>
          <button disabled={!canSave} onClick={() => onSave({ text, emoji, kanaMode })}
            className="flex-[2] py-2.5 rounded-xl font-black text-base bg-amber-400 text-white shadow border-b-4 border-amber-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
            <IconCheck size={18}/> ずかんに ついか
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   20. <ResetModal>
   ────────────────────────────────────────────────────────────── */
function ResetModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-rose-300 p-6 max-w-sm w-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
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
   21. <MainBoard>
   ────────────────────────────────────────────────────────────── */
function MainBoard({ kanaMode, setKanaMode, progress, mastered, onAnimeViewed, onRoundComplete, onMistakeStreakReset, practiceCount, voiceOn, onGoToWords }) {
  const [currentChar, setCurrentChar] = useState(null);
  const [paths, setPaths] = useState(null);
  const [playMode, setPlayMode] = useState('free');
  const dailyChar = useDailyChallenge(kanaMode, mastered);

  const selectChar = useCallback(async (c, mode='free') => {
    setPlayMode(mode); setCurrentChar(c); setPaths(null);
    const p = await fetchKanjiVG(c);
    setPaths(p || []);
  }, []);

  function startSequence() {
    const list = kanaMode === 'katakana' ? KATA_LIST : HIRA_LIST;
    const target = list.find(c => getStage(progress, c) < 4) || list[0];
    selectChar(target, 'sequential');
  }
  function startRandom() {
    const list = kanaMode === 'katakana' ? KATA_LIST : HIRA_LIST;
    let pool = list.filter(c => getStage(progress, c) < 4);
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
  useEffect(() => { setCurrentChar(null); setPaths(null); }, [kanaMode]);

  const stageObj = currentChar ? (progress[currentChar] || newStageObj()) : null;

  // sequence/random モードでは、現在の文字がステージ4に到達したら自動で次の文字へ
  useEffect(() => {
    if (!currentChar) return;
    if (playMode === 'free') return;
    if (stageObj && stageObj.stage >= 4) {
      const t = setTimeout(() => nextChar(), 1800);
      return () => clearTimeout(t);
    }
  }, [currentChar, stageObj?.stage, playMode]);

  return (
    <div className="flex-1 flex flex-col p-2 md:p-4 min-h-0 overflow-hidden gap-2 md:gap-3">
      <div className="shrink-0">
        <DailyChallenge char={dailyChar} kanaMode={kanaMode} progress={progress}
          onPick={(c) => selectChar(c, 'free')}/>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2 md:gap-4 min-h-0 overflow-hidden">
        <KanaTable kanaMode={kanaMode} setKanaMode={setKanaMode}
          progress={progress} currentChar={currentChar}
          onSelect={(c) => selectChar(c,'free')}
          onSequence={startSequence} onRandom={startRandom}/>
        <PracticeBoard char={currentChar} paths={paths} stageObj={stageObj}
          onAnimeViewed={onAnimeViewed}
          onRoundComplete={onRoundComplete}
          onMistakeStreakReset={onMistakeStreakReset}
          onNext={nextChar} playMode={playMode}
          practiceCount={practiceCount} voiceOn={voiceOn}
          onGoToWords={onGoToWords}/>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   22. <App> ── ルートコンポーネント
   ────────────────────────────────────────────────────────────── */
function App() {
  const [view, setView] = useState('practice');
  const [kanaMode, setKanaMode] = useState('hiragana');
  const [progress, setProgress] = useState(loadInitialProgress);
  useEffect(() => { try { localStorage.setItem(KEY_PROGRESS, JSON.stringify(progress)); } catch {} }, [progress]);
  const mastered = useMemo(() => getMasteredList(progress), [progress]);
  const usableInWords = useMemo(() => getUsableInWordsList(progress), [progress]);
  const [words, setWords]       = useLocalStorage(KEY_WORDS, []);
  const [practiceCount, setPracticeCount] = useLocalStorage(KEY_COUNT, {});
  const [earned, setEarned]     = useLocalStorage(KEY_BADGES, []);
  const [voiceOn, setVoiceOn]   = useLocalStorage(KEY_VOICE, true);
  const [resetOpen, setResetOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [toastBadge, setToastBadge] = useState(null);
  const [wordCelebration, setWordCelebration] = useState(null); // { chars: [...] } ことばで💮になった文字
  const streak = useStreak();

  // 音声リスト読み込み（ブラウザによっては遅延発火）
  useEffect(() => {
    if (window.speechSynthesis) {
      speechSynthesis.onvoiceschanged = () => { cachedJaVoice = null; getJaVoice(); };
      getJaVoice();
    }
  }, []);

  // バッジ達成監視
  useAchievements({ mastered, words, streak, earned, setEarned,
    onNew: (b) => setToastBadge(b) });

  const bumpCount = useCallback((char) => {
    setPracticeCount(prev => ({ ...prev, [char]: (prev[char] || 0) + 1 }));
  }, [setPracticeCount]);

  // ステージ1：書き順アニメをみた
  const onAnimeViewed = useCallback((char) => {
    if (!char) return;
    setProgress(prev => {
      const cur = prev[char] || newStageObj();
      if (cur.sawAnime && cur.stage >= 1) return prev;
      return { ...prev, [char]: { ...cur, sawAnime: true, stage: Math.max(cur.stage, 1) } };
    });
  }, []);

  // 1ラウンド完了（書き順すべて成功）：ステージに応じてカウンタを更新
  // 戻り値：{ newStage, prevStage } を呼び出し側のためにrefで返したいが、
  // setProgress内では難しいのでイベント駆動の通知はsetterで完結させる
  const onRoundComplete = useCallback((char, clean) => {
    if (!char) return;
    bumpCount(char);
    setProgress(prev => {
      const cur = prev[char] || newStageObj();
      let next = { ...cur };
      if (next.stage < 2) {
        // なぞり書きフェーズ：きれいさは問わずカウント
        next.traced = (next.traced || 0) + 1;
        next.sawAnime = true; // アニメみずに直接練習した場合もここで保証
        if (next.traced >= TRACE_REQUIRED) next.stage = 2;
        else next.stage = Math.max(next.stage, 1);
      } else if (next.stage < 4) {
        // 自力フェーズ：cleanのときだけれんぞくカウントを伸ばす
        next.free = (next.free || 0) + 1;
        if (clean) {
          next.freeStreak = (next.freeStreak || 0) + 1;
          if (next.freeStreak >= FREE_REQUIRED && next.stage < 3) next.stage = 3;
        } else {
          next.freeStreak = 0;
        }
      } else {
        // すでに完全マスター：カウントだけ伸ばす
        next.free = (next.free || 0) + 1;
        if (clean) next.freeStreak = (next.freeStreak || 0) + 1;
        else next.freeStreak = 0;
      }
      return { ...prev, [char]: next };
    });
  }, [bumpCount]);

  // 自力モードでミスした瞬間：れんぞくカウントをリセット（ラウンドの途中ミスもペナルティ）
  const onMistakeStreakReset = useCallback((char) => {
    if (!char) return;
    setProgress(prev => {
      const cur = prev[char];
      if (!cur || cur.freeStreak === 0 || cur.stage < 2) return prev;
      return { ...prev, [char]: { ...cur, freeStreak: 0 } };
    });
  }, []);

  const addWord = useCallback((w) => {
    setWords(prev => [...prev, { id: Date.now() + Math.random(), ...w, date: Date.now() }]);
    playPickup();
    // ことばに使った文字のうち、ステージ3だったものをステージ4へ昇格
    const chars = Array.from(new Set((w.text || '').split('')));
    setProgress(prev => {
      const advanced = [];
      const next = { ...prev };
      chars.forEach(c => {
        const cur = next[c];
        if (cur && cur.stage === 3) {
          next[c] = { ...cur, stage: 4 };
          advanced.push(c);
        }
      });
      if (advanced.length > 0) {
        setTimeout(() => {
          playFanfare();
          burstConfetti();
          setWordCelebration({ chars: advanced, text: w.text });
        }, 50);
      }
      return next;
    });
  }, [setWords]);
  const deleteWord = useCallback((id) => {
    setWords(prev => prev.filter(w => w.id !== id));
  }, [setWords]);
  const resetAll = () => { localStorage.clear(); window.location.reload(); };

  return (
    <div className="h-screen flex flex-col bg-amber-50/40 overflow-hidden" style={{ fontFamily: "'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', sans-serif", fontWeight: 700 }}>
      <canvas id="confettiCanvas" className="fixed inset-0 pointer-events-none z-[400]"/>
      <Header view={view} setView={setView} mastered={mastered}
        onReset={() => setResetOpen(true)}
        onOpenBadges={() => setBadgesOpen(true)}
        streak={streak} voiceOn={voiceOn} setVoiceOn={setVoiceOn}
        earnedCount={earned.length}/>
      <ModeTabsMobile view={view} setView={setView}/>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {view === 'practice' ? (
          <MainBoard kanaMode={kanaMode} setKanaMode={setKanaMode}
            progress={progress} mastered={mastered}
            onAnimeViewed={onAnimeViewed}
            onRoundComplete={onRoundComplete}
            onMistakeStreakReset={onMistakeStreakReset}
            practiceCount={practiceCount} voiceOn={voiceOn}
            onGoToWords={() => setView('words')}/>
        ) : (
          <div className="flex-1 p-3 md:p-4 min-h-0 overflow-hidden">
            <WordCollection kanaMode={kanaMode} setKanaMode={setKanaMode}
              progress={progress} mastered={mastered} usableInWords={usableInWords}
              words={words}
              onAdd={addWord} onDelete={deleteWord} voiceOn={voiceOn}/>
          </div>
        )}
      </main>

      <Footer/>

      {resetOpen   && <ResetModal onCancel={() => setResetOpen(false)} onConfirm={resetAll}/>}
      {badgesOpen  && <AchievementsModal earned={earned} mastered={mastered} words={words} streak={streak}
                          onClose={() => setBadgesOpen(false)}/>}
      {toastBadge  && <BadgeToast badge={toastBadge} onClose={() => setToastBadge(null)}/>}
      {wordCelebration && <WordMasterPopup info={wordCelebration} onClose={() => setWordCelebration(null)}/>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   23. レンダリング
   ────────────────────────────────────────────────────────────── */
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
