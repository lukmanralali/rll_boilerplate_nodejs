/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const transaction = sequelize.define('transactions', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    trans_reff_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('TopUp','Cashback','Order','ReFund'),
      allowNull: false
    },
    trans_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Pending','Cancel','Completed'),
      allowNull: false
    },
    obligor_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    beneficiary_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    currency_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'currency',
        key: 'id'
      }
    },
    remark_1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    remark_2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'transactions'
  })

  transaction.associate = models => {
    models.transactions.belongsTo(models.currency, {
      foreignKey: 'currency_id',
      as:'currency'
    })
    models.transactions.belongsTo(models.user, {
      foreignKey: 'obligor_id',
      as:'obligor'
    })
    models.transactions.belongsTo(models.user, {
      foreignKey: 'beneficiary_id',
      as:'beneficiary'
    })
    models.transactions.hasMany(models.transaction_status_log, {
      foreignKey: 'transaction_id',
      as:'history'
    })
    models.transactions.hasMany(models.transaction_dealing, {
      foreignKey: 'transaction_id',
      as:'dealing'
    })
  }
  return transaction
};