const iconv = require('iconv-lite')
const fs = require('fs')
const loginUrl = 'https://xui.ptlogin2.qq.com/cgi-bin/xlogin?style=21&appid=21000109&f_url=loginerroralert&target=self&qtarget=self&s_url=http%3A//speed.qq.com/comm-htdocs/login/logincallback.htm&no_verifyimg=1&daid=45&qlogin_jumpname=jump&qlogin_param=u1%3Dhttp%3A//speed.qq.com/comm-htdocs/login/logincallback.htm'
const utils = process.mainModule.exports

let app = new Vue({
  el: '#app',
  data: {
    userInfo: {},
    servers: [],
    servers2: [],
    server1: '',
    server2: '',
    server3: '',
  },
  methods: {
    login() {
      nw.Window.open(loginUrl, {
        'title': '快捷登录',
        'frame': true
      }, function(new_win) {
        new_win.on('new-win-policy', function(frame, url, policy) {
          policy.ignore()
        })
        new_win.window.onunload = function() {
          new_win.close()
          getUserInfo()
        }
      })
    },
    stop() {
    },
    handleServer1(val) {
      if (val) {
        this.servers.forEach(item => {
          if (item.v === val) {
            this.servers2 = item.opt_data_array
          }
        })
      }
    },
    handleServer2(val) {
      if (val) {
        getServerRoles(val)
      }
    },
    handleServer3(val) {}
  },
  created() {
    getServer()
    this.$watch('server1', this.handleServer1)
    this.$watch('server2', this.handleServer2)
    this.$watch('server3', this.handleServer3)
  }
})

function getUserInfo() {
  utils.getCookie().then(res => {
    return utils.http({
      url: 'http://qfwd.qq.com/',
      cookie: res.str,
      Referer: 'http://www.qq.com/',
      Host: 'qfwd.qq.com',
      data: {
        uin: res.o.uin && res.o.uin.substr(2),
        skey: res.o.skey,
        refresh: 0,
        func: 'loginAll',
        ran: Math.random()
      }
    })
  }).then(res => {
    res = JSON.parse(res.data.replace(/(loginAll\()|(\);)/g, ''))
    app.userInfo = res
    console.log(res)
  }).catch(err => {
    console.log(err)
  })
}

// 获取大区信息
function getServer() {
  let converterStream = iconv.decodeStream('gbk')
  utils.request({
    url: 'http://gameact.qq.com/comm-htdocs/js/game_area/bns_server_select.js'
  }).pipe(converterStream)
  let response = ''
  converterStream.on('data', str => {
    response += str
  })
  converterStream.on('end', () => {
    eval(response)
    app.servers = BNSServerSelect.STD_DATA
  })
}

// 获取某大区下角色
function getServerRoles(area) {
  utils.getCookie().then(res => {
    return utils.http({
      url: 'http://comm.aci.game.qq.com/main',
      cookie: res.str,
      Referer: 'http://bns.qq.com',
      Host: 'comm.aci.game.qq.com',
      data: {
        game: 'bns',
        area,
        callback: new Date().getTime() + '' + Math.floor(Math.random() * 100000),
        sCloudApiName: 'ams.gameattr.role',
        iAmsActivityId: 148672,
        sServiceDepartment: 'group_5',
      }
    })
  }).then(res => {
    console.log(res)
  })
}
