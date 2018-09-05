let {
  get,
  pipe,
  zip,
} = _

let {
  throttleTime,
  concatMap,
  filter,
  map,
  scan,
  tap,
  withLatestFrom,
} = rxjs.operators

let url = 'wss://ws-feed.pro.coinbase.com'

ws$ = rxjs.webSocket.webSocket(url)
ws$.next({
  "type": "subscribe",
  "product_ids": [
    "ETH-USD",
  ],
  "channels": [
    "heartbeat",
    {
      "name": "ticker",
      "product_ids": [
        "ETH-USD",
      ]
    }
  ]
})

const BUFFER_SIZE = 10
let x$ = rxjs.interval().pipe(
  map(Date.now),
)
let createWindow = seconds => ([price, timestamp]) =>  (Date.now() - (seconds * 1000)) < timestamp
let selectPriceFromStream = pipe(get('price'), parseFloat)
let filterBy = seconds => ([price, timestamp]) => (Date.now() - (seconds * 1000)) < timestamp
let filterByTen = _.filter(filterBy(10))
let filterByThirty = _.filter(filterBy(30))
let filterBySixty = _.filter(filterBy(60))
let filterByOneTwenty = _.filter(filterBy(120))

let trapezoidal = arr => arr.reduce((acc, val, i) => {
  if (i === arr.length - 1) return acc
  let ay = arr[i][0]
  let ax = arr[i][1]
  let by = arr[i+1][0]
  let bx = arr[i+1][1]
  let h = bx - ax
  return acc + ((ay + by) / 2) * h
}, 0)

let createStreamWindow = windowFilter => ws$.pipe(
  filter(v => v.type === 'ticker'),
  map(selectPriceFromStream),
  withLatestFrom(x$),
  scan((acc, val) => [
    ...windowFilter(acc),
    val
  ], []),
)

let tenSec$ = createStreamWindow(filterByTen)
let thirtySec$ = createStreamWindow(filterByThirty)

let app$ = rxjs.zip(
  tenSec$,
  thirtySec$,
)

let mapPrice = _.map(([price, timestamp]) => price)
let mapTimestamp = _.map(([price, timestamp]) => (Date.now() - timestamp) * 1000)

let createChartData = (labels, series) => ({labels, series: [series]})

let analyticsData = createChartData([], [])
let pricesData = createChartData([], [])
let anayliticsChart = new Chartist.Line('.analytics', analyticsData)
let pricesChart = new Chartist.Line('.prices', pricesData)

let trapezoidalValues = []
app$
.subscribe(
  ([ten, thirty]) => {
    pricesChart.update(
      createChartData(
        mapTimestamp(ten),
        mapPrice(ten),
      )
    )
    trapezoidalValues = [...trapezoidalValues, trapezoidal(ten)]
    anayliticsChart.update(
      createChartData(
        mapTimestamp(ten),
        trapezoidalValues.slice(
          trapezoidalValues.length - ten.length,
          trapezoidalValues.length
        ),
      )
    )
  },
  e => {
    console.error()
    debugger
  }
)
