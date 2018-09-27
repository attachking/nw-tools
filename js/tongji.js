const utils = require('./main')
const fs = require('fs')

let data = {
  header: {
    'account_type': 1,
    'password': "86502090",
    'token': '34f9fc992f28325d08023abf51ccdee7',
    'username': 'xfxxgs'
  },
  body: {
    'siteId': '12274540',
    'method': 'source/all/a',
    'start_date': '20180801',
    'end_date': '20180809',
    'metrics': 'pv_count,visitor_count,visit_count,ip_count,new_visitor_count,new_visitor_ratio,bounce_ratio,avg_visit_time,avg_visit_pages,trans_count,trans_ratio'
    //          pv       访客数         访问数       ip数     新访客数           新访客比率         跳出率       平均访问时长（秒） 平均访问页面     转化次数    转化率
  }
}
utils.http({
  method: 'post',
  url: 'https://api.baidu.com/json/tongji/v1/ReportService/getData',
  noHeader: true,
  contentType: 'text/plain',
  data,
}).then(res => {
  fs.writeFile('C:\\Users\\Administrator\\Desktop\\lamp\\tongji.json', res.data, 'utf8', err => {
    if (err) throw err
  })
})
