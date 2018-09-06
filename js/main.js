const node_url = require('url')
const http = require('http')
const https = require('https')
const qs = require('querystring')
const iconv = require('iconv-lite') // 转码
const zlib = require('zlib') // 解压gzip

function domainCookies(url) {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({url}, function (res) {
      resolve(res)
    })
  })
}

exports.getCookie = async function () {
  let qq = await domainCookies('https://qq.com')
  let gameQQ = await domainCookies('https://game.qq.com')
  let all = qq.concat(gameQQ)
  let cookies = all.map(item => `${item.name}=${item.value}`)
  let o = {}
  all.forEach(item => {
    o[item.name] = item.value
  })
  return {str: cookies.join('; '), o}
}

exports.http = function (
  {
    url,
    cookie,
    method = 'get',
    data = {},
    Referer = 'http://www.qq.com/',
    Host = 'qfwd.qq.com',
    enCoding = 'utf8',
    params = {},
    noHeader = false,
    contentType = 'application/x-www-form-urlencoded; charset=UTF-8',
    Origin = 'http://www.qq.com',
    Accept = '*/*'
  }
  ) {
  url = node_url.parse(url)

  for (let i in data) {
    if (data.hasOwnProperty(i) && !data[i] && data[i] !== 0) {
      delete data[i]
    }
  }
  for (let i in params) {
    if (params.hasOwnProperty(i) && !params[i] && params[i] !== 0) {
      delete params[i]
    }
  }

  const postData = contentType === 'text/plain' ? JSON.stringify(data) : qs.stringify(data)
  const getData = decodeURIComponent(qs.stringify(params))
  const options = {
    protocol: url.protocol,
    hostname: url.host,
    port: url.protocol === 'https:' ? 443 : 80,
    path: url.path + (getData.length ? `?${getData}` : ''),
    method: method,
    headers: {
      'Accept': Accept,
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Connection': 'keep-alive',
      'Content-Type': contentType,
      'Content-Length': Buffer.byteLength(postData),
      'Referer': Referer,
      'Host': Host,
      'Cookie': cookie || '',
      'Origin': Origin,
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.26 Safari/537.36 Core/1.63.6709.400 QQBrowser/10.2.2149.400'
    }
  }
  if (noHeader) delete options.headers
  return new Promise((resolve, reject) => {
    const req = (url.protocol === 'https:' ? https : http).request(options, res => {
      let data = ''
      let converterStream = iconv.decodeStream(enCoding)
      let gunzipStream = zlib.createGunzip()
      if (res.headers['content-encoding'] === 'gzip') {
        res.pipe(gunzipStream).pipe(converterStream)
      } else {
        res.pipe(converterStream)
      }
      converterStream.on('data', chunk => {
        data += chunk
      })
      converterStream.on('end', () => {
        resolve({main: res, data})
      })
    })

    req.on('error', err => {
      reject(err)
    })

    // 写入数据到请求主体
    req.write(postData)
    req.end()
  })
}
