const sequelize = require('sequelize')

module.exports = function () {
    this.player = function (connection) {
        return connection.define('player', {
            team: sequelize.STRING,
            name: sequelize.STRING,
            college: sequelize.INTEGER,
            email: sequelize.STRING
        })
    }
}
