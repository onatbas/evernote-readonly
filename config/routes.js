module.exports.routes = {
  '/': {
    view: 'homepage'
  },

  '/direct/:id': 'AuthController.loginDirect',
  '/login': 'AuthController.login',
  '/logout': 'AuthController.logout',
  '/AuthSuccess': 'AuthController.success',

  'get /signup': {
    view: 'signup'
  },

  '/notebooks': 'PostController.notebooks'
};
