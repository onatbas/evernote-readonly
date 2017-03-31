var passport = require('passport');

var authMethod = 'evernote';

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
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
            res.redirect('/');
        else {
            console.log('callback')
            passport.authenticate(authMethod, { successRedirect: '/', failureRedirect: '/login' })(req, res, next);
        }
    }
};
