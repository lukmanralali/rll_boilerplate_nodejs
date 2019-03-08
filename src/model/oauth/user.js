/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const user = sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    client_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Pending','Active'),
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
  }, {
    tableName: 'user'
  })
  user.associate = models => {
    models.user.hasMany(models.transactions, {
      foreignKey: 'obligor_id'
    })
    models.user.hasMany(models.transactions, {
      foreignKey: 'beneficiary_id'
    })
    models.user.hasMany(models.transaction_dealing, {
      foreignKey: 'user_deal_reff_id',
      as:'user'
    })
  }
  return user
}
