    const express=require('express')
    const app=express()
    const server=require('http').Server(app)
    const io=require('socket.io')(server)
    const {v4:uuidV4}=require('uuid')
    const ExpressPeerServer =require('peer').ExpressPeerServer
    const peerServer=ExpressPeerServer(server,{
        debug: true
    })
    const session=require('express-session')
    const nodemailer=require('nodemailer')
    const mongoose=require('mongoose')
    const Meet=require('./models/meet')
    const bodyParser = require('body-parser')
    const passport=require('passport')
    const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
    const GOOGLE_CLIENT_ID='1635589717-obvmjqpokk6118ult5o0na8p0tihd3f1.apps.googleusercontent.com'
    const GOOGLE_CLIENT_SECRET='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'

    
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

    passport.serializeUser(function(user,done){
        done(null,user)
    });

    passport.deserializeUser(function(user,done){
        done(null,user)
    });

    function isLoggedIn(req,res,next){
        req.user?next():res.sendStatus(401)
    }

    var transport=nodemailer.createTransport({
        service:'gmail',
        auth:{
            user:'tejaskadre1455@gmail.com',
            pass:'jrluzsqyfqjnrjwv'
        }
    })

    app.use(session({secret:'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',resave:false,saveUninitialized:false}))
    app.use(passport.initialize())
    app.use(passport.session())
    app.set('view engine','ejs')
    app.use(express.static('public'))
    app.use('/peerjs',peerServer)
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get('/',(req,res)=>{
        res.redirect('/auth/google')
    })

    app.get('/auth/google',passport.authenticate('google',{scope:['email','profile']}))

    app.get('/google/callback',passport.authenticate('google',{successRedirect: '/home',failureRedirect: '/auth/failure'}))

    let globalname
    app.get('/home',isLoggedIn,(req,res)=>{
        globalname=req.user.displayName
        res.render('index',{named:req.user.displayName})
    })

    app.get('/auth/failure',(req,res)=>{
        res.send('Something went wrong. Try again!')
    })

    app.get('/meet',(req,res)=>{
        res.redirect(`/${uuidV4()}`)//uuidV4() function will give us a random dynamic url which will correspond to a new room everytime we load localhost:3000
    })

    app.get('/meeting',(req,res)=>{
        res.render('meeting')
    })

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
            res.render('success')
    });

    let attendeenames=new Map()

    io.on('connection',socket=>{
        socket.on('join-room',(roomID,userID,displayName)=>{
            attendeenames.set(userID,displayName)
            socket.join(roomID)//current socket (user) joins the room so anytime something happens in this room, we will send it to this socket (user) also
            socket.broadcast.to(roomID).emit('user-connected',userID)
            //send a message to the room that we're currently in. its a broadcast message (send it to everyone in this room apart from me)
            socket.on('message',(message,USERID)=>{
                const lol=attendeenames.get(USERID)
                io.to(roomID).emit('createMessage',message,lol)
            })
            socket.on('list',()=>{
                socket.emit('lists',Array.from(attendeenames.entries()))
            })
            socket.on('disconnect',()=>{
                attendeenames.delete(userID);
                socket.broadcast.to(roomID).emit('user-disconnected', userID);
            })
        })
    })

    app.get('/:room',(req,res)=>{
        res.render('room',{roomID:req.params.room})
    })

    server.listen(3000)
