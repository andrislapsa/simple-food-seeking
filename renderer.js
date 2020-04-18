export function render(state, output) {
  const { width, height } = state.grid
  const grid = (new Array(height).fill()).map((rowVal, y) => {
    return (new Array(width).fill()).map((columnVal, x) => {
      if (state.snake.headX === x && state.snake.headY === y) return 'x'

      if (state.food.x === x && state.food.y === y) return 'o'

      if (state.snake.body.find((bodyPiece) => bodyPiece.x === x && bodyPiece.y === y)) return 'x'

      return ' '
    })
  })

  // console.log('render', grid)

  output.innerHTML = grid.map((columns) => columns.join('')).join('\n')
  output.className = state.controls.paused ? 'paused' : ''
}
