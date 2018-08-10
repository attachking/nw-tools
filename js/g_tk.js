module.exports = function(str){
  let hash = 5381;
  for(let i = 0, len = str.length; i < len; ++i){
    hash += (hash << 5) + str.charAt(i).charCodeAt(0)
  }
  return hash & 2147483647
}