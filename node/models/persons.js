module.exports = function(sequelize, DataTypes) {
  var Person = sequelize.define('Person', {
    username: { type: DataTypes.STRING, unique: true},
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    plan: {type: DataTypes.ENUM('plan1', 'plan2', 'plan3'), allowNull:true},
    rank: {type: DataTypes.ENUM('admin', 'user', 'viewer'), allowNull:true},
    lastlogin: DataTypes.DATE
  }, {
    classMethods: {
      associate: function(models) {
        Person.hasMany(models.Stream)
      }
    }
  })
 
  return Person
  
}
