const {isObj, isArr, isDef, isUndef, isBool } = require('../../is')

const results = {
  obj: 'Object.create(null)',
  arr: 'Array(max)',
}

const accumulators = {
  obj: 'collection[keys[++i]]',
  arr: 'collection[++key]',
}

const iterator = {
  obj: '++i < max',
  arr: '++key < max',
}

const preparations = {
  obj: 'key = keys[i]',
  arr: '',
}

const declarations = {
  obj: [
    'var keys = Object.keys(collection)',
    'var max = keys.length',
    'var i = -1, key\n',
  ].join(';'),
  arr: [
    'var max = collection.length',
    'var key = -1',
  ].join(';')
}

module.exports = (type, op, opts) => {
  if (isObj(op)) {
    opts = op
    if (opts.acc) {
      op = 'accumulator'
    } else if (op.result) {
      op = 'result'
    }
  } else if (!opts) {
    opts = {}
  }

  const args = isArr(opts.args) ? opts.args : [ 'fn', 'collection' ]
  let declaration = declarations[type]
  let extraArgs = ''
  let returnValue = isDef(opts.nok) ? opts.nok : 'collection'
  let prep = preparations[type]
  let post = opts.post
  let pre = opts.pre

  switch (op) {
    case 'accumulator': {
      args.push('acc')
      extraArgs += 'acc, '
      declaration +=  `;acc || (acc = ${opts.acc || accumulators[type]})`
      isDef(pre) || (pre = 'acc = ')
      returnValue = 'acc'
      break
    }
    case 'result': {
      declaration += `;var result = ${opts.result || results[type]}`
      isDef(pre) || (pre = 'result[key] = ')
      returnValue = 'result'
      break
    }
    default: {
      const test = is.def(opts.test) ? opts.test : 'false'
      if (isUndef(pre)) {
        if (isBool(test) && !opts.strict) {
          pre = test ? 'if (!!' : 'if (!'
        } else {
          pre = 'if ('
        }
      }
      isDef(post) || (post = `=== ${test}) return ${is.def(opts.ok)
        ? opts.ok
        : returnValue}`)
      break
    }
  } 

  return Function(args, [
    `${declaration};`,
    `while (${iterator[type]}) {`,
    `  ${preparations[type]}`,
    `  ${pre}fn(${extraArgs}collection[key], key, collection)${post}`,
    `} return ${returnValue}`,
  ].join('\n'))
}