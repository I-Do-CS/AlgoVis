import { ALGORITHMS } from '../sorting/algorithms.ts'
import { DATASETS, type DatasetId } from '../sorting/datasets.ts'
import type { AlgorithmId, Operation } from '../sorting/types.ts'

export type Language = 'en' | 'fa'

// Each entry must have both languages; missing translations fail type checking.
export const MESSAGES = {
  home: ['AlgoVis home', 'خانهٔ AlgoVis'],
  navigation: ['Main navigation', 'پیمایش اصلی'],
  visualizer: ['Visualizer', 'نمایشگر'],
  how: ['How it works', 'روش کار'],
  appDescription: ['Algorithm Visualizer', 'نمایشگر الگوریتم‌ها'],
  eyebrow: ['ALGORITHMS, IN MOTION', 'الگوریتم‌ها در حرکت'],
  heading: ['Make sense of the sort', 'مرتب‌سازی را بهتر درک کن'],
  intro: ['Slow it down. Follow each move. See how an algorithm thinks.', 'آرام‌تر تماشا کن. هر جابه‌جایی را دنبال کن. ببین الگوریتم چطور فکر می‌کند.'],
  viewMode: ['View mode', 'حالت نمایش'],
  explore: ['Explore', 'کاوش'],
  compare: ['Compare', 'مقایسه'],
  language: ['Language', 'زبان'],
  live: ['LIVE CANVAS', 'نمای زنده'],
  elements: ['{count} elements', '{count} عنصر'],
  numbers: ['{count} numbers', '{count} عدد'],
  algorithm: ['Algorithm', 'الگوریتم'],
  dataset: ['Dataset', 'الگوی داده‌ها'],
  inputHint: ['Switch algorithms to explore the same starting array.', 'با تغییر الگوریتم، همان آرایهٔ اولیه را بررسی کن.'],
  underHood: ['UNDER THE HOOD', 'پشت صحنه'],
  recipe: ['THE RECIPE', 'دستور کار'],
  pseudocode: ['PSEUDOCODE', 'شبه‌کد'],
  pseudocodeLabel: ['{name} pseudocode', 'شبه‌کد {name}'],
  best: ['Best case', 'بهترین حالت'],
  average: ['Average case', 'حالت میانگین'],
  worst: ['Worst case', 'بدترین حالت'],
  space: ['Algorithm space', 'حافظهٔ الگوریتم'],
  metrics: ['Live sorting statistics', 'آمار زندهٔ مرتب‌سازی'],
  comparisons: ['Comparisons', 'مقایسه‌ها'],
  writes: ['Array writes', 'نوشتن در آرایه'],
  operations: ['Operations', 'عملیات'],
  playbackTime: ['Playback time', 'زمان پخش'],
  pairsHint: ['Pairs put to the test', 'جفت‌هایی که مقایسه شده‌اند'],
  writesHint: ['Values moved into position', 'مقادیر نوشته‌شده در جای جدید'],
  stepsHint: ['Every visualized algorithm step', 'همهٔ گام‌های نمایشی الگوریتم'],
  timeHint: ['Animation time since last seek', 'زمان انیمیشن از آخرین جابه‌جایی'],
  secondsShort: ['s', 'ثانیه'],
  inspect: ['Inspect array values', 'بررسی مقادیر آرایه'],
  creator: ['Created by', 'ساخته‌شده توسط'],
  sourceCode: ['View on GitHub', 'مشاهده در گیت‌هاب'],
  keyboardPlay: ['play / pause', 'پخش / توقف'],
  keyboardBack: ['back', 'گام قبل'],
  keyboardStep: ['step', 'گام بعد'],
  keyboardReset: ['reset', 'بازنشانی'],
  ready: ['Ready to sort', 'آمادهٔ مرتب‌سازی'],
  playing: ['Sorting', 'در حال مرتب‌سازی'],
  paused: ['Paused', 'متوقف'],
  complete: ['Sorted', 'مرتب شد'],
  readyNote: ['Press play and watch order emerge.', 'پخش را بزن و شکل‌گرفتن نظم را تماشا کن.'],
  completeNote: ['Every element is in its place. Nicely sorted.', 'هر عنصر در جای خودش است. مرتب‌سازی تمام شد.'],
  stepNote: ['Take it one step at a time.', 'قدم‌به‌قدم پیش برو.'],
  timeline: ['Timeline', 'خط زمان'],
  sharedTimeline: ['Shared timeline', 'خط زمان مشترک'],
  timelineValue: ['Step {current} of {total}', 'گام {current} از {total}'],
  timelineHint: ['Scrub to any step. Seeking pauses playback and resets the animation timer.', 'به هر گامی برگرد. جابه‌جایی در خط زمان، پخش را متوقف و زمان انیمیشن را صفر می‌کند.'],
  pause: ['Pause', 'توقف'],
  replay: ['Replay', 'پخش دوباره'],
  resume: ['Resume', 'ادامه'],
  startBoth: ['Start both', 'شروع هر دو'],
  start: ['Start sorting', 'شروع مرتب‌سازی'],
  previous: ['Previous step', 'گام قبلی'],
  previousTitle: ['Previous step ({key} arrow)', 'گام قبلی (کلید {key})'],
  step: ['Step', 'یک گام'],
  stepTitle: ['One operation ({key} arrow)', 'یک عملیات (کلید {key})'],
  leftKey: ['Left', 'چپ'],
  rightKey: ['Right', 'راست'],
  reset: ['Reset array', 'بازنشانی آرایه'],
  resetTitle: ['Reset (R)', 'بازنشانی (R)'],
  speed: ['Speed', 'سرعت'],
  speedValue: ['{multiplier} times, {rate} operations per second', '{multiplier} برابر، {rate} عملیات در ثانیه'],
  arraySize: ['Array size', 'اندازهٔ آرایه'],
  shuffle: ['Shuffle array', 'درهم‌ریزی آرایه'],
  progress: ['Sorting progress', 'پیشرفت مرتب‌سازی'],
  position: ['ARRAY POSITION', 'جایگاه در آرایه'],
  orderFound: ['ORDER FOUND', 'نظم پیدا شد'],
  everyMove: ['EVERY MOVE TELLS A STORY', 'هر حرکت، یک داستان'],
  legend: ['Bar colors', 'رنگ ستون‌ها'],
  unsorted: ['Unsorted', 'نامرتب'],
  comparing: ['Comparing', 'مقایسه'],
  moving: ['Moving', 'جابه‌جایی'],
  writing: ['Writing', 'نوشتن'],
  pivot: ['Pivot', 'محور'],
  minimum: ['Minimum', 'کمینه'],
  noBuffer: ['NO AUXILIARY ARRAY', 'بدون آرایهٔ کمکی'],
  buffer: ['AUXILIARY BUFFER', 'بافر کمکی'],
  mergeComplete: ['MERGE COMPLETE', 'ادغام کامل شد'],
  bufferWaiting: ['AUXILIARY BUFFER · BUILT AS RUNS MERGE', 'بافر کمکی · هنگام ادغام ساخته می‌شود'],
  canvasLabel: ['{name} array of {count} bars. {percent} percent complete. Expand the array values below for the numbers.', 'آرایهٔ {name} با {count} ستون؛ {percent} درصد پیشرفت. برای مشاهدهٔ اعداد، بخش مقادیر آرایه را باز کن.'],
  leftAlgorithm: ['Left algorithm', 'الگوریتم اول'],
  rightAlgorithm: ['Right algorithm', 'الگوریتم دوم'],
  visualSteps: ['Visual steps', 'گام‌های نمایشی'],
  held: ['Sorted. The final array stays in view.', 'مرتب شد. آرایهٔ نهایی در نمایش باقی می‌ماند.'],
  inspectLeft: ['Inspect left array values', 'بررسی مقادیر آرایهٔ اول'],
  inspectRight: ['Inspect right array values', 'بررسی مقادیر آرایهٔ دوم'],
  comparisonRegion: ['Algorithm comparison', 'مقایسهٔ الگوریتم‌ها'],
  oneInput: ['ONE INPUT, TWO APPROACHES', 'یک ورودی، دو روش'],
  unfold: ['Watch the difference unfold.', 'تفاوت روش‌ها را تماشا کن.'],
  sameInput: ['Both start with the same array and advance at the same step rate.', 'هر دو با یک آرایهٔ یکسان شروع می‌کنند و با سرعت گام یکسان پیش می‌روند.'],
  sharedControls: ['Shared playback controls', 'کنترل‌های پخش مشترک'],
  sharedPlayback: ['SHARED PLAYBACK', 'پخش مشترک'],
  animationTime: ['{seconds} s animation time', '{seconds} ثانیه زمان انیمیشن'],
  readResults: ['READ THE RESULTS', 'نتیجه‌ها را بخوان'],
  differentPaths: ['Different paths to the same order.', 'مسیرهای متفاوت، یک نظم مشترک.'],
  finishedBoth: ['Both sorts have finished. Here is how their work compares on this input.', 'هر دو مرتب‌سازی تمام شده‌اند. میزان کار آن‌ها روی این ورودی را مقایسه کن.'],
  compareHint: ['A finished side stays sorted while its partner continues. Scrub backward to inspect how each algorithm got there.', 'وقتی یکی تمام شود، نتیجه‌اش ثابت می‌ماند و دیگری ادامه می‌دهد. در خط زمان به عقب برگرد تا مسیر هر الگوریتم را بررسی کنی.'],
  fewerComparisons: ['Fewer comparisons', 'مقایسهٔ کمتر'],
  fewerWrites: ['Fewer array writes', 'نوشتن کمتر در آرایه'],
  fewerSteps: ['Fewer visual steps', 'گام نمایشی کمتر'],
  finishBoth: ['Finish both sorts to compare totals.', 'برای مقایسهٔ مجموع، هر دو را تا پایان اجرا کن.'],
  tie: ['Tie', 'برابر'],
  each: ['{count} each', 'هر کدام {count}'],
  resultCounts: ['{a} vs {b} · {difference} fewer', '{a} در برابر {b}؛ {difference} کمتر'],
  method: ['Compare counts to understand the work. Visual steps also include selections and setup; animation time depends on playback speed and is not a CPU benchmark.', 'تعداد عملیات را مقایسه کن تا میزان کار روشن شود. گام‌های نمایشی شامل انتخاب‌ها و آماده‌سازی هم هستند؛ زمان انیمیشن به سرعت پخش وابسته است و معیار سرعت پردازنده نیست.'],
  opPick: ['Pick the next element at position {position}.', 'عنصر بعدی را از جایگاه {position} انتخاب کن.'],
  opNeighbors: ['Compare neighbors at positions {a} and {b}.', 'دو همسایه در جایگاه‌های {a} و {b} را مقایسه کن.'],
  opInsertSwap: ['Move the smaller element one position to the left.', 'عنصر کوچک‌تر را یک جایگاه به چپ ببر.'],
  opSweep: ['Sweep the first {count} elements from left to right.', '{count} عنصر اول را از چپ به راست بررسی کن.'],
  opBubbleSwap: ['Swap this pair so the larger value moves right.', 'این دو را جابه‌جا کن تا مقدار بزرگ‌تر به راست برود.'],
  opFindMinimum: ['Find the smallest value from position {position} onward.', 'از جایگاه {position} به بعد، کوچک‌ترین مقدار را پیدا کن.'],
  opCompareMinimum: ['Compare {value} with the current minimum, {minimum}.', '{value} را با کمینهٔ فعلی، یعنی {minimum}، مقایسه کن.'],
  opNewMinimum: ['{value} is the new minimum. Keep scanning.', '{value} کمینهٔ جدید است. بررسی را ادامه بده.'],
  opPlaceMinimum: ['Put the minimum, {value}, into position {position}.', 'کمینه، یعنی {value}، را در جایگاه {position} قرار بده.'],
  opSplit: ['Split positions {a}–{b} into two smaller runs.', 'بازهٔ جایگاه‌های {a} تا {b} را به دو بخش کوچک‌تر تقسیم کن.'],
  opBufferCompare: ['Compare buffer values {a} and {b}. Ties go left.', 'مقادیر {a} و {b} را از بافر مقایسه کن. در تساوی، مقدار بخش چپ انتخاب می‌شود.'],
  opWrite: ['Write {value} from the auxiliary buffer to position {position}.', 'مقدار {value} را از بافر کمکی در جایگاه {position} بنویس.'],
  opPivot: ['Choose {value} at position {position} as the pivot.', 'مقدار {value} در جایگاه {position} را به‌عنوان محور انتخاب کن.'],
  opPivotCompare: ['Compare {value} with pivot {pivot}.', '{value} را با محور {pivot} مقایسه کن.'],
  opPartition: ['Move {value} into the left partition.', 'مقدار {value} را به بخش چپ ببر.'],
  opPlacePivot: ['Place pivot {value} between the two partitions.', 'محور {value} را میان دو بخش قرار بده.'],
} as const satisfies Record<string, readonly [string, string]>

export type TextKey = keyof typeof MESSAGES
export type TextValues = Readonly<Record<string, string | number>>

const FA_ALGORITHMS: Record<AlgorithmId, { name: string; description: string; note: string }> = {
  insertion: { name: 'مرتب‌سازی درجی', description: 'مثل مرتب‌کردن کارت‌های دست است. یک عنصر بردار، آن را تا جای مناسب به چپ ببر و تکرار کن.', note: 'از جابه‌جایی عناصر همسایه استفاده می‌کند. هر جابه‌جایی، دو بار نوشتن در آرایه به حساب می‌آید.' },
  bubble: { name: 'مرتب‌سازی حبابی', description: 'همسایه‌ها را مقایسه کن و اگر ترتیبشان اشتباه بود، جایشان را عوض کن. هر دور، مقدار بزرگ‌تری را به راست می‌برد.', note: 'اگر یک دور بدون جابه‌جایی تمام شود، زودتر متوقف می‌شود. هر جابه‌جایی، دو بار نوشتن در آرایه است.' },
  selection: { name: 'مرتب‌سازی انتخابی', description: 'کوچک‌ترین عنصر باقی‌مانده را پیدا کن و آن را در ابتدای بخش نامرتب بگذار. هر انتخاب، بخش مرتب را بزرگ‌تر می‌کند.', note: 'بنفش، کمینهٔ فعلی را نشان می‌دهد. اگر کمینه از قبل در جای درست باشد، جابه‌جایی انجام نمی‌شود.' },
  merge: { name: 'مرتب‌سازی ادغامی', description: 'آرایه را به بخش‌های کوچک‌تر تقسیم کن و آن‌ها را به‌ترتیب ادغام کن. بافر کمکی، مقادیر لازم برای هر ادغام را نگه می‌دارد.', note: 'طلایی، مقایسه در بافر و صورتی، نوشتن را نشان می‌دهد. فقط نوشتن در آرایهٔ اصلی شمرده می‌شود، نه کپی در بافر.' },
  quick: { name: 'مرتب‌سازی سریع', description: 'یک محور انتخاب کن و مقادیر کوچک‌تر را به چپ آن ببر. محور را در جای درست بگذار و این کار را برای هر بخش تکرار کن.', note: 'بنفش، محور را دنبال می‌کند. با انتخاب عنصر آخر به‌عنوان محور، ورودی مرتب یا کاملاً یکسان بدترین حالت است.' },
}
const FA_TAGS: Record<string, string> = { 'Comparison sort': 'مرتب‌سازی مقایسه‌ای', Stable: 'پایدار', Unstable: 'ناپایدار', 'In-place': 'درجا', 'Divide and conquer': 'تقسیم و حل', 'Auxiliary buffer': 'بافر کمکی', Partitioning: 'بخش‌بندی' }
const FA_DATASETS: Record<DatasetId, string> = { random: 'تصادفی', sorted: 'مرتب', reversed: 'معکوس', 'nearly-sorted': 'تقریباً مرتب', duplicates: 'تکرار زیاد' }

export function createI18n(language: Language) {
  const locale = language === 'fa' ? 'fa-IR' : 'en-US'
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  const decimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const n = (value: number, fixed?: 1) => (fixed === 1 ? decimal : formatter).format(value)
  const t = (key: TextKey, values: TextValues = {}): string => MESSAGES[key][language === 'fa' ? 1 : 0].replace(/\{(\w+)\}/g, (placeholder, key: string) => {
    const value = values[key]
    return typeof value === 'number' ? n(value) : value ?? placeholder
  })
  const algorithm = (id: AlgorithmId) => language === 'en' ? ALGORITHMS[id] : { ...ALGORITHMS[id], ...FA_ALGORITHMS[id], tags: ALGORITHMS[id].tags.map((tag) => FA_TAGS[tag] ?? tag) }
  const dataset = (id: DatasetId) => language === 'fa' ? FA_DATASETS[id] : DATASETS.find((entry) => entry.id === id)!.name
  const operation = (op: Operation | null) => op ? t(op.message.key, op.message.values) : t('stepNote')
  const values = (input: readonly number[]) => input.map((value) => n(value)).join(language === 'fa' ? '، ' : ', ')
  return { language, rtl: language === 'fa', t, n, algorithm, dataset, operation, values }
}

export type I18n = ReturnType<typeof createI18n>
