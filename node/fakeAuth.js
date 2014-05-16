var db = require('./models')

exports.fakeAuth = function(req,res,next){
	var personid = req.params.personid
	db.Person.find({where:{id:personid}})
	.success(function(person_item){
		if (!!user_item){
			req.user = user_item
			delete req.user.password
			next()
		}
		else next(new Error('User not found'))
	})
	.error(function(err){next(new Error(err))})
}