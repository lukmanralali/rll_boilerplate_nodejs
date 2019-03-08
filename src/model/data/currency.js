/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const currency = sequelize.define('currency', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    desc: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'currency'
  })

  currency.associate = models => {
    models.currency.hasMany(models.transactions, {
      foreignKey: 'currency_id'
    })
  }
  return currency
};
