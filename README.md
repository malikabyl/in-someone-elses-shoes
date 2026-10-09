# In Someone Else's Shoes

A turn-based game about getting off the treadmill, built on real US economic data from 1971–1991. You start on the first day of work in one of 10 careers and live through 15 years, one quarter at a time. Wages, prices, interest rates, stocks, houses and gold move the way they really did. The year is hidden and is revealed only at the end.

Status: playable prototype, version 1. English edition of the Russian game «Колесо».

## Play

Online: https://malikabyl.github.io/in-someone-elses-shoes/

## Running it

The whole game is one file, `index.html`, with data, engine and interface inside it. No build step and no server: open the file in a browser. Fonts load from Google Fonts; offline, the game falls back to system fonts. Your game is saved in the browser and survives a page reload.

## Rules

- **Goal.** Passive income (interest, dividends, rent net of mortgage) covers your expenses four quarters in a row.
- **Length.** 60 turns, one turn per quarter. The start is picked at random between Q2 1971 and Q1 1976, 20 options in all.
- **A turn.** You see prices and rates at the start of the quarter, buy or sell assets, then live through the quarter. The quarter's news, market moves and personal events follow.
- **The end.** The years are revealed. You see a chart of your net worth on paper and after inflation, a comparison with three simple strategies over the same years with the same luck, and a timeline of the news with dates.
- **Losing.** Credit card debt above two quarters of pay forces a sale of your assets; if there is nothing left to sell, you go bankrupt.

## Money each quarter

| Item | How it is calculated |
|---|---|
| Pay | Career starting salary × average hourly earnings index × experience growth × promotions, minus tax |
| Tax | The larger of two rates: 10% + 8.5% × log₂(annual income in 1971 dollars / $5,000), clamped to 8–38%; and min(20%, 14.5% + 6% × log₂(income / $4,200)), which covers federal income tax plus Social Security at low incomes (1971 tax tables) |
| Living expenses | A share of starting take-home pay (63–77% by career), then grow with the consumer price index. This is a deliberate simplification: in the BLS Consumer Expenditure Survey 1972–73, families with these incomes spent 83–92% of after-tax income, and with that share the game is almost never won |
| Lifestyle creep | 35% of real pay growth goes into expenses and never comes back |
| Unemployment benefit | Half of gross pay, untaxed, up to a cap of $66.51 a week (July 1972 average state maximum), indexed to wages |
| Bank account | 3-month Treasury bill rate |
| Credit card | A negative bank balance, at 18% a year (bank card rates were 16.9–18.9% in 1972–1991) |
| Student loan | 7% a year over 10 years, can be repaid early |

## Assets

| Asset | Price | Income | Costs and limits |
|---|---|---|---|
| Bank account | — | Interest at the T-bill rate | None |
| Stocks | S&P 500 index | Index dividends | Broker commission 2% when buying and again when selling until 1975 (fixed NYSE rates), 1.5% each way from 1976 |
| Gold | Price per ounce | None | 2% markup on purchase; can't be bought before 1975 |
| Rental house | Median new home price | Rent net of costs and mortgage | 25% down plus 2% closing; 6% on sale |

House details:

- **Mortgage.** 30-year fixed at the rate of the quarter you buy.
- **Bank approval.** You need a job, and total payments on all mortgages may not exceed 20% of gross pay (22% from 1985) plus 75% of rental income. The payment here is principal and interest only; with property tax and insurance this is close to the 25–28% rules of the time.
- **Rent.** 7% of the house price a year at the start of the data (Q2 1971), then grows with the rent index. The owner keeps 65% after property tax, repairs, insurance and vacancy.
- **Refinancing.** Offered when the rate has fallen at least 1 point below your loan rate; costs 2% of the balance.

## Careers

Starting pay is per year before tax, in 1971 dollars. For a later start it is scaled by the average hourly earnings index.

| Career | Starting age | Entry pay | Growth over 15 years beyond the general level | Expense share | Layoff risk | Student debt |
|---|---|---|---|---|---|---|
| Retail clerk | 18 | $4,200 | ×1.2 | 77% | ×1.0 | — |
| Auto worker | 18 | $8,800 | ×1.2 | 67% | ×2.2 | — |
| Truck driver | 21 | $8,000 | ×1.5 | 70% | ×1.3 | — |
| Nurse | 21 | $7,600 | ×1.3 | 70% | ×0.3 | — |
| Teacher | 22 | $7,060 | ×1.5 | 70% | ×0.4 | $1,500 |
| Police officer | 21 | $8,000 | ×1.4 | 69% | ×0.25 | — |
| Accountant | 22 | $10,150 | ×1.85 | 65% | ×0.5 | $1,500 |
| Engineer | 22 | $10,600 | ×1.75 | 63% | ×0.6 | $1,500 |
| Lawyer | 25 | $12,000 | ×2.7 | 65% | ×0.35 | $4,000 |
| Doctor | 26 | $9,000 | ×4.9 | 70% | ×0.1 | $6,000 |

A doctor spends the first 4 years in residency, then income jumps 3.6 times; residents are never laid off.

Student debt is the amount owed by a graduate who borrowed. In the early 1970s about a third of college graduates, half of law graduates and 65–72% of medical graduates had such loans; the game assumes you are one of them.

## Life events

Random events come from the game's seed and don't depend on the player's moves, so the comparison strategies get the same events.

| Event | Chance per quarter | Effect |
|---|---|---|
| Layoff | (unemployment − 3.5%) × 0.8, clamped to 0.4–7%, times the career's risk | 1–3 quarters on benefits |
| Unexpected expense | 7% | 25–70% of a quarter's expenses |
| Windfall (bonus, tax refund) | 3% | 20–50% of a quarter's pay |
| A baby | 2.5%, years 2–9, at most two | Expenses +25% for the first child, another +16% for the second (BLS equivalence scale, 1968) |
| Promotion | 2% | Pay +7% |

## Data

All series are quarterly: 80 points from Q2 1971 to Q1 1991. Each value is the first month of the quarter.

| Series | Source | Used for |
|---|---|---|
| S&P 500 and dividends | Robert Shiller's tables, monthly average | Stock price, dividends |
| Consumer price index CPI-U | BLS | Expenses, inflation, real net worth |
| Gold | Monthly average price, $/oz | Gold price |
| Average hourly earnings, AHETPI | BLS via FRED | Wage indexing |
| Unemployment, UNRATE | BLS via FRED | Layoff odds |
| 3-month Treasury bills, TB3MS | FRED | Bank and credit card rates |
| 30-year mortgage, MORTGAGE30US | Freddie Mac via FRED | Mortgage rate |
| Median new home price, MSPUS | Census via FRED | House price |
| Rent index, CUUR0000SEHA | BLS via FRED | Rent growth |

Accuracy notes:

- **FRED series were copied from the site's text pages**, not downloaded as files. A second, independent reading matched 80 of 80 values for AHETPI, UNRATE, TB3MS, the rent index and CPI-U. The mortgage series matched on two readings after one fix; the median house price was read only once. The S&P 500 matched an independent table in 79 of 80 quarters (the one miss was a reader error). Reloading all series from CSV is still worth doing.
- **Mortgage** is the first weekly value of the first month of the quarter. The series starts in April 1971, so the game does not cover 1970.
- **House price** is smoothed: the mean of the previous and current quarter's medians.
- **Career parameters** were checked against period sources on 2026-10-06 and adjusted: BLS National Survey of Professional, Administrative, Technical and Clerical Pay (June 1970–1973), College Placement Council starting offers (1971), NEA salary schedules for teachers (1971–72), BLS surveys of hospitals (1972) and union truck drivers (1971), the 1970 Ford–UAW wage chronology, ICMA police salaries (1973), house-staff stipend surveys, the AMA physician income series, and unemployment by occupation (1982). Accountant pay follows the starting offer to graduates ($10,152), as engineer pay does; the BLS average for all entry-level accountants was lower ($8,975). Details and links: [research/careers-check-ru.md](research/careers-check-ru.md) and [research/sources-checklist-ru.md](research/sources-checklist-ru.md) (in Russian).
- **Model rules** (tax, credit card rate, commissions, unemployment benefit, down payment, mortgage approval, rent level, cost of children) were checked in a second round on 2026-10-06 and changed to match period sources. Remaining assumptions without a direct source: the 65% of rent the owner keeps, the size of promotions and bonuses, layoff risk for police and doctors, and the share of living expenses (see the money table).

## Balance

Bot results after both rounds of checks on 2026-10-06, from `balance.js` in this folder: 20 starts × 10 seeds per career, 200 games per row. Run it with `node balance.js index.html`; it reads the engine and data straight from the game file. "Freedom" is the share of expenses covered by passive income at the end of the game.

| Career | Everything in the bank, median freedom | Sensible strategy, median freedom | Sensible strategy, win rate |
|---|---|---|---|
| Retail clerk | 24% | 29% | 0% |
| Auto worker | 36% | 46% | 1% |
| Truck driver | 45% | 56% | 7% |
| Nurse | 45% | 53% | 2% |
| Teacher | 44% | 54% | 1% |
| Police officer | 50% | 59% | 14% |
| Accountant | 60% | 73% | 20% |
| Engineer | 61% | 74% | 21% |
| Lawyer | 62% | 74% | 20% |
| Doctor | 82% | 95% | 40% |

The sensible strategy doesn't know the future: it refinances when it can, pays off the student loan first, buys houses when mortgages are below 10.5%, holds stocks when the bank rate is below 9% and sells them at 11%, and in the last two years moves into whatever pays more. A strategy that knows next quarter's prices wins 66–78% of games. "Everything in the bank" wins only as a doctor (20% of games) and rarely as an engineer (1%). About 9% of retail clerk games end in bankruptcy, 1% for auto workers and truck drivers.

The second round of checks made the game harder: median freedom for the sensible strategy fell by 7–15 points, mostly because of the lower rent (7% instead of 9%) and the stricter mortgage approval. The cost of children and the 18% credit card add to it. The first round (career pay) moved the numbers by at most 4 points.

## News

The game has 71 headlines, one for each of 71 of the 79 quarters. Other quarters show a neutral line. Headlines are written without years or names because the year is hidden.

Every headline was checked against sources: that the event happened, that it falls in its quarter, and that the numbers and claims like "first" and "record" are right. Result: 52 confirmed unchanged, 10 refined in wording, 8 corrected in substance, 1 partly confirmed. The headlines were checked in the Russian edition; this table shows the English translation of the final text.

| Quarter | Headline in the game | Check | Source |
|---|---|---|---|
| 1971 Q2 | The dollar is under pressure: West Germany lets the mark float freely, and speculators expect a devaluation. | confirmed | [link](https://history.state.gov/historicaldocuments/frus1969-76v03/d151) |
| 1971 Q3 | The President closes the "gold window": dollars can no longer be exchanged for gold. Prices and wages are frozen for 90 days. | confirmed | [link](https://www.federalreservehistory.org/essays/gold-convertibility-ends) |
| 1971 Q4 | The dollar is devalued for the first time in decades. Wage and price controls are extended. | refined | [link](https://www.federalreservehistory.org/essays/smithsonian-agreement) |
| 1972 Q1 | The President flies to Beijing. The economy is speeding up, and price controls are holding inflation down for now. | confirmed | [link](https://en.wikipedia.org/wiki/1972_visit_by_Richard_Nixon_to_China) |
| 1972 Q3 | The Soviet Union buys a quarter of the American wheat crop. Export grain prices jump 40%. | corrected | [link](https://fraser.stlouisfed.org/docs/publications/cpi/1970s/cpi_091972.pdf) |
| 1972 Q4 | The Dow Jones closes above 1,000 for the first time ever. The President is re-elected in a landslide. | confirmed | [link](https://www.spglobal.com/spdji/en/landing/investment-themes/djia-milestones) |
| 1973 Q1 | The dollar is devalued a second time, now by 10%. The major currencies are set floating. | confirmed | [link](https://www.federalreservehistory.org/essays/smithsonian-agreement) |
| 1973 Q2 | Meat prices spike and shoppers stage a boycott. The President freezes prices again, for 60 days. | confirmed | [link](https://en.wikipedia.org/wiki/1973_meat_boycott) |
| 1973 Q3 | The freeze is lifted and food posts a record monthly price jump. The Fed raises its discount rate to an all-time high. | confirmed | [link](https://fraser.stlouisfed.org/docs/publications/cpi/1970s/cpi_081973.pdf) |
| 1973 Q4 | War in the Middle East. Arab states impose an oil embargo, and OPEC is multiplying oil prices. | refined | [link](https://www.federalreservehistory.org/essays/oil-shock-of-1973-74) |
| 1974 Q1 | Lines at gas stations, gasoline sold on odd and even days. The embargo is lifted, but oil will not get cheaper again. | confirmed | [link](https://en.wikipedia.org/wiki/1973_oil_crisis) |
| 1974 Q2 | Inflation hits double digits. Banks raise rates to records, and one of the country’s largest banks is on the edge of collapse. | confirmed | [link](https://en.wikipedia.org/wiki/Franklin_National_Bank) |
| 1974 Q3 | The President resigns over a political scandal. Stocks are falling for the second year running. | confirmed | [link](https://en.wikipedia.org/wiki/1973%E2%80%931974_stock_market_crash) |
| 1974 Q4 | The new President hands out "Whip Inflation Now" buttons. Auto plants shut down their assembly lines. From December 31, citizens may own gold again, for the first time in 41 years. | confirmed | [link](https://en.wikipedia.org/wiki/Executive_Order_6102) |
| 1975 Q1 | Unemployment tops 8%, the highest since before the war. Congress approves a partial income tax rebate. | refined | [link](https://en.wikipedia.org/wiki/Tax_Reduction_Act_of_1975) |
| 1975 Q2 | Saigon has fallen and the war is over. Unemployment reaches 9%, but economists say the slump has bottomed out. | confirmed | [link](https://en.wikipedia.org/wiki/Fall_of_Saigon) |
| 1975 Q3 | New York City can’t pay its debts. The city asks Washington for help. | confirmed | [link](https://www.fordlibrarymuseum.gov/library/document/0117/75501927.pdf) |
| 1975 Q4 | The President refuses to bail out New York, then changes his mind a month later: the city gets federal loans. | confirmed | [link](https://en.wikipedia.org/wiki/Ford_to_City:_Drop_Dead) |
| 1976 Q1 | The Dow is back above 1,000. The economy is growing faster than 9% at an annual rate. | confirmed | [link](https://en.wikipedia.org/wiki/Closing_milestones_of_the_Dow_Jones_Industrial_Average) |
| 1976 Q4 | The opposition candidate wins the election on a promise of jobs. | confirmed | [link](https://en.wikipedia.org/wiki/1976_United_States_presidential_election) |
| 1977 Q1 | The harshest winter in decades. Natural gas runs short, factories and schools close, workers are sent on unpaid leave. | confirmed | [link](https://en.wikipedia.org/wiki/Cold_wave_of_January_1977) |
| 1977 Q2 | The President calls the fight against the energy crisis "the moral equivalent of war" and asks the country for thrift and sacrifice. | corrected | [link](https://millercenter.org/the-presidency/presidential-speeches/april-18-1977-address-nation-energy) |
| 1977 Q3 | "Black Monday" in Ohio: a steel mill is closing, and 5,000 people are out of work. | confirmed | [link](https://en.wikipedia.org/wiki/Youngstown_Sheet_and_Tube) |
| 1977 Q4 | The dollar falls against the mark and the yen. Coal miners begin a nationwide strike. | confirmed | [link](https://en.wikipedia.org/wiki/UMW_Bituminous_coal_strike_of_1977%E2%80%931978) |
| 1978 Q1 | The coal strike is in its fourth month. The dollar keeps weakening. | confirmed | [link](https://en.wikipedia.org/wiki/UMW_Bituminous_coal_strike_of_1977%E2%80%931978) |
| 1978 Q2 | California voters slash property taxes in a ballot measure. Banks are allowed to offer certificates of deposit at market rates. | confirmed | [link](https://en.wikipedia.org/wiki/1978_California_Proposition_13) |
| 1978 Q3 | Inflation is picking up: by September prices are rising more than 8% a year. | corrected | [link](https://www.usinflationcalculator.com/inflation/historical-inflation-rates/) |
| 1978 Q4 | An emergency rescue of the dollar: the Fed raises its rate by a full point at once. Strikes in Iran halt its oil exports. | confirmed | [link](https://fraser.stlouisfed.org/files/docs/historical/frbsf/frbsf_let/frbsf_let_19781110.pdf) |
| 1979 Q1 | Revolution in Iran, the Shah has fled. An accident at a nuclear plant in Pennsylvania. | confirmed | [link](https://en.wikipedia.org/wiki/Three_Mile_Island_accident) |
| 1979 Q2 | Gasoline is gone again: lines at the pumps, and OPEC raises prices once more. | confirmed | [link](https://en.wikipedia.org/wiki/1979_oil_crisis) |
| 1979 Q3 | The President speaks of a "crisis of confidence". The Fed gets a new chairman known as a hard-line inflation fighter. A business magazine runs the cover "The Death of Equities". | confirmed | [link](https://www.federalreservehistory.org/people/paul-a-volcker) |
| 1979 Q4 | On a Saturday night the Fed announces a new policy: rates are set loose and soar. Hostages are taken in Tehran, Soviet troops enter Afghanistan. | confirmed | [link](https://www.federalreservehistory.org/essays/anti-inflation-measures) |
| 1980 Q1 | Gold peaks at $850 an ounce. Inflation is nearly 15%. The government restricts consumer credit, and the silver market crashes in a single day. | confirmed | [link](https://en.wikipedia.org/wiki/Silver_Thursday) |
| 1980 Q2 | The economy contracts sharply as people stop borrowing. Rates fall as fast as they rose. | confirmed | [link](https://fred.stlouisfed.org/data/FEDFUNDS.txt) |
| 1980 Q3 | The recession hits bottom only six months after it began. Rates start climbing again. | corrected | [link](https://www.nber.org/research/data/us-business-cycle-expansions-and-contractions) |
| 1980 Q4 | The election goes to the candidate who promised to cut taxes. Banks raise the prime rate to 21.5%, an all-time record. | confirmed | [link](https://fedprimerate.com/wall_street_journal_prime_rate_history.htm) |
| 1981 Q1 | The hostages are freed on Inauguration Day. The new President proposes cutting taxes and spending. | confirmed | [link](https://en.wikipedia.org/wiki/Iran_hostage_crisis) |
| 1981 Q2 | The interbank lending rate shoots from 15% to 19%. Mortgages cost over 16%: few can afford a house or a car on credit. | corrected | [link](https://fred.stlouisfed.org/data/FEDFUNDS.txt) |
| 1981 Q3 | The biggest tax cut in history is signed. The President fires 11,000 striking air traffic controllers. A new recession begins. | confirmed | [link](https://en.wikipedia.org/wiki/Economic_Recovery_Tax_Act_of_1981) |
| 1981 Q4 | Mortgages cost more than 18% a year, higher than ever. New home sales are near a record low. | refined | [link](https://fred.stlouisfed.org/data/MORTGAGE30US.txt) |
| 1982 Q1 | Unemployment reaches 9%. Home builders mail lumber scraps to the Fed chairman, car dealers send keys to unsold cars. | partly confirmed | [link](https://www.federalreservehistory.org/essays/anti-inflation-measures) |
| 1982 Q2 | A major airline goes bankrupt. Businesses are failing faster than at any time since the Great Depression. | confirmed | [link](https://en.wikipedia.org/wiki/Braniff_International_Airways) |
| 1982 Q3 | Mexico announces it can’t pay its debts. The Fed cuts rates, and the stock market answers with a record one-day gain. | refined | [link](https://www.federalreservehistory.org/essays/latin-american-debt-crisis) |
| 1982 Q4 | Unemployment is 10.8%, the highest since the Great Depression. Yet the Dow sets an all-time high. | confirmed | [link](https://www.federalreservehistory.org/essays/recession-of-1981-82) |
| 1983 Q1 | Inflation drops below 4%. The economy is coming out of recession. | confirmed | [link](https://www.nber.org/news/business-cycle-dating-committee-announcement-july-8-1983) |
| 1983 Q2 | The economy grows faster than 9% at an annual rate. A boom in new stock offerings. | confirmed | [link](https://www.csmonitor.com/1983/0725/072542.html) |
| 1983 Q3 | The recovery gathers pace: factories are hiring again. | confirmed | [link](https://fred.stlouisfed.org/data/MANEMP.txt) |
| 1984 Q1 | The telephone monopoly is split into eight companies. The economy grows 8% at an annual rate. | corrected | [link](https://fred.stlouisfed.org/data/A191RL1Q225SBEA.txt) |
| 1984 Q2 | Depositors flee the country’s seventh-largest bank. The government rescues it, the largest such operation in history. | confirmed | [link](https://www.federalreservehistory.org/essays/continental-illinois) |
| 1984 Q4 | The President is re-elected, winning 49 states out of 50. | confirmed | [link](https://en.wikipedia.org/wiki/1984_United_States_presidential_election) |
| 1985 Q1 | Ohio’s governor closes about 70 savings and loans after a run by depositors. The dollar is at a record high. | confirmed | [link](https://en.wikipedia.org/wiki/Home_State_Savings_Bank) |
| 1985 Q3 | Five leading industrial nations agree, in a New York hotel, to push the dollar down. | refined | [link](https://en.wikipedia.org/wiki/Plaza_Accord) |
| 1985 Q4 | The Dow tops 1,500 for the first time. The dollar is falling fast. | confirmed | [link](https://en.wikipedia.org/wiki/Closing_milestones_of_the_Dow_Jones_Industrial_Average) |
| 1986 Q1 | Oil has crashed by half in a few months. Gasoline is getting cheaper, layoffs in Texas. | confirmed | [link](https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RWTC&f=M) |
| 1986 Q2 | Mortgages below 10% for the first time in more than seven years. Lines to refinance. | confirmed | [link](https://fred.stlouisfed.org/data/MORTGAGE30US.txt) |
| 1986 Q3 | Inflation stays below 2%, something not seen in two decades. | refined | [link](https://www.bls.gov/opub/mlr/1987/05/art1full.pdf) |
| 1986 Q4 | A tax reform is signed: the top rate is cut to 28% and breaks for real estate investors are cut back. An insider trading scandal hits Wall Street. | refined | [link](https://en.wikipedia.org/wiki/Tax_Reform_Act_of_1986) |
| 1987 Q1 | The Dow tops 2,000 for the first time. The bull market is in its fifth year. | corrected | [link](https://en.wikipedia.org/wiki/Closing_milestones_of_the_Dow_Jones_Industrial_Average) |
| 1987 Q2 | A major oil company files for bankruptcy, the largest in history. Bond yields head up. | confirmed | [link](https://www.csmonitor.com/1987/0414/achap.html) |
| 1987 Q3 | The Fed has a new chairman. The Dow is at a record, above 2,700. | confirmed | [link](https://www.federalreservehistory.org/people/alan-greenspan) |
| 1987 Q4 | "Black Monday": the Dow loses 22.6% in a single day, the worst day in the index’s history. | refined | [link](https://www.federalreservehistory.org/essays/stock-market-crash-of-1987) |
| 1988 Q1 | No recession after the crash: the economy is growing, and the Fed backed the markets with cash. | confirmed | [link](https://www.federalreservehistory.org/essays/stock-market-crash-of-1987) |
| 1988 Q3 | Drought in the Midwest, the worst in half a century. In Texas the state’s largest bank collapses. | confirmed | [link](https://en.wikipedia.org/wiki/1988%E2%80%931990_North_American_drought) |
| 1988 Q4 | The deal of the century: a tobacco and food giant goes to investors for $25 billion, almost all of it borrowed. The Vice President wins the election. | refined | [link](https://www.csmonitor.com/1988/1202/amerge.html) |
| 1989 Q1 | Hundreds of savings and loans are insolvent. The President proposes saving depositors with public money. The Fed’s rate is near 10%. | confirmed | [link](https://en.wikipedia.org/wiki/Savings_and_loan_crisis) |
| 1989 Q3 | The savings and loan bailout law is signed: the government will sell off their property, from houses and offices to land. | confirmed | [link](https://www.federalreservehistory.org/essays/savings-and-loan-crisis) |
| 1989 Q4 | On Friday the 13th the Dow drops 190 points. The Berlin Wall falls. | confirmed | [link](https://en.wikipedia.org/wiki/Friday_the_13th_mini-crash) |
| 1990 Q1 | The leading junk-bond investment bank goes bankrupt. The era of debt-financed buyouts is over. | confirmed | [link](https://en.wikipedia.org/wiki/Drexel_Burnham_Lambert) |
| 1990 Q2 | Real estate in the Northeast is getting cheaper, and banks are counting losses on developer loans. | confirmed | [link](https://www.fdic.gov/analysis/quarterly-banking-profile/qbp/archive/qbp-1990-2q.pdf) |
| 1990 Q3 | Iraq invades Kuwait. Oil nearly doubles, the economy is sliding into recession. | confirmed | [link](https://en.wikipedia.org/wiki/1990_oil_price_shock) |
| 1990 Q4 | Economists agree: a recession has begun. Layoffs, and banks tighten credit. The President breaks his promise and raises taxes. | corrected | [link](https://www.nber.org/news/business-cycle-dating-committee-announcement-april-25-1991) |

## Known weak spots

- **Houses.** Houses bought in the early years eventually turn cash-flow positive. Houses bought later run negative and pay off only through price growth, because the rent index grows more slowly than house prices.
- **Difficulty.** Winning within 15 years is realistic mostly in high-paying careers; as a retail clerk it is nearly impossible.
- **Late wins.** Even good games are usually won in year 14 or 15.
- **The Q1 1982 headline** about builders and car dealers protesting is not tied to that quarter by a source.
- **FRED data** should be reloaded from files, see "Data".

## Ideas for later

- Retune rent and house terms.
- Add a mode with the year shown, and a choice of lifestyle.
- Extend the period to 2010: the dot-com crash and the mortgage crisis.

## How the file is built

`index.html` has five parts in this order: styles, data (`DATA`), engine (`Engine`: pure functions over the game state, including the comparison bots), headlines (`NEWS`) and interface. The engine doesn't depend on the interface and runs in Node for balance runs.

## Checking the balance

```
node balance.js index.html [seeds per start]
```

The script reads the engine and data straight from `index.html` and plays 200 games per career for four strategies: everything in the bank, all spare cash in stocks, the sensible strategy and an oracle that knows next quarter's prices. Comments in the script are in Russian.

## License

Code: MIT, see [LICENSE](LICENSE). Data: US government statistics (BLS, Census, Federal Reserve, Freddie Mac via FRED) are in the public domain; stock and dividend series come from Robert Shiller's published data.

## Sharing and visit counting

At the end the game asks you to guess the start year before revealing it, then offers a **Share your result** button: the phone's share menu, or a copied text with the link.

On the public site (github.io only) the game loads [GoatCounter](https://www.goatcounter.com/), which counts visits and a few events (game started, game finished, guess, share, language) without cookies or personal data. The count goes to `malikabyl-shoes.goatcounter.com`.
