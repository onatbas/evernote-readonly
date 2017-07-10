var passport = require('passport');
var EvernoteStrategy = require('passport-evernote').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var cfconfig = require('./env/cfconfig');
var schedule = require('./schedule');
var evernoteObject = require('./env/cfconfig.js').getEvernoteObject();

var evernote_options = {
  requestTokenURL: 'https://www.evernote.com/oauth',
  accessTokenURL: 'https://www.evernote.com/oauth',
  userAuthorizationURL: 'https://www.evernote.com/OAuth.action',
  consumerKey: evernoteObject.name,
  consumerSecret: evernoteObject.secret,
  callbackURL: cfconfig.getAppUri() + '/AuthSuccess'
};

var twitter_options = {
  consumerKey: 'IsESOra0DITmJM4cQQ95LD5ZC',
  consumerSecret: 'ROOPtVvjpsqbwa3HCPVy11arb677hdBhptjyPrOCVrTETRMwTz',
  callbackURL: cfconfig.getAppUri() + "/AuthSuccess"
};

var verifyHandler = function (token, tokenSecret, profile, done) {
  process.nextTick(function () {

    User.findOne({ uid: profile.id }, function (err, user) {
      if (user) {
        return done(null, user);
      } else {

        var data = {
          provider: profile.provider,
          uid: profile.id,
          shard: profile.shard,
          token: token
        };

        User.create(data, function (err, user) {
          checkUsersEverything(user);
          return done(err, user);
        });
      }
    });
  });
};

passport.serializeUser(function (user, done) {
  done(null, user.uid);
});

passport.deserializeUser(function (uid, done) {
  User.findOne({ uid: uid }, function (err, user) {
    done(err, user);
  });
});


module.exports.http = {
  customMiddleware: function (app) {
    passport.use(new EvernoteStrategy(evernote_options, verifyHandler));
    //   passport.use(new TwitterStrategy(twitter_options, verifyHandler));
    app.use(passport.initialize());
    app.use(passport.session());
  }
};

