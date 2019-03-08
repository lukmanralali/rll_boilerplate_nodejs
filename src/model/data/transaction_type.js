/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const transaction_type = sequelize.define('transaction_type', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    need_verify: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: '0'
    },
    need_active_account: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: '0'
    },
    default_obligor_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    default_beneficiary_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    sub_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    beneficiary_used: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0' // 0=ignored, 1=optional, 2=should
    },
    desc: {
      type: DataTypes.STRING,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'transaction_type'
  })
  return transaction_type
}
