(function () {
  'use strict';
  var E = window.Engine, D = DATA;
  E.init(D);
  var app = document.getElementById('app');
  var G = null, screen = 'start', offer = null, turnStart = null, dirty = false, askQuit = false;
  var SAVE = 'shoes-japan-save-v1', LANGKEY = 'shoes-japan-lang';
  var lang = 'en';
  try { lang = localStorage.getItem(LANGKEY) || ((navigator.language || '').toLowerCase().indexOf('ja') === 0 ? 'ja' : 'en'); } catch (e) { lang = (navigator.language || '').toLowerCase().indexOf('ja') === 0 ? 'ja' : 'en'; }

  /* ---------- texts ---------- */
  var T = {
    en: {
      title: 'In Someone Else’s Shoes', sub: 'Japan',
      eyebrow: 'A game on real Japanese economic data',
      intro: 'You have just started your first job in Japan. Fifteen years lie ahead, one turn per quarter. Wages, bonuses, prices, interest rates, stocks, flats and gold move exactly the way they really did. You are not told what year it is.',
      ruleGoal: '<b>Goal.</b> Save enough to live for ' + E.GOAL_YEARS + ' years on what you own, and hold that for four quarters in a row. Net worth counts: savings, stocks, gold and flats minus what you still owe.',
      ruleTurn: '<b>Your turn.</b> Decide where your money goes: postal savings, stocks, gold or a flat to rent out with a bank loan. Then live through the quarter and read the news.',
      ruleLife: '<b>Life.</b> Bonuses come in summer and winter. Job losses, bills and promotions are random; the higher unemployment, the likelier you lose your job.',
      resume: function (p, y) { return 'Continue your game: ' + p + ', year ' + y; },
      pick: 'Pick a career. You start on day one',
      perMonth: ' a month', bonusMonths: function (m) { return '+ bonus ≈ ' + m.toFixed(1) + ' months a year'; },
      startsAt: function (a) { return 'starts at ' + a; }, growth: function (x) { return 'pay growth over 15 years ' + x; },
      riskLow: 'job almost safe', riskMid: 'some layoff risk', riskHigh: 'often laid off',
      yearOf: function (y) { return 'Year ' + y + ' of 15'; }, qname: ['Q1', 'Q2', 'Q3', 'Q4'],
      age: function (a) { return 'age ' + a; }, outOfWork: 'out of work', kids: function (n) { return 'kids: ' + n; },
      startOver: 'Start over', sure: 'Sure? This game will be erased',
      dayOne: 'Day one', firstDay: function (a, c) { return 'Your first day at work. You are ' + a + ' with ' + c + ' in savings.'; },
      noYear: 'You don’t know what year it is. Watch the rates, the prices and the news.',
      wire: 'News · what happened this quarter', quiet: 'A quiet quarter with no big news.',
      prices: 'Prices', stocks: 'Stocks', flat: 'Flats', gold: 'Gold',
      balance: function (x) { return 'Your savings changed by ' + x + ' this quarter.'; },
      gaugeLabel: 'Safety: how many years of living costs you could live on', ofGoal: function (g) { return 'goal ' + g + ' years'; },
      years: function (x) { return x.toFixed(1) + ' years'; },
      gaugeCap: function (nw, exp) { return '<span class="num">' + nw + '</span> net worth<br><span class="num">' + exp + '</span> living costs a year'; },
      streak: function (n, w) { return 'Goal reached ' + n + ' of ' + w + ' quarters in a row. Hold on.'; },
      ledgerH: 'This quarter, if you change nothing', pay: 'Take-home pay', benefit: 'Unemployment benefit',
      bonusLine: 'of which bonus', living: 'Living expenses', card: 'Interest on consumer debt',
      intL: 'Savings interest after tax', divL: 'Dividends after tax', rentL: 'Rent minus loan payments', passive: 'passive', left: 'Left over',
      ecoH: 'The economy now', infl: 'inflation, year over year', unemp: 'unemployment', depRate: 'postal savings rate', mortRate: 'bank housing loan',
      whereH: 'Where to put your money',
      savings: 'Postal savings (定額貯金)', aYear: ' a year',
      ownCash: function (c) { return 'Saved: <b class="num">' + c + '</b>. Anything you don’t invest sits here and earns interest.'; },
      intTaxNote: function (on) { return on ? ' Interest is taxed at 20%.' : ' Interest on small savings is tax-free (マル優).'; },
      onCard: function (c, r) { return 'Your savings are gone and you are borrowing: <b class="num">' + c + '</b> at ' + r + ' a year.'; },
      stocksN: 'Stocks', index: 'index', thisQ: 'this quarter', dividend: 'dividend',
      ownStocks: function (v, c, p) { return 'You hold <b class="num">' + v + '</b> in stocks (invested ' + c + ', ' + p + ').'; },
      noStocks: function (f) { return 'No stocks. A basket of large Japanese companies. Broker and transfer costs about ' + f + ' each way.'; },
      buy: 'Buy', sell: 'Sell', all: 'all',
      goldN: 'Gold', perGram: ' a gram',
      ownGold: function (v, c, p) { return 'You hold <b class="num">' + v + '</b> in gold (invested ' + c + ', ' + p + '). It pays no income.'; },
      noGold: function (s) { return 'No gold. It pays no income; the dealer buys back about ' + s + ' below its selling price.'; },
      flatN: 'Flat to rent out', loanAt: 'bank loan',
      downRow: function (d) { return d + '% down plus taxes and fees'; }, loanRow: function (y) { return y + '-year loan payment'; },
      rentRow: 'Rent after fees, tax and repairs', netRow: 'Net cash flow from the flat', perQ: ' /qtr',
      buyFlat: function (x) { return 'Buy a flat for ' + x; },
      yourFlat: function (i, y, p) { return '<b>Your flat ' + i + '</b>, bought in year ' + y + ' for ' + p; },
      owed: function (r) { return 'Owed to the bank at ' + r; }, worth: 'Worth now (the building ages)',
      sellFor: function (x, pos) { return 'Sell · ' + (pos ? 'you get ' : 'you pay ') + x; },
      refi: function (r, f, s) { return 'Refinance at ' + r + ' · costs ' + f + ', payment −' + s; },
      why: { job: 'Banks don’t lend to people out of work.', cash: 'You don’t have enough for the 20% down payment, taxes and fees.', bank: 'The bank said no: the payments would take too much of your income.' },
      undo: 'Undo trades', live: 'Live the quarter', liveLast: 'Live the last quarter',
      // results
      result: 'Result', verdict: { bankrupt: 'Bankrupt', won: 'You made it', almost: 'Almost there', half: 'Halfway there', some: 'A cushion, not freedom', none: 'Living paycheck to paycheck' },
      reveal: function (a, b, q, y) { return 'Those were the years ' + a + '–' + b + '. You started in ' + q + ' ' + y + '.'; },
      wonText: function (y) { return 'Your net worth covered ' + E.GOAL_YEARS + ' years of living costs four quarters in a row, in the ' + ordinal(y) + ' year of your career. '; },
      notWon: function (x) { return 'Your net worth covers ' + x + ' of living costs. '; },
      nwText: function (nw, real, k) { return 'Net worth: ' + nw + '. In first-year yen that is ' + real + ': prices changed ×' + k + ' over these years.'; },
      chartH: 'Your net worth by quarter', legReal: 'in first-year yen', legNom: 'on paper',
      cmpH: 'Same years, same career, same luck', strat: 'Strategy', safety: 'Years covered', nwStart: 'Net worth, start-year ¥', you: 'You', bankruptTag: ' (bankrupt)',
      botDeposit: 'Everything in postal savings', botStocks: 'All spare cash into stocks', botHouses: 'Buy a flat as soon as the bank says yes',
      yenH: 'What became of ¥10,000 over these years', inv: 'Investment', paper: 'On paper', afterInfl: 'After inflation',
      invRows: ['Postal savings with interest', 'Stocks with dividends', 'New flat (price, no rent)', 'Gold'],
      yenHint: function (k) { return 'To buy what ¥10,000 bought at the start, you needed ¥' + k + ' at the end.'; },
      timeH: 'Timeline: what that news was', again: 'Play again',
      srcH: 'Where the data comes from and what is simplified',
      src: [
        'Prices and rent: consumer price index for Japan and its rent component (Statistics Bureau, via OECD/FRED).',
        'Unemployment: Labour Force Survey (via OECD/FRED). Stocks: OECD share price index for Japan.',
        'Savings: postal 定額貯金 rate; bank housing loan rate of city banks (日本の長期統計系列; Bank of Japan).',
        'Flats: BIS residential property price index for Japan, scaled so a small flat costs ¥30 million at the start of 1990. Gold: Tokuriki Honten retail price.',
        'Pay: graduate starting salaries (MHLW wage structure survey; 1980–88 partly estimated), bonus months (National Personnel Authority), taxes (Ministry of Finance), social insurance and unemployment benefit (MHLW).',
        'Estimates, not measured: dividend yields, rent at 5.5% of the price at the start, owner’s costs, purchase and sale costs, consumer-loan rate (25%), pay of nurses, construction workers and doctors, layoff risk by career, cost of children.'
      ],
      langLabel: 'Language'
    },
    ja: {
      title: '他人の靴をはいて', sub: '日本編',
      eyebrow: '実際の日本経済データで遊ぶゲーム',
      intro: 'あなたは社会人になったばかり。15年間を四半期ごとに生きていきます。給料、ボーナス、物価、金利、株価、マンション価格、金の価格は、すべて当時の実際の動きどおり。今が何年なのかはわかりません。',
      ruleGoal: '<b>ゴール</b>　資産だけで' + E.GOAL_YEARS + '年分の生活費をまかなえる状態を、4四半期続けて維持すること。資産は貯金・株・金・マンションから借金を引いた純資産で数えます。',
      ruleTurn: '<b>あなたの番</b>　お金の行き先を決めます。郵便貯金、株、金、それともローンで賃貸用マンション。そして四半期を過ごし、ニュースを読みます。',
      ruleLife: '<b>人生</b>　ボーナスは夏と冬。失業、思わぬ出費、昇進は偶然に起きます。失業率が高い時期ほど、職を失いやすくなります。',
      resume: function (p, y) { return '続きから遊ぶ：' + p + '、' + y + '年目'; },
      pick: '職業を選んでください。入社初日から始まります',
      perMonth: '（月給）', bonusMonths: function (m) { return '＋ボーナス約' + m.toFixed(1) + 'か月分／年'; },
      startsAt: function (a) { return a + '歳から'; }, growth: function (x) { return '15年間の昇給 ' + x; },
      riskLow: '失業の心配はほぼなし', riskMid: '失業の危険あり', riskHigh: '失業しやすい',
      yearOf: function (y) { return '15年中 ' + y + '年目'; }, qname: ['第1四半期', '第2四半期', '第3四半期', '第4四半期'],
      age: function (a) { return a + '歳'; }, outOfWork: '失業中', kids: function (n) { return '子ども' + n + '人'; },
      startOver: '最初から', sure: '本当に？データが消えます',
      dayOne: '入社初日', firstDay: function (a, c) { return '入社初日。あなたは' + a + '歳、貯金は' + c + '。'; },
      noYear: '今が何年かはわかりません。金利、物価、ニュースから推理してください。',
      wire: 'ニュース · この四半期の出来事', quiet: '大きなニュースのない四半期。',
      prices: '物価', stocks: '株価', flat: 'マンション', gold: '金',
      balance: function (x) { return 'この四半期の貯金の増減：' + x + '。'; },
      gaugeLabel: '安心度 — 資産で何年分の生活費をまかなえるか', ofGoal: function (g) { return '目標 ' + g + '年'; },
      years: function (x) { return x.toFixed(1) + '年分'; },
      gaugeCap: function (nw, exp) { return '純資産 <span class="num">' + nw + '</span><br>年間の生活費 <span class="num">' + exp + '</span>'; },
      streak: function (n, w) { return '目標達成 ' + n + '／' + w + '四半期。このまま維持しましょう。'; },
      ledgerH: '何もしなければ、この四半期は', pay: '手取りの給料', benefit: '失業手当',
      bonusLine: 'うちボーナス', living: '生活費', card: '借金の利息',
      intL: '貯金の利息（税引後）', divL: '配当（税引後）', rentL: '家賃収入−ローン返済', passive: '不労所得', left: '残るお金',
      ecoH: '現在の経済', infl: '物価上昇率（前年比）', unemp: '失業率', depRate: '郵便貯金の金利', mortRate: '住宅ローン金利',
      whereH: 'お金の行き先',
      savings: '郵便貯金（定額貯金）', aYear: '（年利）',
      ownCash: function (c) { return '貯金 <b class="num">' + c + '</b>。投資しないお金はここで利息を生みます。'; },
      intTaxNote: function (on) { return on ? '利息には20％課税。' : '少額貯蓄の利息は非課税（マル優）。'; },
      onCard: function (c, r) { return '貯金が尽き、借金で暮らしています：<b class="num">' + c + '</b>、年利' + r + '。'; },
      stocksN: '株式', index: '指数', thisQ: '前期比', dividend: '配当利回り',
      ownStocks: function (v, c, p) { return '保有株 <b class="num">' + v + '</b>（投資額 ' + c + '、' + p + '）。'; },
      noStocks: function (f) { return '株なし。日本の大企業の株をまとめて買います。手数料などは売買ごとに約' + f + '。'; },
      buy: '買う', sell: '売る', all: '全額',
      goldN: '金（ゴールド）', perGram: '／1g',
      ownGold: function (v, c, p) { return '保有している金 <b class="num">' + v + '</b>（投資額 ' + c + '、' + p + '）。利息も配当もありません。'; },
      noGold: function (s) { return '金なし。利息も配当もなく、買取価格は販売価格より約' + s + '低い。'; },
      flatN: '賃貸用マンション', loanAt: 'ローン金利',
      downRow: function (d) { return '頭金' + d + '％と諸費用'; }, loanRow: function (y) { return y + '年ローンの返済'; },
      rentRow: '管理費・税・修繕を引いた家賃', netRow: 'マンションの収支', perQ: '／四半期',
      buyFlat: function (x) { return x + 'で購入する'; },
      yourFlat: function (i, y, p) { return '<b>マンション' + i + '</b>　' + y + '年目に' + p + 'で購入'; },
      owed: function (r) { return 'ローン残高（金利' + r + '）'; }, worth: '現在の価値（建物は古くなる）',
      sellFor: function (x, pos) { return '売却 · ' + (pos ? '手取り ' : '持ち出し ') + x; },
      refi: function (r, f, s) { return r + 'で借り換え · 費用 ' + f + '、返済額 −' + s; },
      why: { job: '無職の人には融資できません。', cash: '頭金20％と諸費用が足りません。', bank: '審査に通りません：収入に対して返済が重すぎます。' },
      undo: '取引を取り消す', live: 'この四半期を過ごす', liveLast: '最後の四半期を過ごす',
      result: '結果', verdict: { bankrupt: '自己破産', won: '目標達成', almost: 'あと少し', half: '道なかば', some: '備えはあるが、自由には遠い', none: 'その日暮らし' },
      reveal: function (a, b, q, y) { return 'これは' + a + '年〜' + b + '年（' + era(a) + '〜' + era(b) + '）でした。スタートは' + y + '年の' + q + '。'; },
      wonText: function (y) { return '純資産が生活費' + E.GOAL_YEARS + '年分を上回る状態が4四半期続きました。社会人' + y + '年目です。'; },
      notWon: function (x) { return '純資産でまかなえる生活費は' + x + '。'; },
      nwText: function (nw, real, k) { return '純資産は' + nw + '。最初の年の物価では' + real + 'で、この間に物価は×' + k + 'になりました。'; },
      chartH: '純資産の推移', legReal: '最初の年の物価で', legNom: '名目',
      cmpH: '同じ年、同じ職業、同じ運での比較', strat: '戦略', safety: '生活費の何年分', nwStart: '純資産（開始時の物価）', you: 'あなた', bankruptTag: '（破産）',
      botDeposit: '全額を郵便貯金', botStocks: '余裕資金はすべて株式', botHouses: '融資が通ればすぐマンション購入',
      yenH: '1万円はこの間にどうなったか', inv: '運用先', paper: '名目', afterInfl: '物価調整後',
      invRows: ['郵便貯金（利息込み）', '株式（配当込み）', '新築マンション（価格のみ）', '金'],
      yenHint: function (k) { return '最初に1万円で買えたものを、最後に買うには' + k + '円が必要でした。'; },
      timeH: '年表：あのニュースはいつだったか', again: 'もう一度遊ぶ',
      srcH: 'データの出典と簡略化した点',
      src: [
        '物価と家賃：消費者物価指数とその家賃（総務省統計局、OECD/FRED経由）。',
        '失業率：労働力調査（OECD/FRED経由）。株価：OECDの日本株価指数。',
        '貯金：郵便貯金（定額）の金利。ローン：都市銀行の住宅ローン金利（日本の長期統計系列、日本銀行）。',
        'マンション：BISの日本住宅価格指数（1990年初めに小型マンションが3000万円になるよう換算）。金：徳力本店の小売価格。',
        '給料：大卒初任給（厚生労働省 賃金構造基本統計調査、1980〜88年は一部推計）、ボーナス月数（人事院）、税（財務省）、社会保険料と失業手当（厚生労働省）。',
        '推計値（実測ではない）：配当利回り、初期の家賃（価格の5.5％）、オーナーの経費、売買の諸費用、借金の金利（25％）、看護師・建設作業員・医師の給料、職業別の失業リスク、子どもの費用。'
      ],
      langLabel: '言語'
    }
  };
  var PROF = {
    en: {
      salary: ['Big-company salaryman', 'Seniority pay and two big bonuses a year. Layoffs are rare, but the company decides where you live.'],
      bank: ['Bank employee', 'The best starting pay and the fattest bonuses. Banks never fail, or so everyone says.'],
      city: ['City hall clerk', 'Pay follows the public scale, a raise every year, almost no chance of losing the job.'],
      teacher: ['Elementary school teacher', 'Paid a little above other civil servants by law. Steady, not rich.'],
      nurse: ['Nurse', 'Night shifts pay extra and hospitals always need staff, but the pay ceiling comes early.'],
      auto: ['Auto plant worker', 'Starts at 18 after high school. Good bonuses while cars sell abroad.'],
      build: ['Construction worker', 'Paid by the day. Plenty of work while land is booming, little when it is not.'],
      shop: ['Shop clerk on contract', 'Almost no bonus, small raises, first to go when sales drop.'],
      prog: ['Programmer', 'A new profession with good pay. Demand rises and falls with the computer boom.'],
      doctor: ['Doctor', 'Two years of residency on a small salary, then income more than doubles.']
    },
    ja: {
      salary: ['大企業の会社員', '年功序列の給料と年2回の大きなボーナス。リストラはまれだが、転勤先は会社が決める。'],
      bank: ['銀行員', '初任給もボーナスもトップクラス。銀行はつぶれない、と誰もが言う。'],
      city: ['市役所職員', '給料は公務員の俸給表どおり。毎年昇給し、失業の心配はほぼない。'],
      teacher: ['小学校教員', '法律で一般の公務員より少し高い給料。安定しているが、裕福ではない。'],
      nurse: ['看護師', '夜勤手当がつき、病院はいつも人手不足。ただ給料の頭打ちは早い。'],
      auto: ['自動車工場の工員', '高校を出て18歳で入社。輸出が好調なうちはボーナスも厚い。'],
      build: ['建設作業員', '日給制。地価が上がる時代は仕事があふれ、下がれば減る。'],
      shop: ['販売員（契約社員）', 'ボーナスはほぼなく、昇給もわずか。売上が落ちれば真っ先に切られる。'],
      prog: ['プログラマー', '新しい職業で給料はよい。需要はコンピューターブームしだい。'],
      doctor: ['医師', '2年間の研修医は薄給。その後、収入は2倍以上に。']
    }
  };
  var NOTES = {
    en: {
      cost0: 'The car broke down: repairs {0}', cost1: 'A big dental bill: {0}', cost2: 'A week in hospital: {0}',
      cost3: 'A relative’s wedding, gift money and travel: {0}', cost4: 'A funeral in the family, condolence money and travel: {0}', cost5: 'The air conditioner and fridge died together: {0}',
      gain0: 'Year-end tax adjustment refund: +{0}', gain1: 'Won a prize in the company raffle: +{0}', gain2: 'A small inheritance from a grandparent: +{0}', gain3: 'Weekend side job: +{0}',
      baby: 'A baby was born. Living costs went up {0}%.', promo: 'Promotion: pay +5%.',
      laidOff: 'You lost your job. Unemployment benefit pays part of your salary while you look for work; a new employer will pay a bit less.',
      bankFail: 'Your bank failed and you are out of a job.', rehired: 'You found a new job, at somewhat lower pay.',
      residencyDone: 'Residency is over. Your income more than doubled, and your living costs rose with it.', lifeUp: 'Your income went up, and so did your lifestyle.',
      soldGold: 'The lender called in your debt: your gold was sold.', soldStocks: 'The lender called in your debt: your stocks were sold.', soldHouse: 'The lender called in your debt: a flat was sold.',
      bankrupt: 'Your debts are more than you can carry. Personal bankruptcy.'
    },
    ja: {
      cost0: '車が故障、修理代 {0}', cost1: '歯医者の高い請求 {0}', cost2: '1週間の入院 {0}',
      cost3: '親戚の結婚式（ご祝儀と交通費）{0}', cost4: '親族の葬儀（香典と交通費）{0}', cost5: 'エアコンと冷蔵庫が同時に故障 {0}',
      gain0: '年末調整で税金が戻った ＋{0}', gain1: '会社の福引きで当選 ＋{0}', gain2: '祖父母から少し遺産 ＋{0}', gain3: '週末のアルバイト ＋{0}',
      baby: '子どもが生まれた。生活費が{0}％増えた。', promo: '昇進：給料が5％アップ。',
      laidOff: '職を失った。次の仕事が見つかるまで失業手当で暮らす。転職先の給料は少し下がる。',
      bankFail: '勤め先の銀行が破綻し、職を失った。', rehired: '再就職が決まった。給料は以前より少し低い。',
      residencyDone: '研修医の期間が終わり、収入は2倍以上に。生活費もそれにつれて増えた。', lifeUp: '収入が増え、暮らしぶりも上がった。',
      soldGold: '借金の返済を迫られ、金を売却した。', soldStocks: '借金の返済を迫られ、株を売却した。', soldHouse: '借金の返済を迫られ、マンションを売却した。',
      bankrupt: '借金を返しきれず、自己破産。'
    }
  };
  function L() { return T[lang]; }
  function profName(id) { return PROF[lang][id][0]; }
  function note(n) {
    var s = NOTES[lang][n.key] || n.key;
    if (n.v) s = s.replace('{0}', /^cost|^gain/.test(n.key) ? money(n.v[0]) : n.v[0]);
    return s;
  }

  /* ---------- formatting ---------- */
  var NB = ' ';
  function commas(x) { return Math.round(Math.abs(x)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function jaYen(a) {
    a = Math.round(a);
    if (a >= 1e8) { var oku = Math.floor(a / 1e8), man = Math.round((a - oku * 1e8) / 1e4); return oku + '億' + (man ? commas(man) + '万' : '') + '円'; }
    if (a >= 1e6) return commas(Math.round(a / 1e4)) + '万円';
    if (a >= 1e4) return (a / 1e4).toFixed(1).replace(/\.0$/, '') + '万円';
    return commas(a) + '円';
  }
  function yen(a) { return lang === 'ja' ? jaYen(a) : '¥' + commas(a); }
  function money(x) { return (x < -0.5 ? '−' : '') + yen(Math.abs(x)); }
  function signed(x) { return Math.abs(x) < 0.5 ? yen(0) : (x < 0 ? '−' : '+') + yen(Math.abs(x)); }
  function cls(x) { return Math.abs(x) < 0.5 ? '' : (x < 0 ? 'neg' : 'pos'); }
  function pct(x, d) { return (x * 100).toFixed(d == null ? 1 : d).replace('-', '−') + '%'; }
  function spct(x, d) { return (x >= 0 ? '+' : '') + pct(x, d); }
  function rate(v, d) { return v.toFixed(d == null ? 1 : d) + '%'; }
  function times(x) { return '×' + (x >= 10 ? x.toFixed(0) : x.toFixed(1)); }
  function ordinal(n) { var b = n % 100, a = n % 10; return n + ((b >= 11 && b <= 13) ? 'th' : a === 1 ? 'st' : a === 2 ? 'nd' : a === 3 ? 'rd' : 'th'); }
  function era(y) { return y < 1989 ? '昭和' + (y - 1925) + '年' : y === 1989 ? '平成元年' : '平成' + (y - 1988) + '年'; }
  function short(v) {
    var a = Math.abs(v), s = v < 0 ? '−' : '';
    if (lang === 'ja') {
      if (a >= 1e8) return s + (a / 1e8).toFixed(1).replace(/\.0$/, '') + '億';
      if (a >= 1e4) return s + commas(Math.round(a / 1e4)) + '万';
      return s + commas(a);
    }
    if (a >= 1e6) return s + '¥' + (a / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return s + '¥' + Math.round(a / 1e3) + 'k';
    return s + '¥' + commas(a);
  }
  function qKey(q) { var l = E.label(q); return l.y + 'Q' + l.k; }
  function row(label, value, c, tag) {
    return '<div class="row"><span>' + label + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</span><span class="dots"></span><span class="num ' + (c || '') + '">' + value + '</span></div>';
  }
  function spark(arr) {
    if (arr.length < 2) arr = [arr[0], arr[0]];
    var w = 96, h = 32, p = 4, mn = Math.min.apply(null, arr), mx = Math.max.apply(null, arr), n = arr.length, pts = [];
    for (var i = 0; i < n; i++) {
      var x = p + i / (n - 1) * (w - 2 * p), y = mx === mn ? h / 2 : h - p - (arr[i] - mn) / (mx - mn) * (h - 2 * p);
      pts.push(x.toFixed(1) + ' ' + y.toFixed(1));
    }
    var last = pts[n - 1].split(' ');
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path class="a" d="M' + pts.join('L') + 'L' + (w - p) + ' ' + h + 'L' + p + ' ' + h + 'Z"/><path class="l" d="M' + pts.join('L') + '"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="2.6"/></svg>';
  }
  function langToggle() {
    return '<div class="lang" role="group" aria-label="' + L().langLabel + '"><button data-a="lang" data-l="en" aria-pressed="' + (lang === 'en') + '">EN</button><button data-a="lang" data-l="ja" aria-pressed="' + (lang === 'ja') + '">日本語</button></div>';
  }

  /* ---------- saving ---------- */
  function save() { try { localStorage.setItem(SAVE, JSON.stringify({ G: G, screen: screen, offer: offer })); } catch (e) { /* without storage the game just won't survive a reload */ } }
  function load() { try { var d = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (d && d.offer) { G = d.G; screen = d.screen; offer = d.offer; } } catch (e) { G = null; } }
  function newOffer() { var seed = Math.floor(Math.random() * 2147483647) + 1; offer = { seed: seed, start: seed % (E.MAX_START + 1) }; }
  function markTurn() { turnStart = JSON.stringify(G); dirty = false; }

  /* ---------- career picker ---------- */
  function viewStart() {
    var t = L();
    var h = '<section class="hero"><div class="hero-top"><div class="eyebrow">' + t.eyebrow + '</div>' + langToggle() + '</div><h1>' + t.title + '<br><span class="muted">' + t.sub + '</span></h1>' +
      '<p>' + t.intro + '</p><ul class="rules"><li>' + t.ruleGoal + '</li><li>' + t.ruleTurn + '</li><li>' + t.ruleLife + '</li></ul></section>';
    if (G && !G.over && !G.won) h += '<button class="btn" data-a="resume">' + t.resume(profName(G.prof), Math.floor(G.t / 4) + 1) + '</button>';
    h += '<section class="block"><h2>' + t.pick + '</h2><div class="profs">';
    var probe = { prof: null, promo: 1, start: offer.start };
    E.PROFS.forEach(function (p) {
      probe.prof = p.id;
      var pay = E.pay(probe, offer.start, 0);
      var risk = p.sens < 0.15 ? t.riskLow : p.sens < 1 ? t.riskMid : t.riskHigh;
      var meta = [t.startsAt(p.age), t.growth(times(E.career(p, 15))), risk];
      var months = D.bonus[offer.start] * p.bonus;
      h += '<button class="prof" data-a="pick" data-id="' + p.id + '"><span class="prof-name">' + profName(p.id) + '</span><span class="prof-pay">' + money(Math.round(pay.monthly / 100) * 100) + t.perMonth + '</span>' +
        '<span class="prof-note">' + PROF[lang][p.id][1] + ' ' + (p.jumpAt ? '' : t.bonusMonths(months)) + '</span><span class="prof-meta"><span>' + meta.join('</span><span>') + '</span></span></button>';
    });
    h += '</div></section>' + sources();
    return h;
  }
  function sources() { var t = L(); return '<details><summary>' + t.srcH + '</summary><ul><li>' + t.src.join('</li><li>') + '</li></ul></details>'; }

  /* ---------- game screen ---------- */
  function header() {
    var t = L(), p = E.prof(G.prof), yr = Math.floor(G.t / 4), age = p.age + yr;
    var h = '<header class="top"><div class="top-row"><span class="brand">' + t.title + ' · ' + t.sub + '</span><span class="when">' + t.yearOf(yr + 1) + ' · ' + t.qname[E.label(G.q).k - 1] + '</span></div>' +
      '<div class="top-row"><span class="who">' + profName(G.prof) + ', ' + t.age(age) + (G.employed ? '' : ' · <span class="neg">' + t.outOfWork + '</span>') + (G.kids ? ' · ' + t.kids(G.kids) : '') + '</span>' +
      '<span class="acts">' + langToggle() + '<button class="chip" data-a="quit">' + (askQuit ? t.sure : t.startOver) + '</button></span></div><div class="years" aria-hidden="true">';
    for (var y = 0; y < 15; y++) {
      h += '<div class="year">';
      for (var k = 0; k < 4; k++) { var tt = y * 4 + k; h += '<i class="tick ' + (tt < G.t ? 'done' : tt === G.t ? 'now' : '') + '"></i>'; }
      h += '</div>';
    }
    return h + '</div></header>';
  }
  function wire() {
    var t = L(), p = E.prof(G.prof);
    if (!G.log.length) {
      return '<section class="wire"><div class="eyebrow">' + t.dayOne + '</div><div class="wire-head">' + t.firstDay(p.age, money(G.cash)) + '</div>' +
        '<div class="notes"><div class="note">' + t.noYear + '</div></div></section>';
    }
    var rep = G.log[G.log.length - 1], n = NEWS[qKey(rep.q)];
    var head = n ? n[lang] : t.quiet;
    var mv = ['<span>' + t.prices + ' <b class="' + (rep.d.cpi > 0.02 ? 'neg' : '') + '">' + spct(rep.d.cpi) + '</b></span>',
      '<span>' + t.stocks + ' <b class="' + cls(rep.d.sp) + '">' + spct(rep.d.sp) + '</b></span>',
      '<span>' + t.flat + ' <b class="' + cls(rep.d.house) + '">' + spct(rep.d.house) + '</b></span>',
      '<span>' + t.gold + ' <b class="' + cls(rep.d.gold) + '">' + spct(rep.d.gold) + '</b></span>'];
    var notes = rep.notes.map(function (x) { return '<div class="note ' + (x.kind === 'bad' ? 'neg' : x.kind === 'good' ? 'pos' : '') + '">' + note(x) + '</div>'; });
    notes.push('<div class="note">' + t.balance('<span class="num ' + cls(rep.flows.total) + '">' + signed(rep.flows.total) + '</span>') + '</div>');
    return '<section class="wire"><div class="eyebrow">' + t.wire + '</div><div class="wire-head">' + head + '</div><div class="moves">' + mv.join('') + '</div><div class="notes">' + notes.join('') + '</div></section>';
  }
  function flows() {
    var pay = E.pay(G), pas = E.passive(G);
    var f = { sal: G.employed ? pay.net : E.benefit(G), bonus: G.employed ? pay.bonus : 0, exp: E.expenses(G), pas: pas };
    f.card = G.cash < 0 ? G.cash * E.CARD_RATE / 400 : 0;
    f.total = f.sal - f.exp + pas.total + f.card;
    return f;
  }
  function gauge() {
    var t = L(), cover = E.cover(G), fr = cover / E.GOAL_YEARS, w = Math.max(0, Math.min(1, fr)) * 100;
    var h = '<section class="free"><div class="eyebrow">' + t.gaugeLabel + '</div><div class="free-row"><span class="free-pct ' + (cover < 0 ? 'neg' : '') + '">' + t.years(cover) + '</span>' +
      '<span class="free-cap">' + t.gaugeCap(money(E.netWorth(G)), money(E.expenses(G) * 4)) + '<br>' + t.ofGoal(E.GOAL_YEARS) + '</span></div>' +
      '<div class="bar" role="img" aria-label="' + t.years(cover) + '"><i class="' + (cover < 0 ? 'neg-fill' : '') + '" style="width:' + w.toFixed(1) + '%"></i></div>';
    if (G.streak > 0) h += '<div class="streak pos">' + t.streak(G.streak, E.WIN_STREAK) + '</div>';
    return h + '</section>';
  }
  function ledger(f) {
    var t = L(), h = '<section class="block"><h2>' + t.ledgerH + '</h2><div class="rows">';
    h += row(G.employed ? t.pay : t.benefit, signed(f.sal), 'pos');
    if (f.bonus > 0.5) h += row(' ' + t.bonusLine, money(f.bonus) + (lang === 'ja' ? '（額面）' : ' gross'), 'muted');
    h += row(t.living, signed(-f.exp), 'neg');
    if (f.card) h += row(t.card, signed(f.card), 'neg');
    if (G.cash > 0) h += row(t.intL, signed(f.pas.interest), cls(f.pas.interest), t.passive);
    if (G.units > 0) h += row(t.divL, signed(f.pas.div), 'pos', t.passive);
    if (G.houses.length) h += row(t.rentL, signed(f.pas.rent), cls(f.pas.rent), t.passive);
    h += '<div class="row sum"><span>' + t.left + '</span><span class="dots"></span><span class="num ' + cls(f.total) + '">' + signed(f.total) + '</span></div>';
    return h + '</div></section>';
  }
  function economy() {
    var t = L(), q = G.q;
    return '<section class="block"><h2>' + t.ecoH + '</h2><div class="eco">' +
      '<div><b>' + rate(D.infl[q]) + '</b><span>' + t.infl + '</span></div>' +
      '<div><b>' + rate(D.un[q]) + '</b><span>' + t.unemp + '</span></div>' +
      '<div><b>' + rate(D.tb[q], 2) + '</b><span>' + t.depRate + '</span></div>' +
      '<div><b>' + rate(D.mort[q], 2) + '</b><span>' + t.mortRate + '</span></div></div></section>';
  }
  function chips(label, act, base, enabled) {
    var t = L(), h = '<div class="acts"><span>' + label + '</span>';
    [[0.25, '¼'], [0.5, '½'], [1, t.all]].forEach(function (x) {
      var v = base * x[0];
      h += '<button class="chip" data-a="' + act + '" data-f="' + x[0] + '"' + (enabled && v >= 1 ? '' : ' disabled') + '>' + x[1] + (enabled && v >= 1 ? ' · ' + money(v) : '') + '</button>';
    });
    return h + '</div>';
  }
  function hist(arr) { return arr.slice(G.start, G.q + 1); }
  function chg(arr) { var t = L(); return G.q > G.start ? ' · ' + t.thisQ + ' <b class="' + cls(arr[G.q] / arr[G.q - 1] - 1) + '">' + spct(arr[G.q] / arr[G.q - 1] - 1) + '</b>' : ''; }
  function assets() {
    var t = L(), q = G.q, cash = G.cash, h = '<section class="block"><h2>' + t.whereH + '</h2>';
    // savings
    h += '<div class="asset"><div class="asset-head"><div><div class="asset-name">' + t.savings + '</div><div class="asset-price"><b>' + rate(D.tb[q], 2) + '</b>' + t.aYear + '</div></div>' + spark(hist(D.tb)) + '</div>';
    if (cash >= 0) h += '<div class="own">' + t.ownCash(money(cash)) + ' ' + t.intTaxNote(E.intTax(q) > 0) + '</div>';
    else h += '<div class="own neg">' + t.onCard(money(-cash), rate(E.CARD_RATE, 0)) + '</div>';
    h += '</div>';
    // stocks
    var sv = G.units * D.sp[q];
    h += '<div class="asset"><div class="asset-head"><div><div class="asset-name">' + t.stocksN + '</div><div class="asset-price">' + t.index + ' <b>' + D.sp[q].toFixed(1) + '</b>' + chg(D.sp) + ' · ' + t.dividend + ' ' + rate(D.dy[q], 2) + '</div></div>' + spark(hist(D.sp)) + '</div>';
    h += sv > 0.5 ? '<div class="own">' + t.ownStocks(money(sv), money(G.cost.units), '<span class="' + cls(sv - G.cost.units) + '">' + spct(sv / G.cost.units - 1, 0) + '</span>') + '</div>' : '<div class="own muted">' + t.noStocks(rate(E.stockFee(q) * 100)) + '</div>';
    h += chips(t.buy, 'buyS', Math.max(0, cash), cash >= 1);
    if (sv > 0.5) h += chips(t.sell, 'sellS', sv, true);
    h += '</div>';
    // gold
    var gv = G.oz * D.gold[q];
    h += '<div class="asset"><div class="asset-head"><div><div class="asset-name">' + t.goldN + '</div><div class="asset-price"><b>' + money(D.gold[q]) + '</b>' + t.perGram + chg(D.gold) + '</div></div>' + spark(hist(D.gold)) + '</div>';
    h += gv > 0.5 ? '<div class="own">' + t.ownGold(money(gv), money(G.cost.oz), '<span class="' + cls(gv - G.cost.oz) + '">' + spct(gv / G.cost.oz - 1, 0) + '</span>') + '</div>' : '<div class="own muted">' + t.noGold(rate(E.GOLD_SPREAD * 100, 0)) + '</div>';
    h += chips(t.buy, 'buyG', Math.max(0, cash), cash >= 1);
    if (gv > 0.5) h += chips(t.sell, 'sellG', gv, true);
    h += '</div>';
    // flat
    var k = E.houseQuote(G);
    h += '<div class="asset"><div class="asset-head"><div><div class="asset-name">' + t.flatN + '</div><div class="asset-price"><b>' + money(k.price) + '</b>' + chg(D.house) + ' · ' + t.loanAt + ' ' + rate(k.rate, 2) + '</div></div>' + spark(hist(D.house)) + '</div><div class="rows">' +
      row(t.downRow(Math.round(E.DOWN * 100)), money(k.need)) + row(t.loanRow(E.LOAN_YEARS), signed(-k.pay) + t.perQ, 'neg') + row(t.rentRow, signed(k.rent * E.RENT_KEEP) + t.perQ, 'pos') +
      '<div class="row sum"><span>' + t.netRow + '</span><span class="dots"></span><span class="num ' + cls(k.net) + '">' + signed(k.net) + t.perQ + '</span></div></div>' +
      '<div class="acts"><button class="btn" data-a="buyH"' + (k.ok ? '' : ' disabled') + '>' + t.buyFlat(money(k.need)) + '</button></div>' + (k.why ? '<div class="why">' + t.why[k.why] + '</div>' : '');
    G.houses.forEach(function (hh, i) {
      var net = E.houseNet(hh, q), sale = E.houseSale(G, i), rf = E.refiQuote(G, i);
      h += '<div class="house"><div class="own">' + t.yourFlat(i + 1, Math.floor((hh.bought - G.start) / 4) + 1, money(hh.price)) + '</div><div class="rows">' +
        row(t.worth, money(E.houseValue(hh, q))) + row(t.owed(rate(hh.rate, 2)), money(hh.bal)) + row(t.rentL, signed(net) + t.perQ, cls(net)) + '</div><div class="acts">' +
        '<button class="chip" data-a="sellH" data-i="' + i + '">' + t.sellFor(money(Math.abs(sale)), sale >= 0) + '</button>';
      if (rf.offered) h += '<button class="chip" data-a="refi" data-i="' + i + '"' + (rf.ok ? '' : ' disabled') + '>' + t.refi(rate(rf.rate, 2), money(rf.fee), money(rf.saves)) + '</button>';
      h += '</div></div>';
    });
    return h + '</div></section>';
  }
  function viewPlay() {
    var t = L(), f = flows();
    return header() + wire() + gauge() + ledger(f) + economy() + assets() +
      '<div class="dock"><div class="dock-in">' + (dirty ? '<button class="btn ghost" data-a="undo">' + t.undo + '</button>' : '') +
      '<button class="btn" data-a="next">' + (G.t === E.LEN - 1 ? t.liveLast : t.live) + ' →</button></div></div>';
  }

  /* ---------- results ---------- */
  function chart() {
    var H = G.hist, n = H.length - 1, W = 560, HT = 280, Lm = 92, R = 18, Tm = 14, B = 36;
    var vals = [0]; H.forEach(function (h) { vals.push(h.nw, h.real); });
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals); if (mx - mn < 1) mx = mn + 1;
    var raw = (mx - mn) / 4, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), nm = raw / mag, stepv = (nm < 1.5 ? 1 : nm < 3 ? 2 : nm < 7 ? 5 : 10) * mag;
    var lo = Math.floor(mn / stepv) * stepv, hi = Math.ceil(mx / stepv) * stepv;
    function X(t) { return Lm + (n ? t / n : 0) * (W - Lm - R); }
    function Y(v) { return Tm + (hi - v) / (hi - lo) * (HT - Tm - B); }
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + HT + '" role="img" aria-label="' + L().chartH + '">';
    for (var v = lo; v <= hi + stepv / 2; v += stepv) s += '<line class="' + (Math.abs(v) < stepv / 10 ? 'zero' : 'grid') + '" x1="' + Lm + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text x="' + (Lm - 8) + '" y="' + (Y(v) + 5).toFixed(1) + '" text-anchor="end">' + short(v) + '</text>';
    for (var t = 0; t <= n; t++) { var l = E.label(G.start + t); if (l.k === 1 && l.y % 3 === 0 && X(t) < W - 30) s += '<line class="grid" x1="' + X(t).toFixed(1) + '" x2="' + X(t).toFixed(1) + '" y1="' + (HT - B) + '" y2="' + (HT - B + 6) + '"/><text x="' + X(t).toFixed(1) + '" y="' + (HT - 10) + '" text-anchor="middle">' + l.y + '</text>'; }
    var pr = H.map(function (h, i) { return X(i).toFixed(1) + ' ' + Y(h.real).toFixed(1); }), pn = H.map(function (h, i) { return X(i).toFixed(1) + ' ' + Y(h.nw).toFixed(1); });
    s += '<path class="real-a" d="M' + pr.join('L') + 'L' + X(n).toFixed(1) + ' ' + Y(0).toFixed(1) + 'L' + X(0).toFixed(1) + ' ' + Y(0).toFixed(1) + 'Z"/><path class="nom" d="M' + pn.join('L') + '"/><path class="real" d="M' + pr.join('L') + '"/><circle class="dot" r="4" cx="' + X(n).toFixed(1) + '" cy="' + Y(H[n].real).toFixed(1) + '"/>';
    return s + '</svg>';
  }
  function viewEnd() {
    var t = L(), last = G.hist[G.hist.length - 1], a = E.label(G.start), b = E.label(G.q), yrs = G.t / 4, cover = last.free * E.GOAL_YEARS;
    var title = G.bankrupt ? t.verdict.bankrupt : G.won ? t.verdict.won : last.free >= 0.75 ? t.verdict.almost : last.free >= 0.5 ? t.verdict.half : last.free >= 0.2 ? t.verdict.some : t.verdict.none;
    var dur = lang === 'ja' ? (yrs % 1 === 0 ? yrs : yrs.toFixed(2)) + '年' : (yrs % 1 === 0 ? yrs : yrs.toFixed(2)) + (yrs === 1 ? ' year' : ' years');
    var k = (D.cpi[G.q] / D.cpi[G.start]).toFixed(2);
    var h = '<section class="verdict"><div class="hero-top"><div class="eyebrow">' + t.result + ' · ' + profName(G.prof) + ' · ' + dur + '</div>' + langToggle() + '</div><h1>' + title + '</h1>' +
      '<div class="reveal">' + t.reveal(a.y, b.y, t.qname[a.k - 1], a.y) + '</div>' +
      '<p>' + (G.won ? t.wonText(Math.ceil(G.wonAt / 4)) : t.notWon(t.years(cover))) + t.nwText(money(last.nw), money(last.real), k) + '</p></section>';
    h += '<section class="block"><h2>' + t.chartH + '</h2><div class="legend"><span><i></i>' + t.legReal + '</span><span><i class="n"></i>' + t.legNom + '</span></div>' + chart() + '</section>';
    h += '<section class="block"><h2>' + t.cmpH + '</h2><div class="tbl-wrap"><table><thead><tr><th>' + t.strat + '</th><th class="num">' + t.safety + '</th><th class="num">' + t.nwStart + '</th></tr></thead><tbody>' +
      '<tr class="me"><td>' + t.you + '</td><td class="num">' + t.years(cover) + '</td><td class="num">' + money(last.real) + '</td></tr>';
    Object.keys(E.BOTS).forEach(function (id) {
      var s = E.runBot(G.prof, G.seed, G.start, E.BOTS[id]), x = s.hist[Math.min(G.t, s.hist.length - 1)];
      h += '<tr><td>' + t[E.BOTS[id].key] + (s.bankrupt && s.hist.length - 1 <= G.t ? t.bankruptTag : '') + '</td><td class="num">' + t.years(x.free * E.GOAL_YEARS) + '</td><td class="num">' + money(x.real) + '</td></tr>';
    });
    h += '</tbody></table></div></section>';
    var s0 = G.start, s1 = G.q, infl = D.cpi[s1] / D.cpi[s0], dep = 1, tr = 1;
    for (var q = s0; q < s1; q++) { dep *= 1 + D.tb[q] / 400 * (1 - E.intTax(q)); tr *= (D.sp[q + 1] + D.div[q] / 4 * (1 - E.DIV_TAX)) / D.sp[q]; }
    var rows = [dep, tr, D.house[s1] / D.house[s0], D.gold[s1] / D.gold[s0]];
    h += '<section class="block"><h2>' + t.yenH + '</h2><div class="tbl-wrap"><table><thead><tr><th>' + t.inv + '</th><th class="num">' + t.paper + '</th><th class="num">' + t.afterInfl + '</th></tr></thead><tbody>';
    rows.forEach(function (r, i) { h += '<tr><td>' + t.invRows[i] + '</td><td class="num">' + money(r * 10000) + '</td><td class="num ' + (r / infl < 1 ? 'neg' : 'pos') + '">' + money(r / infl * 10000) + '</td></tr>'; });
    h += '</tbody></table></div><div class="hint">' + t.yenHint(commas(infl * 10000)) + '</div></section>';
    h += '<section class="block"><h2>' + t.timeH + '</h2><div class="timeline">';
    G.log.forEach(function (rep) { var n = NEWS[qKey(rep.q)]; if (n) { var l = E.label(rep.q); h += '<div><b>' + (lang === 'ja' ? l.y + '年 ' + l.k + 'Q' : l.y + ' · Q' + l.k) + '</b><span>' + n[lang] + '</span></div>'; } });
    h += '</div></section>' + sources() + '<div class="dock"><div class="dock-in"><button class="btn" data-a="again">' + t.again + '</button></div></div>';
    return h;
  }

  function render() {
    document.documentElement.lang = lang;
    document.title = T[lang].title + ' · ' + T[lang].sub;
    app.innerHTML = screen === 'play' && G ? viewPlay() : screen === 'end' && G ? viewEnd() : viewStart();
    save();
  }

  app.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-a]'); if (!b || b.disabled) return;
    var a = b.dataset.a, f = parseFloat(b.dataset.f), i = parseInt(b.dataset.i, 10), done = false, top = false;
    if (a !== 'quit') askQuit = false;
    if (a === 'lang') { lang = b.dataset.l; try { localStorage.setItem(LANGKEY, lang); } catch (e) { /* language just won't be remembered */ } }
    else if (a === 'pick') { G = E.newGame(b.dataset.id, offer.seed, offer.start); screen = 'play'; markTurn(); top = true; }
    else if (a === 'resume') { screen = 'play'; markTurn(); top = true; }
    else if (a === 'again') { G = null; newOffer(); screen = 'start'; top = true; }
    else if (a === 'quit') { if (askQuit) { askQuit = false; G = null; newOffer(); screen = 'start'; top = true; } else askQuit = true; }
    else if (a === 'undo') { G = JSON.parse(turnStart); dirty = false; }
    else if (a === 'next') { E.step(G); if (G.won || G.over) screen = 'end'; markTurn(); top = true; }
    else if (a === 'buyS') done = E.buyStock(G, G.cash * f);
    else if (a === 'sellS') done = E.sellStock(G, f);
    else if (a === 'buyG') done = E.buyGold(G, G.cash * f);
    else if (a === 'sellG') done = E.sellGold(G, f);
    else if (a === 'buyH') done = E.buyHouse(G);
    else if (a === 'sellH') done = E.sellHouse(G, i);
    else if (a === 'refi') done = E.refinance(G, i);
    if (done) dirty = true;
    render();
    if (top) window.scrollTo(0, 0);
  });

  function boot(data) {
    if (data && data.offer) { G = data.G; screen = data.screen; offer = data.offer; } else load();
    if (!offer) newOffer();
    if (!G && screen !== 'start') screen = 'start';
    if (G && screen === 'play') markTurn();
    render();
  }
  var hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(function () { return { G: G, screen: screen, offer: offer }; });
  if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {});
})();
