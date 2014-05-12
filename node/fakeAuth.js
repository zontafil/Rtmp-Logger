var db = require('./models')

exports.fakeAuth = function(req,res,next){
	db.Person.find({where:{username:'topolino'}})
	.success(function(user_item){
		if (!!user_item){
			req.user = user_item
			delete req.user.password
			next()
		}
		else next(new Error('User not found'))
	})
	.error(function(err){next(new Error(err))})
}