/**
 * 上传文件
 * @param files     经过formidable处理过的文件
 * @param req        httpRequest对象
 * @param postData    额外提交的数据
 */
const fs = require('fs')


module.exports = function uploadFile(files, req, postData) {
  let boundaryKey = Math.random().toString(16)
  let endData = '\r\n----' + boundaryKey + '--'
  let filesLength = 0, content

  // 初始数据，把post过来的数据都携带上去
  content = (function (obj) {
    let rslt = []
    Object.keys(obj).forEach(function (key) {
      let arr = ['\r\n----' + boundaryKey + '\r\n']
      arr.push('Content-Disposition: form-data; name="' + key + '"\r\n\r\n')
      arr.push(obj[key])
      rslt.push(arr.join(''))
    })
    return rslt.join('')
  })(postData)

  // 组装数据
  Object.keys(files).forEach(function (key) {
    if (!files.hasOwnProperty(key)) {
      delete files.key
      return
    }
    content += '\r\n----' + boundaryKey + '\r\n' +
      'Content-Type: application/octet-stream\r\n' +
      'Content-Disposition: form-data; name="' + key + '"; ' +
      'filename="' + files[key].name + '"; \r\n' +
      'Content-Transfer-Encoding: binary\r\n\r\n'
    files[key].contentBinary = new Buffer(content, 'utf-8')
    filesLength += files[key].contentBinary.length + fs.statSync(files[key].path).size
  })

  req.setHeader('Content-Type', 'multipart/form-data; boundary=--' + boundaryKey)
  req.setHeader('Content-Length', filesLength + Buffer.byteLength(endData))

  // 执行上传
  let allFiles = Object.keys(files)
  let fileNum = allFiles.length
  let uploadedCount = 0
  allFiles.forEach(function (key) {
    req.write(files[key].contentBinary)
    let fileStream = fs.createReadStream(files[key].path, {bufferSize: 4 * 1024})
    fileStream.on('end', function () {
      // 上传成功一个文件之后，把临时文件删了
      // fs.unlink(files[key].path)
      uploadedCount++
      if (uploadedCount === fileNum) {
        // 如果已经是最后一个文件，那就正常结束
        req.end(endData)
      }
    })
    fileStream.pipe(req, {end: false})
  })
}
