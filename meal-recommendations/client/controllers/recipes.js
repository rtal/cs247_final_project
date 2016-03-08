datafiles = ["/json/vegan.json"/*, "/json/omnivore.json", "/json/vegetarian.json"*/];
var menufile = datafiles[Math.floor(Math.random() * datafiles.length)];

var recipesList = new Array();
var ingredientsInPossessionList = new Array();

function openRecipeFile(filename) {
	var recipes = new Array();
	var ingredientsInPossession = new Array();

	$.ajax({
		url: filename,
		async: false,
		dataType: 'json',
		success: function(json) {
			ingredientsInPossession = json["ingredients_in_possession"]
			recipes = json["recipes"]
		}
	});

	return [eval(recipes), eval(ingredientsInPossession)];
}

results = openRecipeFile(menufile);
recipesList = results[0];
ingredientsInPossessionList = results[1];

num_recipes = 5;
// selected_index = 0;
Session.set("selected_index", 0);
Session.set("num_selected", 0);
Session.set("recipes_showing", recipesList.slice(0, num_recipes));

Template.recipes.helpers({
	recipes: function() {
		return Session.get("recipes_showing");
	}
});

Template.recipe_card.helpers({

	recipe_card_gestures: {
		"tap .recipe-card.selected:not(.details)": function(e, t) {
			console.log($(e.target).closest('.recipe-card.selected:not(.details)'));
			$(e.target).closest('.recipe-card.selected:not(.details)').addClass('details');
		},

		"tap .recipe-card.selected.details .recipe-name > i.ion-chevron-left": function(e, t) {
			$(e.target).closest('.recipe-card.selected.details').removeClass('details');
		},

		"tap .recipe-card.selected .recipe-choice > .add-recipe": function(e, t) {
			var num_selected = Session.get("num_selected");
			Session.set("num_selected", num_selected++);
		}
	},

	is_selected: function(index) {
		return index == Session.get("selected_index");
	}
});

Template.recipe_footer.helpers({
	
	recipe_footer_gestures: {
		"tap .recipe-selector": function(e, t) {
			console.log($(e.target).closest('.recipe-selector'));
			var ind = ($(e.target).closest('.recipe-selector').attr('id')).split('-')[1];
			Session.set("selected_index", ind);
		},

		"tap .recipe-card.selected.details .recipe-name > i.ion-chevron-left": function(e, t) {
			$(e.target).closest('.recipe-card.selected.details').removeClass('details');
		}
	},

	is_selected: function(index) {
		return index == Session.get("selected_index");
	}
});

Template.recipe_header.helpers({
	num_selected: function() {
		return Session.get("num_selected");
	}
});

