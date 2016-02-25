Router.route('/signup');
Router.route('/sync');
Router.route('/items');
Router.route('/meals');
Router.route('/list');

Router.route('/', function() {
	this.render('items');
});
