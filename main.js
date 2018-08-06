const axios = require('axios')
const request = require('request')

exports.getCookie = function() {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({
      url: 'https://qq.com'
    }, function(res) {
      let cookies = res.map(item => `${item.name}=${item.value}`)
      let o = {}
      res.forEach(item => {
        o[item.name] = item.value
      })
      resolve({
        str: cookies.join('; '),
        o
      })
    })
  })
}

exports.http = function({url, cookie, method = 'get', data, Referer = 'http://www.qq.com/', Host = 'qfwd.qq.com'}) {
  return axios({
    method: method,
    url: url,
    data: data,
    params: data,
    headers: {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Connection': 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': Referer,
      'Host': Host,
      'Cookie': cookie || '',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36'
    }
  })
}

exports.request = function({url}) {
  return request(url)
}
