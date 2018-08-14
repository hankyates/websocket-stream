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

y$ = rxjs.webSocket.webSocket(url)
y$.next({
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

let x$ = rxjs.interval().pipe(
  map(Date.now),
)
let createWindow = seconds => ([price, timestamp]) =>  (Date.now() - (seconds * 1000)) < timestamp
let selectPrice = pipe(get('price'), parseFloat)

let trapezoidal = arr => arr.reduce((acc, val, i) => {
  if (i === arr.length - 1) return acc
  let fx = arr[i][0]
  let fxNext = arr[i+1][0]
  let x = arr[i][1]
  let xNext = arr[i+1][1]
  return ((fx + fxNext) / 2) * (xNext - x)
}, 0)

let noWindow$ = y$.pipe(
  filter(v => v.type === 'ticker'),
  map(selectPrice),
  withLatestFrom(x$),
)

let createWindowStream = seconds => noWindow$.pipe(
  tap(console.log),
  scan((acc, val) => acc.pipe(filter(createWindow(seconds))), rxjs.empty()),
  tap(console.log),
  map(trapezoidal),
)

let tenSec$ = createWindowStream(10)
let halfMin$ = createWindowStream(10)
let min$ = createWindowStream(60)
let fiveMin$ = createWindowStream(60 * 5)
let tenMin$ = createWindowStream(60 * 10)

let integral$ = rxjs.zip(
  tenSec$,
  halfMin$,
  min$,
  fiveMin$,
  tenMin$,
)

integral$.subscribe(
  console.log,
  console.error,
)
