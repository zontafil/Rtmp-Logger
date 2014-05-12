var ConnectRoles = require('connect-roles')
  , user = new ConnectRoles()

user.use('access stats',function(req){
  if (req.user.rank=='admin') return true
  else if ((req.user.rank=='user') && (req.user.id==req.params.personid)) return true
  else return false
})

module.exports = user