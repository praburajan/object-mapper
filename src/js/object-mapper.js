import { curry, compose, path, split, map, is, call, tap } from 'ramda'

const pickPath = curry((_path, obj) => {
    const pick = compose(path, split('.'))
    return pick(_path)(obj)
})

const pickPaths = curry((paths, obj) => {
    return map((_path) => {
        return pickPath(_path)(obj)
    }, paths)
})

const strPicker = (_path) => {
    if (is(String, _path)) {
        return pickPath(_path)
    }
}

const arrPicker = (_paths) => {
    if (is(Array, _paths)) {
        return pickPaths(_paths)
    }
}

const objPicker = (config) => {
    if (is(Object, config) && config.pick) {
        return strPicker(config.pick) || arrPicker(config.pick)
    }
}

const pick = (config) => {
    return strPicker(config) || arrPicker(config) || objPicker(config)
}

const compute = curry((config, value) => {
    if (config.compute) {
        return call(config.compute, value)
    }
    return value
})

const pickAndCompute = (config) => {
    return compose(compute(config), pick(config))
}

export const mapObject = curry((config, obj) => {
    return map((propConfig) => {
        const mapper = pickAndCompute(propConfig)
        return mapper(obj)
    }, config)
})