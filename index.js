let {
  get,
  pipe,
} = _

let {
  concatMap,
  throttleTime,
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

//integral$.subscribe(
  //console.log,
  //console.error,
//)



halfMin$
//rxjs.of([[100, 0], [100, 1], [101, 2]])
.pipe(
  throttleTime(1000),
  map((v) => v
    .map(
      ([y, x]) => [y, x - v[0][1]],
    )
  ),
)
.subscribe((v) => {
  console.group()
  let m = tf.variable(tf.scalar(Math.random()))
  let b = tf.variable(tf.scalar(Math.random()))

  let optimizer = tf.train.adam(100, 0.9, 0.99)
  let predict = x => tf.tidy(() => m.mul(x).add(b))
  let loss = (predictions, labels) => predictions.sub(labels).square().mean()

  let time = window.performance.now()
  let iterations = Math.ceil(Math.log(v.length ** 500))
  for (var i = 0; i < iterations; i++) {
    var w = optimizer.minimize(() => {
      let predY = predict(tf.tensor1d(v.map(([y, x]) => x)))
      let error = loss(
        predY,
        tf.tensor1d(v.map(([y, x]) => y))
      )
      console.log(
        'optimize',
        //m.dataSync()[0],
        //b.dataSync()[0],
        error.dataSync()[0],
        //predY.dataSync(),
        //v,
      )
      return error
    })
  }
  let modelM = m.dataSync()[0]
  let modelB = b.dataSync()[0]
  console.log('time', window.performance.now() - time)
  let predY = (modelM * v[v.length-1][1] + modelB)
  let actualY = v[v.length-1][0]
  console.log('pred', predY)
  console.log('actual', actualY)
  console.log('length', v.length)
  console.log('iterations', iterations)
  console.log('error', predY - actualY)
  new Chartist.Line('.regressions', {
    series: [
      [
        modelM * v[0][1] + modelB,
        modelM * v[v.length-1][1] + modelB,
      ]
    ]
  }, {fullWidth: true})
  new Chartist.Line('.price', {
    series: [
      v.map(([price]) => price)
    ]
  }, {fullWidth: true})
  console.groupEnd()
})
