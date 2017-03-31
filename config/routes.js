module.exports.routes = {
  '/': {
    view: 'homepage'
  },

  '/success': {
    view : 'success'
  },

  '/direct/:id': 'AuthController.loginDirect',
  '/login': 'AuthController.login',
  '/logout': 'AuthController.logout',
  '/AuthSuccess': 'AuthController.success',
  '/notebooks': 'PostController.notebooks'
};
