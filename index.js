let url = 'wss://ws-feed.pro.coinbase.com'
//let url = 'wss://ws.cex.io/ws/'
//let url = 'wss://ws.coinapi.io/v1/'
//let url = 'wss://echo.websocket.org'

ws$ = rxjs.webSocket.webSocket(url)
let data = {
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
}

let heartbeat$ = ws$.pipe(
  rxjs.operators.filter(v => v.type === 'heartbeat')
)

let ticker$ = ws$.pipe(
  rxjs.operators.filter(v => v.type === 'ticker')
)

ws$.next(data)

heartbeat$.subscribe(
  console.log,
  console.error,
)

ticker$.subscribe(
  console.log,
  console.error,
)
