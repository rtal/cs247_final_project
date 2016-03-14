Router.route('/signup');
Router.route('/sync');
Router.route('/items');
Router.route('/meals');
Router.route('/list');
Router.route('/home');
Router.route('/home2');
Router.route('/recipes');

Router.route('/', function() {
	this.render('/recipes');
});

Router.route('/mealsList', function() {
	this.render('meals_list');
});

Router.route('/selectedRecipes', function() {
	this.render('selected_recipes');
});