module.exports = function(sequelize, DataTypes) {
  var Client = sequelize.define('Client', {
    ClientId: {type: DataTypes.INTEGER, primaryKey: true},
    StreamId: {type: DataTypes.INTEGER, primaryKey: true},
    status: {type: DataTypes.ENUM('playing', 'publishing', 'pushing', 'pulling','idle'), allowNull: true},
    os: DataTypes.STRING,
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
