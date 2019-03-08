/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const transaction_dealing = sequelize.define('transaction_dealing', {
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
    deal_reff: {
      type: DataTypes.ENUM('Debit','Credit'),
      allowNull: false
    },
    user_deal_reff_id: {
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
    tableName: 'transaction_dealing'
  })

  transaction_dealing.associate = models => {
    models.transaction_dealing.belongsTo(models.transactions, {
      foreignKey: 'transaction_id',
      as:'dealing'
    })
    models.transaction_dealing.belongsTo(models.user, {
      foreignKey: 'user_deal_reff_id',
      as:'user'
    })
  }
  return transaction_dealing
}
