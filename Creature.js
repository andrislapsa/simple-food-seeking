import {
  WIDTH,
  HEIGHT,
  TICKS,
} from './consts.js'


export class Creature {
  x = 0
  y = 0
  genetics = []
  tick = 0
  fitness = 0
  ateFood = false
  gotLost = false

  constructor({ x, y, genetics }) {
    this.x = x
    this.y = y
    this.genetics = genetics
  }

  move(food, tick) {
    if (this.ateFood || this.gotLost) return

    const currentDirection = this.genetics[tick - 1].direction
    this.x += currentDirection.x
    this.y += currentDirection.y
    this.tick = tick

    if (this.x > WIDTH || this.x < 0 || this.y > HEIGHT || this.y < 0) {
      this.gotLost = true
    }

    if (this.x === food.x && this.y === food.y) {
      this.ateFood = true
    }
  }

  calculateFitness(food) {
    const distanceToFood = Math.abs(food.x - this.x) + Math.abs(food.y - this.y)

    if (this.ateFood) {
      this.fitness = 5 + (TICKS - this.tick)
    } else {
      this.fitness = 1 / distanceToFood * 10
    }

    // reduce fitness for leaving the world
    if (this.gotLost) this.fitness *= .5
  }
}
