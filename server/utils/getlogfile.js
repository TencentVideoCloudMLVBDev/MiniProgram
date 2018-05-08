const fs = require('fs')
const path = require('path')

var logRoot = path.join(__dirname, '../logs')

function loadFile (filepath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filepath, function (error, data) {
      if (!error) {
        resolve(data)
      } else {
        reject(error)
      }
    })
  })
}

module.exports = async (ctx, next) => {
  if (!ctx.request.query.file) {
    ctx.body = 'no file'
  }

  var filepath = path.join(logRoot, ctx.request.query.file)
  try {
    ctx.body = await loadFile(filepath)
  } catch (e) {
    ctx.body = e
  }
}
