const loginUrl = 'https://xui.ptlogin2.qq.com/cgi-bin/xlogin?proxy_url=http://game.qq.com/comm-htdocs/milo/proxy.html&appid=21000501&target=top&s_url=http%3A%2F%2Fbns.qq.com%2Fcp%2Fa20180725ops%2Findex.htm&style=20&daid=8'
const utils = process.mainModule.exports
const origin_activities = require('./activities')
const getGTK = require('./g_tk')
const STORAGE_USER = '__user__' // 用户信息
const STORAGE_ROLE = '__role__' // 角色
const STORAGE_SERVER = '__server__' // 服务器
const STORAGE_AREA = '__area__' // 大区
let g_tk // cookie中skey加密后的值

// 更新g_tk（用户登陆后）
function updateGTK() {
  let cookie = JSON.parse(localStorage.getItem(STORAGE_USER))
  g_tk = getGTK(cookie.o.skey)
}

let activities = []

// 处理活动
function pullActivities() {
  origin_activities.forEach(item => {
    if (item.open) {
      item.children.forEach((val, key) => {
        activities.push({
          name: `${1 + key}-${item.name}`,
          data: {...val}
        })
      })
    }
  })
}

pullActivities()
// 处理需要绑定的活动
let bindings = []

function handleBindings() {
  origin_activities.forEach(item => {
    if (item.open && item.bind) {
      bindings.push({
        name: `${item.name}`,
        data: {...item.bindData}
      })
    }
  })
}

handleBindings()

let app = new Vue({
  el: '#app',
  data: {
    loginStatus: false, // 是否已经登录
    isLogin: false, // 是否正在开启登录窗口
    userInfo: {}, // 用户登录信息（头像、昵称）
    servers: [], // 大区列表
    servers2: [], // 服务器列表
    servers3: [], // 角色列表
    logs: [], // 日志
    server1: '', // 大区code
    server2: '', // 服务器code
    server3: '', // 角色code
    serverName: '', // 大区/服务器name
    roleName: '', // 角色name
    md5str: '', // 选择角色后获得的md5校验码
    checkparam: '', // 选择角色后获得的校验码
    processing: false // 领取中
  },
  methods: {
    login() {
      let _this = this
      if (this.isLogin) return
      this.isLogin = true
      nw.Window.open(loginUrl, {
        'title': '快捷登录',
        'frame': true
      }, function (new_win) {
        // 阻止登录框打开新页面
        new_win.on('new-win-policy', function (frame, url, policy) {
          policy.ignore()
        })
        new_win.hide()
        new_win.on('loaded', function () {
          _this.isLogin = false
          this.show()
          // 登录完成后
          this.window.onunload = () => {
            // 关闭快捷登录并获取登录用户信息
            this.close()
            utils.getCookie().then(res => {
              localStorage.setItem(STORAGE_USER, JSON.stringify(res))
              getUserInfo()
            })
          }
        })
      })
    },
    // 大区选择器变化时
    handleServer1(e) {
      let val = e.target.value
      this.handleAreaChange(val)
    },
    // 服务器选择器变化时
    handleServer2(e) {
      let val = e.target.value
      this.handleServerChange(val)
    },
    // 角色选择器变化时
    handleServer3(e) {
      let val = e.target.value
      this.handleRoleChange(val)
    },
    handleAreaChange(val) {
      if (val) {
        this.servers.forEach(item => {
          if (item.v === val) {
            this.servers2 = item.opt_data_array
          }
        })
      } else {
        this.servers2 = []
        this.server2 = ''
      }
    },
    handleServerChange(val) {
      if (val) {
        this.servers2.forEach(item => {
          if (item.v === val) {
            this.serverName = item.t
          }
        })
        getServerRoles(val)
      } else {
        this.servers3 = []
        this.server3 = ''
      }
    },
    handleRoleChange(val) {
      this.servers3.forEach(item => {
        if (item.value === val) {
          this.roleName = item.name
        }
      })
      localStorage.setItem(STORAGE_ROLE, this.server3)
      localStorage.setItem(STORAGE_SERVER, this.server2)
      localStorage.setItem(STORAGE_AREA, this.server1)
    },
    // 领取活动
    pull() {
      if (this.processing) {
        // 停止
        this.processing = false
      } else {
        // 开始
        this.processing = true
        this.logs = []
        bindRole(0)
      }
    },
    mini() {
      let win = nw.Window.get()
      win.minimize()
    },
    close() {
      let win = nw.Window.get()
      win.close()
    },
    about() {
      alert(`Author：ChenJiYuan\nGitHub：attachking`)
    }
  },
  created() {
    getServer()
    this.$watch('servers', () => {
      setTimeout(() => {
        this.server1 = localStorage.getItem(STORAGE_AREA) || ''
        this.handleAreaChange(this.server1)
        this.server2 = localStorage.getItem(STORAGE_SERVER) || ''
        this.handleServerChange(this.server2)
        this.server3 = localStorage.getItem(STORAGE_ROLE) || ''
      }, 20)
    })
  }
})

// 获取登录用户头像及昵称
function getUserInfo() {
  let cookie = JSON.parse(localStorage.getItem(STORAGE_USER))
  if (!cookie) return
  utils.http({
    url: 'http://qfwd.qq.com/',
    cookie: cookie.str,
    Referer: 'http://www.qq.com/',
    Host: 'qfwd.qq.com',
    params: {
      uin: cookie.o.uin && cookie.o.uin.substr(2), // 登录用户QQ号
      skey: cookie.o.skey, // 好像是用户登录凭证，在cookie里储存
      refresh: 0, // 不知道
      func: 'loginAll', // 回调函数
      ran: Math.random() // 随机数
    }
  }).then(res => {
    res = JSON.parse(res.data.replace(/(loginAll\()|(\);)/g, ''))
    if (Number(res.result) === 0) {
      handleMessage(`用户登录：${res.nick}登陆成功！`)
      // 用户登陆成功时更新g_tk
      updateGTK()
      app.loginStatus = true
      app.handleServerChange(app.server2)
    } else {
      app.loginStatus = false
      handleMessage(`用户登录：${JSON.stringify(res)}`)
    }
    app.userInfo = res
  }).catch(err => {
    app.loginStatus = false
    handleMessage(`登录出错：${JSON.stringify(err)}`)
  })
}

getUserInfo()

// 获取大区信息
async function getServer() {
  // 剑灵所有大区信息，返回数据编码为GBK
  let response = await utils.http({
    url: 'http://gameact.qq.com/comm-htdocs/js/game_area/bns_server_select.js',
    enCoding: 'gbk',
    noHeader: true
  })
  eval(response.data)
  if (typeof BNSServerSelect !== 'undefined') {
    app.servers = BNSServerSelect.STD_DATA
  }
}

// 获取某大区下角色
function getServerRoles(area) {
  let cookie = JSON.parse(localStorage.getItem(STORAGE_USER))
  if (!cookie) return
  utils.http({
    url: 'http://comm.aci.game.qq.com/main',
    cookie: cookie.str,
    Referer: 'http://bns.qq.com/cp/a20180725ops/index.htm',
    Host: 'comm.aci.game.qq.com',
    params: {
      game: 'bns', // 游戏简称
      area, // 大区id
      sCloudApiName: 'ams.gameattr.role', // 应该是后台接口名
      // iAmsActivityId: 154012, // 活动id，应该不是重点参数
      sServiceDepartment: 'group_5',
    }
  }).then(res => {
    eval(res.data)
    let arr = []
    if (typeof query_role_result !== 'undefined') {
      // 处理角色数据
      query_role_result.data = decodeURIComponent(query_role_result.data)
      arr = query_role_result.data.split('&')[1].split('|')
      arr.splice(0, 1)
      arr = arr.map(item => {
        let a = item.split(' ')
        return {
          name: a[1],
          value: a[0]
        }
      })
      app.servers3 = arr
      app.handleRoleChange(localStorage.getItem(STORAGE_ROLE))
      app.md5str = query_role_result.md5str // 提交活动需要的md5校验码
      app.checkparam = encodeURIComponent(query_role_result.checkparam) // 提交活动需要的校验参数
    }
  })
}

// 有些活动需要先绑定角色
function bindRole(key) {
  if (!app.server3) {
    alert('您还没有选择角色！')
    return
  }
  if (!bindings[key]) {
    // 绑定完毕之后，再领取礼包
    pull(0)
    return
  }
  if (!app.processing) {
    handleMessage('已停止！')
    return
  }
  let cookie = JSON.parse(localStorage.getItem(STORAGE_USER))
  let data = {
    sServiceType: 'bns',
    user_area: app.server2, // 大区id
    user_roleId: app.server3, // 角色id
    user_roleName: encodeURIComponent(app.roleName),
    user_areaName: encodeURIComponent(app.serverName),
    user_checkparam: app.checkparam,
    user_md5str: app.md5str,
    user_partition: app.server2, // 大区id
    g_tk,
    e_code: 0,
    g_code: 0,
    xhr: 1,
    sServiceDepartment: 'group_5',
    ...bindings[key].data
  }
  let options = {
    url: 'http://x6m5.ams.game.qq.com/ams/ame/amesvr',
    data,
    params: data,
    cookie: cookie.str,
    Origin: 'http://x6m5.ams.game.qq.com',
    Referer: 'http://x6m5.ams.game.qq.com/ams/postMessage_noflash.html',
    Host: 'x6m5.ams.game.qq.com',
    method: 'POST'
  }
  handleOtherUrl(data, options)
  utils.http(options).then(res => {
    let data = JSON.parse(res.data)
    // ret为101时，用户未登录
    if (Number(data.ret) === 101) {
      handleMessage(`${data.flowRet && data.flowRet.sMsg}`)
      app.login()
      app.processing = false
      return
    }
    let msg = ''
    if (data.modRet && data.modRet.sMsg) {
      msg = data.modRet.sMsg
    } else if (data.flowRet && data.flowRet.sMsg) {
      msg = data.flowRet.sMsg
    }
    // ret为0时，绑定成功
    handleMessage(`${bindings[key].name}：${msg}`)
    bindRole(key + 1)
  }).catch(err => {
    handleMessage(`${bindings[key].name}：${err.message}`)
    bindRole(key + 1)
  })
}

// 领取活动（主函数）
function pull(key) {
  if (!app.server3) {
    alert('您还没有选择角色！')
    return
  }
  if (!activities[key]) {
    app.processing = false
    handleMessage('领取结束！')
    return
  }
  if (!app.processing) {
    handleMessage('已停止！')
    return
  }
  let cookie = JSON.parse(localStorage.getItem(STORAGE_USER))
  let data = {
    gameId: '',
    sArea: app.server2, // 大区id
    sRoleId: app.server3, // 角色id
    iGender: '',
    sServiceType: 'bns', // 服务类型（剑灵）
    objCustomMsg: '',
    areaname: encodeURIComponent(app.serverName),
    roleid: app.server3,
    rolelevel: '',
    rolename: encodeURIComponent(app.roleName),
    areaid: app.server2,
    sPartition: '',
    sAreaName: encodeURIComponent(app.serverName), // 服务器名称（url转码）
    sRoleName: encodeURIComponent(app.roleName), // 角色名称（url转码）
    md5str: app.md5str, // md5校验码（选择角色时返回的参数）
    ams_checkparam: app.checkparam, // 角色校验码（选择角色时返回的参数）
    checkparam: app.checkparam, // 角色校验码（选择角色时返回的参数）
    xhrPostKey: '',
    isXhrPost: true,
    g_code: 0,
    e_code: 0,
    sServiceDepartment: 'group_5', // 不知道是啥，但是必传，普通活动和心悦活动参数还不一样
    ameVersion: 0.3,
    xhr: 1,
    g_tk, // 根据cookie中skey加密后的值（具体算法见g_tk.js）
    // iGiftId: activities[key].iGiftId, // 礼包领取id
    // iActivityId: activities[key].iActivityId, // 活动id
    // iFlowId: activities[key].iFlowId, // 流程id
    ...activities[key].data
  }
  let options = {
    url: 'http://x6m5.ams.game.qq.com/ams/ame/amesvr',
    data,
    params: data,
    cookie: cookie.str,
    Origin: 'http://x6m5.ams.game.qq.com',
    Referer: 'http://x6m5.ams.game.qq.com/ams/postMessage_noflash.html',
    Host: 'x6m5.ams.game.qq.com',
    method: 'POST'
  }
  handleOtherUrl(data, options)
  utils.http(options).then(res => {
    let data = JSON.parse(res.data)
    // ret为101时，用户未登录
    if (Number(data.ret) === 101) {
      handleMessage(`${data.flowRet && data.flowRet.sMsg}`)
      app.login()
      app.processing = false
      return
    }
    let msg = ''
    if (data.modRet && data.modRet.sMsg) {
      msg = data.modRet.sMsg
    } else if (data.flowRet && data.flowRet.sMsg) {
      msg = data.flowRet.sMsg
    }
    // ret为0时，礼包领取成功
    handleMessage(`${activities[key].name}：${msg}`)
    // 点击次数过快请求会被服务器拒绝，延时2s
    setTimeout(() => {
      pull(key + 1)
    }, 2000)
  }).catch(err => {
    handleMessage(`${activities[key].name}：${err.message}`)
    setTimeout(() => {
      pull(key + 1)
    }, 2000)
  })
}

// 处理日志
function handleMessage(msg) {
  app.logs.push(msg)
  app.$nextTick(() => {
    let log = document.getElementById('log')
    log.scrollTop += 50
  })
}

// 不同平台的活动请求的接口可能不一样
function handleOtherUrl(data, options) {
  if (data.sServiceDepartment === 'xinyue') {
    xinyue(options)
  }
}

// 心悦俱乐部活动url
function xinyue(options) {
  options.Origin = 'http://act.game.qq.com'
  options.Host = 'act.game.qq.com'
  options.Referer = 'http://act.game.qq.com/ams/postMessage_noflash.html'
  options.url = 'http://act.game.qq.com/ams/ame/amesvr'
}
