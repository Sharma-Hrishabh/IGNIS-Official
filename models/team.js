const sequelize = require('sequelize')

module.exports = function () {
    this.team = function (connection) {
        return connection.define('team', {
            name: {type: sequelize.STRING, unique: true},
            status: {type: sequelize.BOOLEAN, defaultValue: false},
            college: sequelize.INTEGER,
            leader: sequelize.INTEGER,
            event: sequelize.INTEGER,
            leader: sequelize.STRING,
            email: {type: sequelize.STRING, unique: true},
            contact: {type: sequelize.BIGINT, unique: true}
        })
    }
}
