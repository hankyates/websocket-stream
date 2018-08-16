let assert = require('assert')
let trapezoidal = arr => arr.reduce((acc, val, i) => {
  if (i === arr.length - 1) return acc
  let ay = arr[i][0]
  let ax = arr[i][1]
  let by = arr[i+1][0]
  let bx = arr[i+1][1]
  let h = bx - ax
  return acc + ((ay + by) / 2) * h
}, 0)

describe('trapezoidal', function() {
  it('', function() {
    let input = [
      [1, 0],
      [1, 1],
    ]
    let expected = 1
    assert.equal(
      trapezoidal(input),
      expected,
    )
  })
  it('', function() {
    let input = [
      [1, 0],
      [1, 1],
      [1, 2],
    ]
    let expected = 2
    assert.equal(
      trapezoidal(input),
      expected,
    )
  })
  it('', function() {
    let input = [
      [1, 0],
    ]
    let expected = 0
    assert.equal(
      trapezoidal(input),
      expected,
    )
  })
  it('', function() {
    let input = [
      [2, 0],
      [1, 1],
    ]
    let expected = 1.5
    assert.equal(
      trapezoidal(input),
      expected,
    )
  })
  it('', function() {
    let input = [
      [2, 0],
      [1, 1],
    ]
    let expected = 1.5
    assert.equal(
      trapezoidal(input),
      expected,
    )
  })
  it('', function() {
    let input = [
      [1, 0],
      [1, 1],
      [1, 1],
    ]
    let expected = 1
    assert.equal(
      trapezoidal(input),
      expected,
    )
  })
})
