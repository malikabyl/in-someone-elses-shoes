#!/usr/bin/env python3
"""Build games/japan/index.html from data/*.csv, the news file and src/*.

Run from the repository root:  python3 games/japan/build.py

Every quarterly series is taken at the first month of the quarter,
1980Q1..2005Q4 (104 quarters), the same convention as the US version.
"""
import csv, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, 'data')
NEWS_FILE = next(p for p in [os.path.join(HERE, 'research', 'news-1980-2005-ru.md'),
                             os.path.join(HERE, '..', '..', 'исследования', '2026-10-09-япония-новости-1980-2005.md')]
                 if os.path.exists(p))
N = 104
Y0 = 1980


def rows(name):
    with open(os.path.join(DATA_DIR, name), encoding='utf-8') as f:
        return list(csv.DictReader(f))


def qindex(year, quarter):
    return (year - Y0) * 4 + quarter - 1


def month_of(i):
    """Year and month (1..12) of the first month of quarter i."""
    return Y0 + i // 4, (i % 4) * 3 + 1


# ---------- quarterly table ----------
q = rows('quarterly_1980_2005.csv')
assert len(q) == N
f = lambda k: [float(r[k]) if r[k] != '' else None for r in q]
cpi, rent, un, sp, bis, usd, gold = (f('cpi_2015'), f('rent_cpi_2015'), f('unemployment_sa'),
                                     f('share_price_oecd_2015'), f('res_property_bis_2010'),
                                     f('usdjpy'), f('gold_yen_per_g_retail'))
call = [x if x is not None else None for x in f('call_rate')]

# inflation, year over year; 1980 has no 1979 data here, so it shows the change over the following year
infl = []
for i in range(N):
    j = i if i >= 4 else i + 4
    infl.append(round((cpi[j] / cpi[j - 4] - 1) * 100, 1))


# ---------- year-end rates -> quarterly, linear between year ends ----------
def year_end_series(col, extra):
    ye = {int(r['year']): float(r[col]) for r in rows('rates_year_end_1979_2004.csv') if r[col] != ''}
    ye.update(extra)
    out = []
    for i in range(N):
        y, m = month_of(i)
        a, b = ye.get(y - 1), ye.get(y)
        if a is None:
            a = b
        out.append(round(a + (b - a) * (m - 1) / 12, 3))
    return out


# Postal 定額貯金 "3 years and more"; 2005 kept at the 2003-04 rate.
dep = year_end_series('postal_teigaku_3y_plus', {2005: 0.06})
# City-bank housing loan; 2005 = short-term prime 1.375% + 1 point, as in 1995-2004.
mort = year_end_series('city_bank_mortgage', {2005: 2.375})


# ---------- annual anchors -> quarterly, linear ----------
def anchors_to_quarters(points):
    """points: list of (quarter_index, value), sorted; linear in between, flat outside."""
    out = []
    for i in range(N):
        if i <= points[0][0]:
            out.append(points[0][1]); continue
        if i >= points[-1][0]:
            out.append(points[-1][1]); continue
        for (i0, v0), (i1, v1) in zip(points, points[1:]):
            if i0 <= i <= i1:
                out.append(round(v0 + (v1 - v0) * (i - i0) / (i1 - i0), 4)); break
    return out


# Wage level: university graduate starting pay, effective in April (Q2).
wage = anchors_to_quarters([(qindex(int(r['year']), 2), float(r['univ_male_start_k_yen']))
                            for r in rows('wage_index_univ_start.csv')])
# Bonus months per year for a typical large employer.
bonus = anchors_to_quarters([(qindex(int(r['year']), 2), float(r['months_per_year']))
                             for r in rows('bonus_months_base.csv')])
# Dividend yield (estimate) -> annual dividend per index unit.
dy = anchors_to_quarters([(qindex(int(r['quarter'][:4]), int(r['quarter'][5])), float(r['yield_pct']))
                          for r in rows('dividend_yield_estimate.csv')])
div = [round(sp[i] * dy[i] / 100, 5) for i in range(N)]

# Rental apartment: price follows the BIS residential property index,
# scaled so a small big-city apartment costs ¥30 million in 1990Q1.
K = 30_000_000 / bis[qindex(1990, 1)]
house = [round(b * K, -3) for b in bis]

DATA = {
    'y0': Y0, 'q0': 1, 'cpi': cpi, 'rent': rent, 'un': un, 'tb': dep, 'call': call,
    'sp': sp, 'div': div, 'dy': dy, 'house': house, 'mort': mort, 'gold': gold,
    'wage': wage, 'bonus': bonus, 'usd': usd, 'infl': infl,
}

# ---------- news ----------
ROMAN = {'I': 1, 'II': 2, 'III': 3, 'IV': 4}
news = {}
with open(NEWS_FILE, encoding='utf-8') as fh:
    for line in fh:
        m = re.match(r'^\| (\d{4}) (I{1,3}|IV) \| [^|]* \| (.+?) \| (.+?) \|', line)
        if m:
            news[f"{m.group(1)}Q{ROMAN[m.group(2)]}"] = {'en': m.group(3).strip(), 'ja': m.group(4).strip()}
assert len(news) == N, len(news)

# ---------- assemble ----------
src = lambda name: open(os.path.join(HERE, 'src', name), encoding='utf-8').read()
html = (src('head.html')
        + '<script>var DATA = ' + json.dumps(DATA, ensure_ascii=False, separators=(',', ':')) + ';</script>\n'
        + '<script>\n' + src('engine.js') + '</script>\n'
        + '<script>var NEWS = ' + json.dumps(news, ensure_ascii=False, indent=0) + ';</script>\n'
        + '<script>\n' + src('ui.js') + '</script>\n</body>\n</html>\n')
with open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8') as fh:
    fh.write(html)
print('index.html', len(html), 'bytes;', 'house 1980Q1', house[0], '1990Q1', house[40], '2005Q4', house[-1])
