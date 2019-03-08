'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.createTable('transactions', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        order_id: {
          allowNull: false,
          type: Sequelize.INTEGER
        },
        txn_type: {
          allowNull: false,
          type: Sequelize.ENUM('Order','Cancel','Refund','PartialRefund','Credit','Confirmed','Cashback','DebitToSettlement')
        },
        txn_date: {
          allowNull: false,
          type: Sequelize.DATE
        },
        linked_txn_id: {
          allowNull: true,
          type: Sequelize.INTEGER
        },
        obligor_id: {
          allowNull: false,
          type: Sequelize.INTEGER
        },
        beneficiary_id: {
          allowNull: false,
          type: Sequelize.INTEGER
        },
        amount: {
          allowNull: false,
          type: Sequelize.STRING
        },
        amount_currency: {
          allowNull: false,
          type: Sequelize.ENUM('IDR','USD','CNY')
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }),
      queryInterface.sequelize.query("ALTER TABLE transactions ADD CONSTRAINT obligor_id_fkey FOREIGN KEY (obligor_id) REFERENCES users (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT;"),
      queryInterface.sequelize.query("ALTER TABLE transactions ADD CONSTRAINT beneficiary_id_fkey FOREIGN KEY (beneficiary_id) REFERENCES users (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT;"),
      queryInterface.sequelize.query("ALTER TABLE transactions ADD CONSTRAINT linked_txn_id_fkey FOREIGN KEY (linked_txn_id) REFERENCES transactions (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE;")
    ]);    
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('transactions');
  }
};
