let {
  get,
  pipe,
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

let tenSec$ = createStreamWindow(filterByTen)
let thirtySec$ = createStreamWindow(filterByThirty)

let integral$ = rxjs.zip(
  tenSec$,
  thirtySec$,
).pipe(
  tap(console.log)
)

//integral$.subscribe(
  //console.log,
  //console.error,
//)



//rxjs.of([[100, 0], [100, 1], [101, 2]])
//tenSec$
thirtySec$
.pipe(
  throttleTime(1000),
  map(v => v.map(
    ([y, x]) => [y, x - v[0][1]]
  ))
)
.subscribe((v) => {
  console.group()
  const m = tf.variable(tf.scalar(0))
  const b = tf.variable(tf.scalar(0))

  // y = mx + b
  const predict = x => tf.tidy(() => m.mul(x).add(b))
  const loss = (predictions, labels) => predictions.sub(labels).square().mean()

  const optimizer = tf.train.adam(100, 0.9, 0.99)

  let time = window.performance.now()
  console.log('before', m.dataSync()[0], b.dataSync()[0])
  for (var i = 0; i < v.length * 100; i++) {
    optimizer.minimize(() => {
      const error = loss(
        predict(tf.tensor1d(v.map(([y, x]) => x))),
        tf.tensor1d(v.map(([y, x]) => y))
      )
      console.log('error', error.dataSync()[0])
      return error
    })
  }
  console.log('value', v)
  console.log('time', window.performance.now() - time)
  console.log('after', m.dataSync()[0], b.dataSync()[0])
  console.groupEnd()
})

