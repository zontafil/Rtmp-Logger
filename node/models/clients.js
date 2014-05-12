module.exports = function(sequelize, DataTypes) {
  var Client = sequelize.define('Client', {
    os: DataTypes.STRING,
    // os: DataTypes.ENUM('windows','mac','Linux','iOS','android'),
    flash: DataTypes.STRING,
    browser: DataTypes.STRING,
    url: DataTypes.STRING,
    swf: DataTypes.STRING,
    drop: DataTypes.STRING,
    av: DataTypes.STRING,
    duration: DataTypes.DATE //fixme?
  }, {
    classMethods: {
      associate: function(models) {
        Client.hasMany(models.Stream, {through: models.ClientsStreams})
      }
    }
  })
 
  return Client
  
}
