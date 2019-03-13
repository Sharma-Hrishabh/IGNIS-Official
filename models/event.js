const sequelize = require('sequelize')

module.exports = function () {
    this.event = function (connection) {
        return connection.define('event', {
            name: sequelize.STRING,
            max_players: sequelize.INTEGER,
            min_players: sequelize.INTEGER,
            fee: sequelize.INTEGER
        })
    }
}
