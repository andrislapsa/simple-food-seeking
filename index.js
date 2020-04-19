import {
  CREATURES,
  MUTABILITY,
  WIDTH,
  HEIGHT,
  TICKS,
  FPS,
  FRAME_LENGTH,
  FOOD_POSITION,
  DIRECTIONS,
  CREATURE_STARTING_POS,
} from './consts.js'
import { Creature } from './Creature.js'

let ANIMATE_GENERATION = true
let SHOW_FITTEST = false

const svgns = 'http://www.w3.org/2000/svg'

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

const outputEl = document.querySelector('pre.canvas')
const statsEl = document.querySelector('pre.stats')
const h1 = document.querySelector('h1')
const timeLeft = document.querySelector('h1 + span')
const svgEl = document.querySelector('svg')



let state = {
  creatures: initArray(CREATURES, () => new Creature({
    ...CREATURE_STARTING_POS,
    genetics: initArray(TICKS, getRandomGene),
  })),
  food: FOOD_POSITION,
}

function serializeGeneration(creatures, food) {
  const data = {}

  let tick = 0
  while (tick < TICKS) {
    tick++
    data[tick] = []

    state.creatures.forEach((creature) => {
      creature.move(state.food, tick)
      // if (!data[creature]) data[creature] = {}
      data[tick].push({
        obj: creature,
        x: creature.x,
        y: creature.y,
      })

      // calculate fitness on last tick
      if (tick === TICKS) creature.calculateFitness(food)
    })
  }

  return data
}

function run(state) {
  let tick = ANIMATE_GENERATION ? 0 : TICKS - 1
  const { food, creatures } = state

  const genData = serializeGeneration(creatures, food)
  const fitnesses = genData[TICKS].map(({ obj }) => obj.fitness)
  const maxFitness = Math.max(...fitnesses)
  const minFitness = Math.min(...fitnesses)
  const totalFitness = fitnesses.reduce((acc, fitness) => acc + fitness, 0)
  const averageFitness = totalFitness / fitnesses.length

  svgEl.innerHTML = ''
  const foodSvg = document.createElementNS(svgns, 'circle')
  foodSvg.setAttribute('class', 'food')
  foodSvg.setAttribute('r', .5)
  foodSvg.setAttribute('cy', food.y)
  foodSvg.setAttribute('cx', food.x)
  svgEl.appendChild(foodSvg)

  return new Promise((resolve) => {
    statsEl.innerHTML = '---'

    function loop() {
      if (tick === TICKS) {
        renderStats({
          ...state,
          minFitness,
          maxFitness,
          averageFitness,
        }, statsEl)

        resolve(state)
        return
      }

      tick++

      // do stuff
      timeLeft.innerHTML = `age (${tick}/${TICKS})`

      render({
        genData,
        tick,
        food,
        maxFitness,
      }, outputEl)

      setTimeout(() => {
        loop()
      }, FRAME_LENGTH)
    }

    loop()
  })
}

function render({ food, genData, tick, maxFitness }, output) {
  genData[tick].forEach(({ x, y, obj }) => {
    // show only the fittest half of the population
    if (SHOW_FITTEST && obj.fitness / maxFitness < .8) return false

    if (!obj.svg) {
      obj.svg = document.createElementNS(svgns, 'circle')
      obj.svg.setAttribute('r', .3)
      svgEl.appendChild(obj.svg)
    }

    obj.svg.setAttribute('cx', x)
    obj.svg.setAttribute('cy', y)
  })

  const grid = initArray(HEIGHT, (rowVal, y) => {
    return initArray(WIDTH, (columnVal, x) => {
      if (genData[tick].find((creature) => {
        // show only the fittest half of the population
        if (creature.fitness / maxFitness < .8) return false

        return creature.x === x && creature.y === y
      })) return 'x'
      
      if (food.x === x && food.y === y) return 'o'

      return ' '
    })
  })

  output.innerHTML = grid.map((columns) => columns.join('')).join('\n')
}

function renderStats(state, output) {
  let minAgeWithFood = 100
  state.creatures.forEach((creature, key) => {
    if (creature.ateFood && creature.tick < minAgeWithFood) minAgeWithFood = creature.tick
  })

  output.innerHTML =
`Min age with food = ${minAgeWithFood}
Max fitness = ${state.maxFitness}
Min fitness = ${state.minFitness}
Average fitness = ${state.averageFitness}
`
}

let gen = 0;
let running = false

document.querySelector('input[name=animateGeneration]').addEventListener('change', (e) => {
  ANIMATE_GENERATION = e.target.checked
})

document.querySelector('input[name=showFittest]').addEventListener('change', (e) => {
  SHOW_FITTEST = e.target.checked
})

document.querySelector('#newGeneration').addEventListener('click', () => {
  if (running) return false

  gen++
  h1.innerHTML = `Generation ${gen}`

  running = true

  run(state)
    .then((newState) => {
      const matingPool = []
      newState.creatures.forEach((creature, key) => {
        creature.calculateFitness(newState.food)

        const partnersInMatingPool = initArray(Math.round(creature.fitness), () => creature)

        matingPool.push(...partnersInMatingPool)
      })

      console.log('creatures end state', newState.creatures)

      state.creatures = initArray(CREATURES, () => {
        const firstPartner = randomItem(matingPool).genetics
        const secondPartner = randomItem(matingPool).genetics

        return new Creature({
          ...CREATURE_STARTING_POS,
          genetics: mutate(crossover(firstPartner, secondPartner)),
        })
      })

      running = false
    })
})

