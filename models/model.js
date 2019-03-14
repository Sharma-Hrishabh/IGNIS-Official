const sequelize = require('sequelize')
module.exports = function() {
    
    this.player = {
        team: sequelize.STRING,
        name: sequelize.STRING,
        email: sequelize.STRING
    }
    
    this.event = {
        name: sequelize.STRING,
        max_players: sequelize.INTEGER,
        min_players: sequelize.INTEGER,
        fee: sequelize.INTEGER
    }
    
    this.registration = {
        status: sequelize.BOOLEAN,
        amount: sequelize.DECIMAL(7,2),
        team: sequelize.STRING,
        tx_id: sequelize.STRING,
        time: sequelize.DATE
    }
    
    this.team = {
        name: sequelize.STRING,
        college: sequelize.STRING,
        leader: sequelize.STRING,
        event: sequelize.STRING,
        leader: sequelize.STRING,
        email: sequelize.STRING,
        contact: sequelize.BIGINT
    }
    
    this.college = {
        name: sequelize.STRING,
        state: sequelize.STRING,
        city: sequelize.STRING,
        pincode: sequelize.INTEGER
    }
}
