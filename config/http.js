  var passport = require('passport');
  var EvernoteStrategy = require('passport-evernote').Strategy;
  var TwitterStrategy = require('passport-twitter').Strategy;


  var evernote_options = {
      consumerKey: "onatbas-1382",
      consumerSecret: "3e1e40b10a4e5e8f",
      callbackURL: "http://localhost:1337/AuthSuccess"
  };

  var twitter_options = {
    consumerKey: 'IsESOra0DITmJM4cQQ95LD5ZC',
    consumerSecret: 'ROOPtVvjpsqbwa3HCPVy11arb677hdBhptjyPrOCVrTETRMwTz',
      callbackURL: "http://localhost:1337/AuthSuccess"
  };

var verifyHandler = function(token, tokenSecret, profile, done) {
  process.nextTick(function() {

    User.findOne({uid: profile.id}, function(err, user) {
      if (user) {
        return done(null, user);
      } else {

        var data = {
          provider: profile.provider,
          uid: profile.id,
          shard: profile.shard,
          token: token
        };

        User.create(data, function(err, user) {
          return done(err, user);
        });
      }
    });
  });
};

passport.serializeUser(function(user, done) {
  done(null, user.uid);
});

passport.deserializeUser(function(uid, done) {
  User.findOne({uid: uid}, function(err, user) {
    done(err, user);
  });
});


module.exports.http = {
  customMiddleware: function(app) {
    passport.use(new EvernoteStrategy(evernote_options, verifyHandler));
  //   passport.use(new TwitterStrategy(twitter_options, verifyHandler));
    app.use(passport.initialize());
    app.use(passport.session());
  }
};

