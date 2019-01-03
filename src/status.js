let exitingGracefully = false

exports.get = () => exitingGracefully
exports.set = bool => { exitingGracefully = bool }
