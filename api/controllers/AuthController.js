var passport = require('passport');

var authMethod = 'evernote';

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    loginDirect: function(req, res){
        User.findOne({ uid: req.params.id}).then(function(user){
            req.login(user, function (err){
            if (err) return res.redirect('/login');
            return res.redirect('/notebooks');
            });
        });
    },

    login: function (req, res, next) {
        if (req.isAuthenticated())
            res.redirect('/');
        else
            passport.authenticate(authMethod)(req, res, next);
    },

    logout: function (req, res) {
        req.logout();
        res.redirect('/');
    },

    success: function (req, res, next) {
        if (req.isAuthenticated())
            res.redirect('/success');
        else {
            passport.authenticate(authMethod, { successRedirect: '/success', failureRedirect: '/' })(req, res, next);
        }
    }
};
