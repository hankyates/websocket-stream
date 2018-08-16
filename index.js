let {
  get,
  pipe,
} = _

let {
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
let filterByTenSeconds = _.filter(createWindow(10))
let filterByHalfMinute = _.filter(createWindow(30))
let filterByMinute = _.filter(createWindow(60))
let filterByFiveMinutes = _.filter(createWindow(60 * 5))
let filterByTenMinutes = _.filter(createWindow(60 * 10))
let selectPrice = pipe(get('price'), parseFloat)
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
  map(selectPrice),
  withLatestFrom(x$),
  scan((acc, val) => [
    ...windowFilter(acc),
    val
  ], []),
)

let tenSec$ = createStreamWindow(filterByTenSeconds)
let halfMin$ = createStreamWindow(filterByHalfMinute)
let min$ = createStreamWindow(filterByMinute)
let fiveMin$ = createStreamWindow(filterByFiveMinutes)
let tenMin$ = createStreamWindow(filterByTenMinutes)

let integral$ = rxjs.zip(
  tenSec$,
  halfMin$,
  min$,
  fiveMin$,
  tenMin$,
).pipe(
  map(
    arr => [arr.map(a => a[0][0]), arr.map(trapezoidal)]
  )
)

integral$.subscribe(
  console.log,
  console.error,
)
