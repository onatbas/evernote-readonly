module.exports.routes = {
  '/': {
    view: 'homepage'
  },

  '/login': 'AuthController.login',
  '/logout': 'AuthController.logout',
  '/AuthSuccess': 'AuthController.success',

  'get /signup': {
    view: 'signup'
  }
};
