module.exports = function(sequelize, DataTypes) {
  var Server = sequelize.define('Server', {
    ip: { type: DataTypes.STRING, unique: true},
    bandwidth: DataTypes.INTEGER,
    status: {type: DataTypes.ENUM('new', 'active', 'inactive', 'archived'), allowNull: true},
    provider: DataTypes.STRING,
    geo: DataTypes.ARRAY(DataTypes.FLOAT),
  }, {
    classMethods: {
      associate: function(models) {
        Server.hasMany(models.Stream)
      }
    }
  })
 
  return Server
  
}
