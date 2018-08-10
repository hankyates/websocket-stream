let {
  get,
  pipe,
} = _

let {
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

let xAxis = rxjs.interval()
let selectPrice = pipe(get('price'), parseFloat)

// buffer: number => number
let trapezoidal = arr => arr.reduce((acc, val, i) => {
  if (i === arr.length - 1) return acc
  let fx = arr[i][0]
  let fxNext = arr[i+1][0]
  let x = arr[i][1]
  let xNext = arr[i+1][1]
  return ((fx + fxNext) / 2) * (xNext - x)
}, 0)

let ticker$ = ws$.pipe(
  filter(v => v.type === 'ticker'),
  map(selectPrice),
  withLatestFrom(xAxis),
  scan((acc, val) => [...acc.slice(Math.max(0, acc.length - BUFFER_SIZE + 1), acc.length), val], []),
  map(trapezoidal)
)

ticker$.subscribe(
  console.log,
  console.error,
)
