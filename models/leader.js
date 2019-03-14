const sequelize = require('sequelize')

module.exports = function () {
    this.leader = function (connection) {
        return connection.define('leader', {
            name: sequelize.STRING,
            email: sequelize.STRING,
            contact: sequelize.BIGINT
        })
    }
}
