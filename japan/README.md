# In Someone Else's Shoes: Japan (他人の靴をはいて ― 日本編)

The Japanese edition of In Someone Else's Shoes. You start your first job in Japan in a random quarter between 1980 and 1990 and live 15 years, one quarter at a time, on real Japanese data from 1980 to 2005: the run-up to the bubble, its peak in 1989–91, the collapse, the bank failures of 1997–98 and zero interest rates. The year is hidden until the end.

The game is in English and Japanese, with a switch on every screen. The language follows the browser at first and is remembered after you choose.

Play online: https://malikabyl.github.io/in-someone-elses-shoes/japan/

Status: playable prototype, version 1. The Japanese texts have not yet been read by a native speaker.

## Running it

`index.html` is the whole game: open it in a browser. It is generated: edit `src/` or `data/` and run

```
python3 japan/build.py
```

from the repository root. The build reads the CSV files in `data/` and the quarterly headlines from [research/news-1980-2005-ru.md](research/news-1980-2005-ru.md).

## The goal is different from the US version

In the US version you win when passive income covers your living costs. In Japan that turned out to be impossible for everyone, even for a player who knows next quarter's prices: postal savings paid 6–7% in the early 1980s, about 3% in 1995 and 0.06% by 2003, dividends were around 1% or less, and rental flats bought with a loan lost money in almost every year.

So the Japan edition asks a question closer to how Japanese households think about money (貯蓄が生活費の何年分か): **can your net worth cover 10 years of living costs?** Hold that for four quarters in a row and you win. Net worth counts savings, stocks, gold and flats minus loans.

## Rules

- **Length.** 60 turns, one per quarter. The start is random between 1980Q1 and 1990Q4, 44 options.
- **Pay.** Monthly pay grows with seniority and with the general wage level (graduate starting pay). Bonuses are paid in summer (Q2) and winter (Q4): about 4.9 months a year in the 1980s, 5.45 in 1991–92, 4.4 by 2003 for a typical large employer, times a factor by career.
- **Tax and social insurance.** Income tax plus resident tax by law period (before 1987Q4, 1987Q4–1998, from 1999), as an effective rate on annual pay. Pension, health and employment insurance by date: about 10% of regular pay in 1980, 13.6% by 2002; bonuses mostly exempt until 2003, when the base became total pay.
- **Living costs.** A share of average take-home pay at the start, 68–82% by career (household survey: 67–85% by income in 2000), then grow with CPI. 35% of real pay growth goes into lifestyle.
- **Job loss.** Odds follow the real unemployment rate and the career. Bank employees face an extra risk in 1997Q4–1999Q1. Unemployment benefit is 60–80% of regular pay (50–80% from 2003), untaxed, with a daily cap; a new employer pays 10% less.
- **Losing.** Consumer debt above two quarters of take-home pay forces sales of gold, stocks and flats; if nothing is left, personal bankruptcy.

## Money

| Asset | Price | Income | Costs |
|---|---|---|---|
| Postal savings (定額貯金) | — | Rate of 定額貯金 "3 years and more", interpolated between year ends | Interest tax-free until 1988Q1 (マル優), 20% after |
| Stocks | OECD share price index for Japan | Dividend yield (estimate) after 20% tax | About 1.2% each way until 1999Q3, 0.5% after (estimate) |
| Gold | Tokuriki Honten retail price per gram (includes consumption tax from April 1989) | None | Dealer buys back about 3% below its selling price (estimate) |
| Flat to rent out | BIS residential property price index, scaled to ¥30 million in 1990Q1 | Rent from 5.5% of the 1980 price, growing with CPI rent; the owner keeps 65% | 20% down, 6% taxes and fees, 25-year bank loan at the city-bank housing loan rate, 3.5% on sale |

A flat ages: its value falls 1.8% a year relative to a new one (about half by 26–30 years, as in REINS transaction data) and its rent 1% a year.

## Careers

Monthly pay before tax in 1980 yen; for a later start it is scaled by the wage level.

| Career | Start age | Monthly pay | Bonus factor | Growth over 15 years | Living costs | Job-loss risk |
|---|---|---|---|---|---|---|
| Big-company salaryman (大企業の会社員) | 22 | ¥118,500 | ×1.10 | ×1.9 | 68% | ×0.30 |
| Bank employee (銀行員) | 22 | ¥124,000 | ×1.25 | ×2.0 | 68% | ×0.20, plus bank failures 1997–99 |
| City hall clerk (市役所職員) | 22 | ¥101,600 | ×1.00 | ×1.7 | 70% | ×0.03 |
| Elementary school teacher (小学校教員) | 22 | ¥116,100 | ×1.00 | ×1.75 | 70% | ×0.03 |
| Nurse (看護師) | 21 | ¥110,000 | ×0.85 | ×1.35 | 72% | ×0.10 |
| Auto plant worker (自動車工場の工員) | 18 | ¥100,000 | ×1.00 | ×1.4 | 74% | ×0.60 |
| Construction worker (建設作業員) | 18 | ¥120,000 | ×0.25 | ×1.3 | 78% | ×1.80 |
| Shop clerk on contract (販売員・契約社員) | 18 | ¥85,000 | ×0.20 | ×1.16 | 82% | ×1.50 |
| Programmer (プログラマー) | 22 | ¥118,500 | ×0.90 | ×1.9 | 70% | ×0.60 |
| Doctor (医師) | 24 | ¥130,000 in residency | ×0.60 after residency | ×2.3 jump after 2 years, then +3% a year | 72% | ×0.03 |

Where these come from: university graduate starting pay (1983 and 1985 secondary sources, 1989–2005 MHLW); national civil servant starting pay (人事院) for the city hall clerk; the teacher premium of 15.1% plus 4% (教職調整額) set by law; high-school starting pay for the auto worker. The pay of nurses, construction workers, shop clerks and doctors, all growth curves, bonus factors and job-loss multipliers are estimates; growth curves follow the age–wage profile in the MHLW wage structure survey (university graduates aged 35–39 earn about 1.9 times those aged 20–24, high-school graduates aged 30–34 about 1.4 times).

## Balance

From `balance.js` (the US script with the career id as name): 44 starts × 10 seeds per career. Years covered at the end are shown as a share of the 10-year goal.

| Career | Everything in postal savings | All spare cash in stocks | Sensible strategy | Sensible, win rate | Oracle, win rate |
|---|---|---|---|---|---|
| Big-company salaryman | 74% | 64% | 67% | 4% | 80% |
| Bank employee | 75% | 65% | 68% | 4% | 82% |
| City hall clerk | 69% | 60% | 62% | 0% | 84% |
| Teacher | 69% | 60% | 63% | 1% | 78% |
| Nurse | 60% | 51% | 53% | 0% | 79% |
| Auto plant worker | 55% | 47% | 48% | 0% | 74% |
| Construction worker | 44% | 36% | 38% | 0% | 58% |
| Shop clerk | 28% | 23% | 24% | 0% | 46% |
| Programmer | 70% | 60% | 62% | 1% | 78% |
| Doctor | 115% | 99% | 102% | 51% | 94% |

The "sensible strategy" is the one from the US version (buys flats when loans are below 10.5%, holds stocks while the bank rate is below 9%), which in Japan means it always buys both. It does worse than leaving everything in postal savings, and the bot that buys a flat as soon as the bank allows does worst of all. That is the point of the Japanese edition.

## Data

All quarterly values are the first month of the quarter, 1980Q1–2005Q4. See `data/README.md` for every file and how it was checked, and [research/sources-checklist-ru.md](research/sources-checklist-ru.md) (Russian) for the source check.

| Series | Source |
|---|---|
| CPI and CPI rent | FRED JPNCPIALLMINMEI, JPNCP040100IXOBM (OECD) |
| Unemployment | FRED LRUNTTTTJPM156S |
| Stocks | FRED SPASTT01JPM661N (OECD share price index); monthly Nikkei 225 could not be read |
| Flats | FRED QJPN628BIS (BIS residential property prices) |
| Gold | Tokuriki Honten, first business day of each quarter |
| Postal savings and bank housing loan rates | 日本の長期統計系列, table 14-1 (year ends) |
| Wage level | University graduate starting pay: MHLW 1989–2005; 1983 and 1985 secondary; other 1980–88 years estimated (`data/wage_index_univ_start.csv`) |
| Bonus months | 人事院 (civil servants, who are paid in line with large private firms); 1989–90 and 1993–2002 interpolated (`data/bonus_months_base.csv`) |
| Dividend yields | Estimate (`data/dividend_yield_estimate.csv`); a long official series was not found |
| Taxes, social insurance, unemployment benefit | MOF, MHLW (see the checklist, items 3.1–3.3) |

## Known weak spots

- Dividend yields, the rent level, owner's costs and transaction costs are estimates.
- The flat follows the national BIS index, so the bubble and crash are milder than in central Tokyo, where condo prices roughly halved.
- Wage level for 1980–88 is partly estimated; pay by occupation could not be read (Excel files only).
- The Japanese texts need a native speaker's review.
- The game has not been balanced beyond choosing the 10-year goal.

## News

One headline for each of the 104 quarters, in English and Japanese, without years or names. Sources and checks are in [research/news-1980-2005-ru.md](research/news-1980-2005-ru.md) (Russian). Ten headlines are not about the economy (elections, disasters, a game console) and could be replaced.

## Sharing and visit counting

At the end the game asks you to guess the start year before revealing it, then offers a **Share your result** button: the phone's share menu, or a copied text with the link.

On the public site (github.io only) the game loads [GoatCounter](https://www.goatcounter.com/), which counts visits and a few events (game started, game finished, guess, share, language) without cookies or personal data. The count goes to `malikabyl-shoes.goatcounter.com`.
