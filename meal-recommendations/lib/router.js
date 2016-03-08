Router.route('/signup');
Router.route('/sync');
Router.route('/items');
Router.route('/meals');
Router.route('/list');
Router.route('/home');
Router.route('/recipes');

Router.route('/', function() {
	this.render('/home');
});
