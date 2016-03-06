Router.route('/signup');
Router.route('/sync');
Router.route('/items');
Router.route('/meals');
Router.route('/list');
Router.route('/home');

Router.route('/', function() {
	this.render('/home');
});
