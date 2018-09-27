const {Request} = require('../js/main')

let upload = new Request({
  url: 'http://192.168.1.100:9999/service/business/fm/pic/picInfo/uploadPicInfo'
})

upload.upload().then(res => {
  console.log(res)
}).catch(err => {
  console.log(err)
})