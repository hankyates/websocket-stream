let {
  range,
  get,
  pipe,
  fromPairs
} = _
let {
  distinctUntilChanged,
  withLatestFrom,
  scan,
  skip,
  bufferCount,
  first,
  concatMap,
  tap,
  mergeMap,
  map,
  filter,
  take
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

let createStream = (field) => ws$.pipe(
  rxjs.operators.filter(v => v.type === field),
)

let selectPrice = pipe(get('price'), parseFloat)
let selectSequence = get('sequence')

let ticker$ = createStream('ticker').pipe(map(selectPrice))
let heartbeat$ = createStream('heartbeat').pipe(map(selectSequence))
let xAxis = rxjs.interval()
const BUFFER_SIZE = 10
let last = n => a => a.slice(Math.max(0, a.length - n - 1), a.length)
let latestBuffer = last(BUFFER_SIZE)
let createFx = map => x => map[x]
let createTrapezoidal = n => f => f.reduce((acc, val, i, f) => {
  if (i === f.length - 1) return acc
  let fx = val[1]
  let fxOne = f[i + 1][1]
  let xk = val[0]
  let xkOne = f[i + 1][0]
  return acc + (
      (fx + fxOne / 2
    ) * (
      xkOne - xk
    )
  )
}, 0)
let trapezoidal = createTrapezoidal(BUFFER_SIZE)

let fOfX$ = ticker$.pipe(
  withLatestFrom(xAxis),
  scan((a, v) => [...latestBuffer(a), v.reverse()], []),
  map(trapezoidal)
)

var ctx = document.getElementById('myChart')
var data = []
var labels = []
fOfX$.subscribe(
  v => {
    console.log(v)
    data = _.concat(data, v)
    labels = _.concat(labels, moment().format('llll'))
    new Chartist.Line(ctx, {
      labels: [labels],
      series: [data]
    }, {
      low: 0,
      showArea: true
    })
  },
  console.error,
)


// https://www.geeksforgeeks.org/trapezoidal-rule-for-approximate-value-of-definite-integral/
//def trapezoidal (a, b, n):
  //h = (b - a) / n
  //s = (y(a) + y(b))
  //i = 1
  //while i < n:
    //s += 2 * y(a + i * h)
    //i += 1
  //return ((h / 2) * s)
