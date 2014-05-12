module.exports = function(sequelize, DataTypes) {
  var Stream = sequelize.define('Stream', {
    name: { type: DataTypes.STRING, allowNull: false},
    status: DataTypes.ENUM('idle', 'active'),
    vcodec: DataTypes.ENUM('vp6', 'h264'),
    acodec: DataTypes.ENUM('mp3', 'aac'),
    vbit: DataTypes.INTEGER,
    sizew: DataTypes.INTEGER,
    sizeh: DataTypes.INTEGER,
    fps: DataTypes.INTEGER,
    abit: DataTypes.INTEGER,
    freq: DataTypes.INTEGER,
    chan: DataTypes.FLOAT,
    datain: DataTypes.BIGINT,
    dataout: DataTypes.BIGINT,
    bandin: DataTypes.INTEGER,
    bandout: DataTypes.INTEGER,
    duration: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        Stream.belongsTo(models.Person)
        Stream.belongsTo(models.Server)
        Stream.hasMany(models.Client)
      }
    }
  })
 
  return Stream
  
}
