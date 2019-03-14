const sequelize = require('sequelize')

module.exports = function () {
    this.registration = function (connection) {
        return connection.define('registration', {
        status: sequelize.BOOLEAN,
        amount: sequelize.DECIMAL(7,2),
        team: sequelize.INTEGER,
        tx_id: sequelize.STRING,
        time: sequelize.DATE
    })
    }
}
