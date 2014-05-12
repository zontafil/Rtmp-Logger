  module.exports = function(sequelize, DataTypes) {
  var ClientsStreams = sequelize.define('ClientsStreams', {
    status: DataTypes.ENUM('playing', 'publishing', 'pushing', 'pulling','idle'),
    // duration: DataTypes.DATE //fixme?
  })
 
  return ClientsStreams
  
}
