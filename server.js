const port = 3000
require('./models/team')()
require('./models/event')()
const path = require('path')
require('./models/player')()
require('./models/college')()
const https = require('https')
require('./models/registration')()
const express = require('express')
const sequelize = require('sequelize')
const checksum = require('./lib/checksum.js')
const bodyParser = require('body-parser')
const session = require('express-session')
const sequelizeStore = require('connect-session-sequelize')(session.Store)
const App = express()


App.disable('x-powered-by')


App.use(express.static(path.join(__dirname + '/views/')))
App.use(express.static(path.join(__dirname + '/assets/')))
App.use(express.static(path.join(__dirname + '/public/')))

App.use(bodyParser.json())
App.use(bodyParser.urlencoded({
    extended: true
}))



var PaytmConfig = {
    mid: "wmuEJA26128098023775", // use the development merchant id
	key: "gi8teVPs1FIdsjcL",   // use the secret key of development
	website: "WEBSTAGING"
}



App.set('view engine', 'mustache')
App.engine('mustache', require('hogan-middleware').__express)


const reg_mail = RegExp(/^[A-Z0-9._%+-]+@[A-Z0-9._-]+.[A-Z]{2,63}$/i)
const reg_name = RegExp(/^[a-z ]+$/i)
const reg_contact = RegExp(/^[0-9]{10}$/)
const reg_pin = RegExp(/^[0-9]{6}$/)


const connection = new sequelize('ignis2k19', 'ujjwal', null, {
    dialect: 'sqlite',
    storage: 'ignis2k19.sqlite',
    logging: false
})

connection.authenticate()
    .then(() => {
        Player = player(connection)
        Event = event(connection)
        Registration = registration(connection)
        Team = team(connection)
        College = college(connection)

        connection.sync().then(() => {
            console.log('\nMODEL_SYNC.')
        }).catch(err => {
            console.log('\nMODEL_SYNC_ERROR: ' + err)
        })
        console.log('\nDB_CONNECTED!')
    })
    .catch(err => {
        console.error('\nDB_CONNECT_ERROR: ', err)
    });


App.use(['/view-team', '/pay', '/players'], session({
    store: new sequelizeStore({
        db: connection
    }),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    name: '_ignistest',
    cookie: {
        maxAge: 600000
    }
}))

/*
    This is the landing page
    Home page 
*/
App.get('/', (req, res) => {
    res.sendFile("index.html")
})

/*
    faq page is displayed 
    simple get request is accepted
*/
App.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname + "/views/faq.html"))
})

/*
    registration page, showing the instructions for registration
    this route accepts simple get request
    a static html file is returned
    can be visited directly, or through a link
    
    only link to the registration form
    
    TODO
    create a session for 15 minutes
    or use coockies or something
*/
App.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/register.html'))
})


/*
    this is rgistration form for team
    the form is to be filled by leader
    accepts GET request redirected from '/regiter' route
    
    this page sends the user to player form page
*/
App.get('/teamform', (req, res) => {
    console.log(req.headers.referer)
    // CLEAN
    if (req.headers.referer == 'https://' + req.headers.host + '/register' || req.headers.referer == 'http://' + req.headers.host + '/register') {
        res.sendFile(path.join(__dirname + '/views/reg_form.html'))
    } else {
        res.send("PAGE NOT FOUND!")
    }
})


/*
    cannot be visited
    only POST request from team registration page is allowed
    no view is available
    user redirected to player-form
*/
App.post('/submit-team', (req, res) => {
    // CLEAN
    if (req.headers.referer == 'https://' + req.headers.host + '/teamform' || req.headers.referer == 'http://' + req.headers.host + '/teamform') {
        // TODO
        const form = req.body
        var leader_id, college_id, team_id, event_id = 2

        if (reg_name.test(form.college) && reg_name.test(form.state) && reg_name.test(form.city) && reg_pin.test(form.pincode) && reg_name.test(form.leader) && reg_mail.test(form.email) && reg_contact.test(form.contact) && reg_name.test(form.team)) {
            College.create({
                name: form.college,
                state: form.state,
                city: form.city,
                pincode: form.pincode
            }, {
                fields: ['name', 'state', 'city', 'pincode']
            }).then((clg) => {
                college_id = clg.id
                Team.create({
                    name: form.team,
                    college: college_id,
                    leader: leader_id,
                    event: event_id,
                    leader: form.leader,
                    email: form.email,
                    contact: form.contact
                }, {
                    fields: ['name', 'college', 'leader', 'event', 'leader', 'email', 'contact']
                }).then((tm) => {
                    team_id = tm.id
                    Player.create({
                        name: form.leader,
                        team: form.team,
                        college: college_id
                    }, {
                        fields: ['name', 'team', 'college']
                    }).then(() => {
                        res.redirect('/players?pl=' + form.player + '&team=' + form.team)
                        // res.send("Team details saved!")
                    }).catch(err => {
                        res.send('Could not proceed for registration.<br>Try after sometime.<br>If the problem persists, Kindly contact us!')
                        console.log("PLAYER_ADD_ERR: " + err)
                    })
                }).catch(err => {
                    res.send('Could not proceed for registration.<br>Try after sometime.<br>If the problem persists, Kindly contact us!')
                    console.log("TEAM_ADD_ERR: " + err)
                }) // TODO
            }).catch((err) => {
                res.send('Could not proceed for registration.<br>Try after sometime.<br>If the problem persists, Kindly contact us!')
                console.log("COLLEGE_ADD_ERR: " + err)
            })
        } else {
            res.send("INVALID VALUE!")
        }
        // on successful commit to database, redirect the client
    } else {
        res.send("PAGE NOT FOUND!")
    }
})


/*
    form for submitting player information
    only get request through reference from team registration page
*/
App.all('/players', (req, res) => {
    // CLEAN
    if (req.method == "GET" && (req.headers.referer == 'https://' + req.headers.host + '/teamform' || req.headers.referer == 'http://' + req.headers.host + '/teamform')) {
        // getting player count from the 'teamform' route
        req.session.team = req.query.team
        var pList = []
        for (var i = 1; i <= req.query.pl; i++)
            pList.push("Player " + i)

        res.render('player_form', {
            playerList: pList
        })
        // res.sendFile(path.join(__dirname+'/views/player_form.html'))
    } else if (req.method == "POST" && req.session.team != null) {
        // TODO: save form data
        var form = req.body
        var size = Object.keys(form).length,
            flag = true,
            entry = [],
            team = req.session.team

        for (var i = 1; i < size; i++) {
            if (!reg_name.test(form['Player ' + i])) {
                flag = false
                break
            }

            entry.push({
                name: form['Player ' + i],
                team: team
            })
        }

        if (flag) {
            // TODO: valid input, add to db
            Player.bulkCreate(entry, {
                fields: ['name', 'team']
            }).then(() => {
                // on successfull team submission,
                // redirect to 'view-team' page
                res.redirect('/view-team')
                Team.update({
                    status: true
                }, {
                    where: {
                        name: team
                    }
                }).catch(err => {
                    console.log("TEAM_STAT_UPDATE_ERR (" + team + "): " + err)
                })
            }).catch(err => {
                res.send("Internal server problem.<br>Please try again after some time.")
                console.log("PLAYER_ADD_ERR: " + err)
            })
        } else {
            // TODO: return invalid input
            res.send("INVALID INPUT!!")
            console.log("Invalid input to /players route")
        }

    } else {
        if (req.session) req.session.destroy()
        res.send("PAGE NOT FOUND!")
    }
})


/*
    shows a form for crdentials of the leader
    on valid credentials input
    team info is shown on same route
*/
App.all('/view-team', (req, res) => {
    if (req.method == "GET") {
        if (req.session.team != null) {
            res.send('<form name=\"f1\" action=\"/view-team\" method=\"post\"></form><script type=\"text/javascript\">window.f1.submit()</script>')
            // res.send(path.join(__dirname + '/views/forward_req.html'))
        } else {
            if (req.session) req.session.destroy()
            res.sendFile(path.join(__dirname + '/views/view_team_form.html'))
        }
    } else if (req.method == "POST" && req.session.team == null) {
        /*
            TODO: refer to submit team info for viewing status
        */
        // CLEAN
        if (req.headers.referer == 'https://' + req.headers.host + '/view-team' || req.headers.referer == 'http://' + req.headers.host + '/view-team') {
            if (reg_mail.test(req.body.email) || reg_contact.test(req.body.cno)) {

                var condition = {}

                if (req.body.cno != '') {
                    condition = {
                        contact: req.body.cno
                    }
                } else if (req.body.email != '') {
                    condition = {
                        email: req.body.email
                    }
                }
                console.log(condition)
                Team.findAll({
                    where: condition
                }).then((result) => {
                    if (result.length == 1) {
                        // redirect to show team details
                        req.session.team = result[0].name
                        res.send('You are Logged in.<form name=\"f1\" action=\"/view-team\" method=\"post\"></form><script type=\"text/javascript\">window.f1.submit()</script>')
                    } else {
                        console.log("Team not registered.")
                        if (res.session) res.session.destroy()
                        res.send("Login failed!\nTry again with valid credentials!<br>If you are a new user, please register your team on the below link.")
                    }
                }).catch(err => {
                    if (res.session) res.session.destroy()
                    res.send("Internal error.")
                    console.log("ACCOUNT SEARCH ERR: " + err)
                })
            } else {
                // TODO: render a page of invalid credentials
                // redirect to login page
                if (res.session) res.session.destroy()
                res.redirect('/view-team')
                // res.send("INVALID INPUT!")
            }
        } else {
            if (res.session) res.session.destroy()
            res.send("PAGE NOT FOUND!")
        }
    } else if (req.method == "POST" && req.session.team != null && (req.headers.referer == 'https://' + req.headers.host + '/view-team' || req.headers.referer == 'http://' + req.headers.host + '/view-team')) {
        // TODO: show team detail as user is already logged in
        Team.findAll({
            attributes: ['name', 'leader', 'email', 'contact', 'event', 'college', 'status'],
            where: {
                name: req.session.team
            }
        }).then((result) => {
            // console.log(result[0].dataValues)
            Player.findAll({
                attributes: ['name', 'email'],
                where: {
                    team: req.session.team
                }
            }).then((pl_res) => {
                // render the details to client
                res.render('view_team', result[0].dataValues)
            }).catch(err => {
                // TODO
                res.send("Something Went Wrong!!")
                console.log("PLAYER_FIND_ERR: " + err)
            })
            // res.send(result)
        }).catch(err => {
            res.send("Internal error")
            console.log("TEAM DETAIL SEARCH ERR: " + err)
        })
    } else {
        console.log(req.method)
        if (req.session) req.session.destroy()
        res.send("PAGE NOT FOUND!")
    }
})


/*
    Proceed for paying the registration fee
    require login
*/
App.all('/pay', (req, res) => {
    if (req.method == "GET" && (req.headers.referer == 'https://' + req.headers.host + '/view-team' || req.headers.referer == 'http://' + req.headers.host + '/view-team') && req.session.team != null) {
        // TODO: 
        res.sendFile(path.join(__dirname + '/views/index0.html'))
        console.log(req.session.team)
    } else if (req.method == "POST"  && (req.headers.referer == 'https://' + req.headers.host + '/pay' || req.headers.referer == 'http://' + req.headers.host + '/pay') && req.session.team != null) {
        // TODO: refer to the merchant's page
        // res.send('got the response!')
        var params 						= {};
        params['MID'] 					= PaytmConfig.mid;
        params['WEBSITE']				= PaytmConfig.website;
        params['CHANNEL_ID']			= 'WEB';
        params['INDUSTRY_TYPE_ID']	= 'Retail';
        params['ORDER_ID']			= 'TEST_'  + new Date().getTime();
        params['CUST_ID'] 			= 'Customer001';
        params['TXN_AMOUNT']		= '10.00';
        params['CALLBACK_URL']		= 'https://ignis-nodejs.herokuapp.com/callback';
        params['EMAIL']				= 'gamerujjwal@gmail.com';
        params['MOBILE_NO']			= '7777777777';

        checksum.genchecksum(params, PaytmConfig.key, function (err, checksum) {

            var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
            // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
            
            var form_fields = "";
            for(var x in params){
                form_fields += "<input type='hidden' name='"+x+"' value='"+params[x]+"' >";
            }
            form_fields += '<input type="hidden" name="CHECKSUMHASH" value="'+checksum+'" >';

            // res.writeHead(200, {'Content-Type': 'text/html'});
            // res.write();
            res.send('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form type="hidden" method="post" action="'+txn_url+'" name="f1">'+form_fields+'</form><script type="text/javascript">document.f1.submit()</script></body></html>');
        });
        console.log(req.session.team)
    } else {
        res.send("PAGE NOT FOUND!")
    }
})


/*
    callback function for the merchant's page
*/
App.post('/callback', (req, res) => {
    var body = '';

    var html = "";
    var post_data = req.body;
    console.log(body)
    
    // received params in callback
    console.log('Callback Response: ', post_data, "\n");
    html += "<b>Callback Response</b><br>";
    for(var x in post_data){
        html += x + " => " + post_data[x] + "<br/>";
    }
    html += "<br/><br/>";
    
    
    // verify the checksum
    var checksumhash = post_data.CHECKSUMHASH;
    // delete post_data.CHECKSUMHASH;
    var result = checksum.verifychecksum(post_data, PaytmConfig.key, checksumhash);
    console.log("Checksum Result => ", result, "\n");
    html += "<b>Checksum Result</b> => " + (result? "True" : "False");
    html += "<br/><br/>";
    
    
    
    // Send Server-to-Server request to verify Order Status
    var params = {"MID": PaytmConfig.mid, "ORDERID": post_data.ORDERID};
    
    checksum.genchecksum(params, PaytmConfig.key, function (err, checksum) {
        
        params.CHECKSUMHASH = checksum;
        post_data = 'JsonData='+JSON.stringify(params);
        
        var options = {
            hostname: 'securegw-stage.paytm.in', // for staging
            // hostname: 'securegw.paytm.in', // for production
            port: 443,
            path: '/merchant-status/getTxnStatus',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': post_data.length
            }
        };
        
        
        // Set up the request
        var response = "";
            var post_req = https.request(options, function(post_res) {
            post_res.on('data', function (chunk) {
                response += chunk;
            });
            
            post_res.on('end', function(){
                console.log('S2S Response: ', response, "\n");
                
                var _result = JSON.parse(response);
                html += "<b>Status Check Response</b><br>";
                for(var x in _result){
                    html += x + " => " + _result[x] + "<br/>";
                }
                
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(html);
                res.end();
            });
        });
        
        // post the data
        post_req.write(post_data);
        post_req.end();
    });
})

App.post('/test', (req, res) => {
    res.sendFile(path.join(__dirname + "/views/test.html"))
})

App.get('/test', (req, res) => {
    if (!session.views) {
        session.views = {}
    }
    console.log(session)
    var pathname = req.path
    session.views[pathname] = (session.views[pathname] || 0) + 1
    res.send('you viewed this page (' + pathname + ') ' + session.views[pathname] + ' times')
    // CLEAN
    // if (req.headers.origin == 'https://' + req.headers.host || req.headers.referer == "http://localhost:3000") {
    //     res.send("Origin set successfully!\n" + req.headers.origin)
    // } else {
    //     res.send("Origin not set!!")
    // }console.log(req.session)
})
App.get('/bar', (req, res) => {
    if (!req.session.views) {
        req.session.views = {}
    }
    console.log(req.session)
    var pathname = req.path
    req.session.views[pathname] = (req.session.views[pathname] || 0) + 1
    res.send('you viewed this page (' + pathname + ') ' + req.session.views[pathname] + ' times')
})

// PORT from environment variable for heroku deploy
App.listen(process.env.PORT || port)
