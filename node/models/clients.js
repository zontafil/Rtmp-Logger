module.exports = function(sequelize, DataTypes) {
  var Client = sequelize.define('Client', {
    ClientId: {type: DataTypes.INTEGER, primaryKey: true},
    StreamId: {type: DataTypes.INTEGER, primaryKey: true},
    status: DataTypes.ENUM('playing', 'publishing', 'pushing', 'pulling','idle'),
    os: DataTypes.STRING,
    // os: DataTypes.ENUM('windows','mac','Linux','iOS','android'),
    flash: DataTypes.STRING,
    browser: DataTypes.STRING,
    url: DataTypes.STRING,
    swf: DataTypes.STRING,
    drop: DataTypes.STRING,
    av: DataTypes.STRING,
    duration: DataTypes.INTEGER //fixme?
  }, {
    classMethods: {
      associate: function(models) {
        Client.belongsTo(models.Stream,{foreignKey: 'StreamId'})
      }
    }
  })
 
  return Client
  
}
