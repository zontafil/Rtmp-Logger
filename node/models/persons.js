module.exports = function(sequelize, DataTypes) {
  var Person = sequelize.define('Person', {
    username: { type: DataTypes.STRING, unique: true},
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    plan: DataTypes.ENUM('plan1', 'plan2', 'plan3'),
    rank: DataTypes.ENUM('admin', 'user', 'viewer'),
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
