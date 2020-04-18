const CREATURES = 30
const MUTABILITY = 0.01
const WIDTH = 20
const HEIGHT = 20
const TICKS = 100
const FPS = 60
const FRAME_LENGTH = 1000 / FPS
const FOOD_POSITION = { x: 1, y: 1 }
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

const randomItem = array =>
  array[Math.floor(array.length * Math.random())]

const initArray = (length, mapCallback) =>
  new Array(length).fill().map(mapCallback)

const getRandomGene = () => ({
  direction: randomItem(Object.values(DIRECTIONS)),
})

// combine genetics from two creatures
function crossover(genetics, partnerGenetics) {
  const midpoint = Math.floor(genetics.length * Math.random())

  const firstHalf = [...genetics].slice(0, midpoint)
  const secondHalf = [...partnerGenetics].slice(midpoint)

  return firstHalf.concat(secondHalf)
}

// replace some genes depending on MUTABILITY probability
function mutate(genetics) {
  return genetics.map((gene) => {
    if (Math.random() < MUTABILITY) return getRandomGene()

    return gene
  })
}

const pre = document.querySelector('pre')
const h1 = document.querySelector('h1')
const timeLeft = document.querySelector('h1 + span')

class Creature {
  x = 0
  y = 0
  genetics = []
  tick = 0
  fitness = 0
  ateFood = false

  constructor({ x, y, genetics }) {
    this.x = x
    this.y = y
    this.genetics = genetics
  }

  move(food, tick) {
    if (this.ateFood) return

    const currentDirection = this.genetics[tick - 1].direction
    this.x += currentDirection.x
    this.y += currentDirection.y
    this.tick = tick

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
  }
}

let state = {
  creatures: initArray(CREATURES, () => new Creature({
    x: WIDTH / 2,
    y: HEIGHT / 2,
    genetics: initArray(TICKS, getRandomGene),
  })),
  food: FOOD_POSITION,
}

function run(state) {
  let tick = 0

  return new Promise((resolve) => {
    function loop() {
      const allDone = state.creatures.reduce((everyoneAte, creature) => {
        if (creature.ateFood && everyoneAte) return true

        return false
      }, true)

      if (tick === TICKS || allDone) {
        resolve(state)
        return
      }

      tick++

      // do stuff
      state.creatures.forEach((creature) => {
        creature.move(state.food, tick)  
      })
      timeLeft.innerHTML = `age (${tick}/${TICKS})`

      render(state, pre)

      setTimeout(() => {
        loop()
      }, FRAME_LENGTH)
    }

    loop()
  })
}

export function render(state, output) {
  const grid = initArray(HEIGHT, (rowVal, y) => {
    return initArray(WIDTH, (columnVal, x) => {
      if (state.creatures.find((creature) => {
        return creature.x === x && creature.y === y
      })) return 'x'
      
      if (state.food.x === x && state.food.y === y) return 'o'

      return ' '
    })
  })

  output.innerHTML = grid.map((columns) => columns.join('')).join('\n')
}

let gen = 0;
let running = false

document.addEventListener('click', () => {
  if (running) return false

  gen++
  console.log('generation', gen)
  h1.innerHTML = `Generation ${gen}`

  running = true

  run(state)
    .then((newState) => {
      console.log('creatures end state', newState.creatures)

      const matingPool = []
      newState.creatures.forEach((creature, key) => {
        creature.calculateFitness(newState.food)

        const partnersInMatingPool = initArray(Math.round(creature.fitness), () => creature)
        matingPool.push(...partnersInMatingPool)
      })

      state.creatures = initArray(CREATURES, () => {
        const firstPartner = randomItem(matingPool).genetics
        const secondPartner = randomItem(matingPool).genetics

        return new Creature({
          x: WIDTH / 2,
          y: HEIGHT / 2,
          genetics: mutate(crossover(firstPartner, secondPartner)),
        })
      })

      running = false
    })
})

