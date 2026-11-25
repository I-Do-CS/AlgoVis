import type { Operation } from '../sorting/types.ts'

function validate(input: readonly number[], target: number): void {
  if (!Number.isFinite(target) || input.some((value) => !Number.isFinite(value))) {
    throw new Error('Search values and target must be finite numbers.')
  }
}

export function linearTrace(input: readonly number[], target = 50): Operation[] {
  validate(input, target)
  const operations: Operation[] = []
  for (let index = 0; index < input.length; index++) {
    operations.push({ type: 'probe', index, target, range: [index, input.length - 1], lines: [0, 1], message: { key: 'opProbe', values: { position: index + 1, value: input[index], target } } })
    if (input[index] === target) {
      operations.push({ type: 'found', index, target, range: [index, index], lines: [2], message: { key: 'opFound', values: { target, position: index + 1 } } })
      return operations
    }
  }
  operations.push({ type: 'miss', target, range: [0, -1], lines: [3], message: { key: 'opMiss', values: { target } } })
  return operations
}

export function binaryTrace(input: readonly number[], target = 50): Operation[] {
  validate(input, target)
  if (input.some((value, index) => index > 0 && value < input[index - 1])) {
    throw new Error('Binary search requires an ascending array.')
  }
  const operations: Operation[] = []
  let low = 0
  let high = input.length - 1
  if (input.length) operations.push({ type: 'range', range: [low, high], lines: [0], message: { key: 'opSearchRange', values: { a: low + 1, b: high + 1 } } })
  while (low <= high) {
    const index = low + Math.floor((high - low) / 2)
    const value = input[index]
    operations.push({ type: 'probe', index, target, range: [low, high], lines: [1, 2, 3], message: { key: 'opProbe', values: { position: index + 1, value, target } } })
    if (value === target) {
      operations.push({ type: 'found', index, target, range: [index, index], lines: [4], message: { key: 'opFound', values: { target, position: index + 1 } } })
      return operations
    }
    if (value < target) {
      low = index + 1
      operations.push({ type: 'range', range: [low, high], lines: [5], message: { key: 'opDiscardLeft', values: { value, target } } })
    } else {
      high = index - 1
      operations.push({ type: 'range', range: [low, high], lines: [6], message: { key: 'opDiscardRight', values: { value, target } } })
    }
  }
  operations.push({ type: 'miss', target, range: [0, -1], lines: [7], message: { key: 'opMiss', values: { target } } })
  return operations
}
