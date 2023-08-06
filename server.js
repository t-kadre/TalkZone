    // Import required modules and libraries
    // Creating an express app and http server using that app
    const express=require('express')
    const app=express()
    const server=require('http').Server(app)
    const io=require('socket.io')(server)
    // Creating a socket.io server using http server object

    const {v4:uuidV4}=require('uuid')
    const session=require('express-session')
    const nodemailer=require('nodemailer')
    const mongoose=require('mongoose')
    const Meet=require('./models/meet')
    const bodyParser = require('body-parser')
    const passport=require('passport')
    const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

    // Google OAuth2 client credentials
    const GOOGLE_CLIENT_ID='1635589717-obvmjqpokk6118ult5o0na8p0tihd3f1.apps.googleusercontent.com'
    const GOOGLE_CLIENT_SECRET='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'

    // Configure Google OAuth2 strategy
    passport.use(new GoogleStrategy({
        clientID:     GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/google/callback",
        passReqToCallback   : true
    },
    function(request, accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
    ));

    // Initialize PeerJS and another http server for peer using PeerExpress app
    var ExpressPeerServer = require('peer').ExpressPeerServer;
    var peerExpress = require('express');
    var peerApp = peerExpress();
    var peerServer = require('http').createServer(peerApp);
    var options = { debug: true, allow_discovery: true };

    passport.serializeUser(function(user,done){
        done(null,user)
    });

    passport.deserializeUser(function(user,done){
        done(null,user)
    });

    // Middleware function to check if a user is logged in
    function isLoggedIn(req,res,next){
        req.user?next():res.sendStatus(401)
    }

    // Nodemailer transport for sending emails
    var transport=nodemailer.createTransport({
        service:'gmail',
        auth:{
            user:'tejaskadre1455@gmail.com',
            pass:'urkytggwmrmvcmcd'
        }
    })

    // Set up Express middleware
    app.use(session({secret:'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',resave:false,saveUninitialized:false}))
    app.use(passport.initialize())
    app.use(passport.session())
    app.set('view engine','ejs')
    app.use(express.static('public'))
    peerApp.use('/peerjs', ExpressPeerServer(peerServer, options));
    app.use(bodyParser.urlencoded({ extended: true }));

    // redirect to google authentication page when user tries to visit homepage
    app.get('/',(req,res)=>{
        res.redirect('/auth/google')
    })

    // Google OAuth2 authentication route
    app.get('/auth/google',passport.authenticate('google',{scope:['email','profile']}))

    // Google OAuth2 callback route 
    // If successful login then redirect to home page, else redirect to failure page
    app.get('/google/callback',passport.authenticate('google',{successRedirect: '/home',failureRedirect: '/auth/failure'}))

    // Global variable to store the user's display name
    let globalname
    // Home page route after successful authentication
    app.get('/home',isLoggedIn,(req,res)=>{
        globalname=req.user.displayName
        res.render('index',{named:req.user.displayName})
    })

    // Route for failed authentication
    app.get('/auth/failure',(req,res)=>{
        res.send('Something went wrong. Try again!')
    })

    // Route for creating a new video meeting room
    app.get('/meet',(req,res)=>{
        res.redirect(`/${uuidV4()}`)//uuidV4() function will give us a random dynamic url which will correspond to a new room everytime we load localhost:3000
    })

    // Route for loading the "schedule a meeting" page
    app.get('/meeting',(req,res)=>{
        res.render('meeting')
    })

    // Route for handling form submission and scheduling a meeting
    app.post('/done',async(req,res)=>{
            const { meetingDate, meetingTime, emailIds, agenda } = req.body;
            const scheduledDate = new Date(`${meetingDate} ${meetingTime}`);
            const meet = new Meet({
                meetingDate:scheduledDate.getDate().toLocaleString(),
                meetingTime:scheduledDate.getTime().toLocaleString(),
                emailIds:emailIds.split(','),
                agenda:agenda
            });
            const currentTime = new Date();
            const timeDifference = scheduledDate.getTime() - currentTime.getTime();
            const reminderTime = timeDifference - 15 * 60 * 1000;
            setTimeout(()=>{ 
                const emailSubject = 'Meeting Reminder';
                const emailText = `You have a meeting scheduled at ${scheduledDate}.\nAgenda: ${agenda}\nFrom:${globalname}`;
                meet.emailIds.forEach(emailId=>{
                    const mailOptions = {
                        from: 'tejaskadre1455@gmail.com',
                        to: emailId,
                        subject: emailSubject,
                        text: emailText
                    };
                    transport.sendMail(mailOptions,(error,info)=>{
                        if (error) {
                            console.log('Error sending email:', error);
                        } else {
                            console.log('Email sent:', info.response);
                        }
                    })
                })
            },reminderTime);
            // rendering the success page after scheduling the meeting 
            res.render('success')
    });

    // Arrays and Maps to manage participants in a room
    let attendeenames=new Map()
    let participant = [];
    let participantname = new Map();
    io.on('connection',socket=>{
        socket.on('join-room',(roomID,userID,displayName)=>{
            participant.push(socket.id)//socket.id is the unique id of the user created by socket.io

            participantname.set(socket.id,displayName);

            attendeenames.set(userID,displayName)//userID is the unique id of the user created by peer server

            socket.join(roomID)//current socket (user) joins the room so anytime something happens in this room, we will send it to this socket (user) also

            socket.broadcast.to(roomID).emit('user-connected',userID)
            //send a message to the room that we're currently in. its a broadcast message (send it to everyone in this room apart from me)

            // chat functionality
            socket.on('message',(message,USERID)=>{
                const mess=attendeenames.get(USERID)
                io.to(roomID).emit('createMessage',message,mess)
            })

            // List of participants in a room
            socket.on('list',()=>{
                socket.emit('lists',Array.from(attendeenames.entries()))
            })

            // Whiteboard functionality
            socket.on('start-whiteboard', () => {
                socket.broadcast.to(roomID).emit('start-whiteboard');
            })
    
            socket.on('draw', (x, y, color) => {
                io.to(roomID).emit('ondraw', x, y, color);
            })

            socket.on('erase', () => {
                io.to(roomID).emit('onerase');
            })

            // Disconnecting a user from a room
            socket.on('disconnect',()=>{
                let user = socket.id;
                let leavingParticipant=participant.indexOf(user)+1;
                socket.broadcast.to(roomID).emit('user-disconnected', leavingParticipant);
                displayName = participantname.get(user);
                participant.splice(participant.indexOf(user), 1);
                participantname.delete(user);
                attendeenames.delete(userID);
            })
        })
    })

    // Route for accessing a specific video meeting room
    app.get('/:room',(req,res)=>{
        res.render('room',{roomID:req.params.room})
    })

    peerServer.listen(9000);

    server.listen(3000)
