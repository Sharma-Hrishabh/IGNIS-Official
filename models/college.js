const sequelize = require('sequelize')

module.exports = function () {
    this.college = function (connection) {
        return connection.define('college', {
            name: sequelize.STRING,
            state: sequelize.STRING,
            city: sequelize.STRING,
            pincode: sequelize.INTEGER
        })
    }
}
