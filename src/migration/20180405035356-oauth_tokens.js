'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.createTable('oauth_tokens', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
         access_token: {
          allowNull: false,
          type: Sequelize.STRING
        },
         access_token_expires_on: {
          allowNull: false,
          type: Sequelize.DATE
        },
        client_id: {
          allowNull: false,
          type: Sequelize.INTEGER
        },
         refresh_token: {
          allowNull: false,
          type: Sequelize.STRING
        },
         refresh_token_expires_on: {
          allowNull: false,
          type: Sequelize.DATE
        },
        user_id: {
          allowNull: false,
          type: Sequelize.INTEGER
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }),
      queryInterface.sequelize.query("ALTER TABLE oauth_tokens ADD CONSTRAINT client_id_fkey FOREIGN KEY (client_id) REFERENCES oauth_clients (client_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE;"),
      queryInterface.sequelize.query("ALTER TABLE oauth_tokens ADD CONSTRAINT user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE;")
    ]);    
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('oauth_tokens');
  }
};
