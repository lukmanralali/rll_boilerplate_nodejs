/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const transaction_status_log = sequelize.define('transaction_status_log', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    transaction_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('Pending','Cancel','Completed'),
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'transaction_status_log'
  })

  transaction_status_log.associate = models => {
    models.transaction_status_log.belongsTo(models.transactions, {
      foreignKey: 'transaction_id'
    })
    models.transaction_status_log.belongsTo(models.user, {
      foreignKey: 'user_id',
      as:'user_log'
    })
  }
  return transaction_status_log
};
