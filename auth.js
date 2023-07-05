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