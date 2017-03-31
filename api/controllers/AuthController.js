var passport = require('passport');

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    login: function (req, res) {
        passport.authenticate('twitter', { failureRedirect: '/login' }, function(err, user){
            req.logIn(user, function(err) {
                if (err) {
                    console.log(err);
                    res.view('500');
                    return;
                }

                res.redirect('/');
                return;
            });
        })(req, res);
    },

    logout: function (req, res) {
        req.logout();
        res.redirect('/');
    },

    success: function (req, res) {
        res.redirect('/');
    }
};
