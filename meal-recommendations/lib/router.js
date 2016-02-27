Router.route('/signup');
Router.route('/sync');
Router.route('/home');

Router.route('/', function() {
	this.render('/home');
});
