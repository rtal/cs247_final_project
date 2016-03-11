datafiles = ["/json/vegan.json"/*, "/json/omnivore.json", "/json/vegetarian.json"*/];
var menufile = datafiles[Math.floor(Math.random() * datafiles.length)];

var recipesList = new Array();
var ingredientsInPossessionList = new Array();
var recipes = {};
var ingredientsInPossession = {};
var ingredientsNeeded = {};

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

function parseData(recipeArray, ingredientsArray) {
	// parse recipes
	for (var i = 0; i < recipeArray.length; i++) {
		var currentRecipe = recipeArray[i];
		recipes[currentRecipe["name"]] = {};
		var tempIngredients = currentRecipe["ingredients"];
		for (var j = 0; j < tempIngredients.length; j++) {
			var currentIngredient = tempIngredients[j];
			recipes[currentRecipe["name"]][currentIngredient["name"]] = {"quantity": currentIngredient["quantity"], "img": currentIngredient["img"]};
		}
	}
	// parse ingredients in possession
	for (var i = 0; i < ingredientsArray.length; i++) {
		var currentCategory = ingredientsArray[i];
		var tempIngredients = currentCategory["items"];
		for (var j = 0; j < tempIngredients.length; j++) {
			var currentIngredient = tempIngredients[j];
			ingredientsInPossession[currentIngredient["name"]] = currentIngredient["quantity"];
		}
	}

	return [recipes, ingredientsInPossession];
}

function recipeSelected (desiredRecipe, ingredientsNeeded) {
	var serving_size = Session.get("serving_size");
	for (var ingredient in recipes[desiredRecipe]) {
		var quantityNeeded = recipes[desiredRecipe][ingredient]["quantity"]*serving_size;
		if (ingredient in ingredientsNeeded) {
			ingredientsNeeded[ingredient]["quantity"] += quantityNeeded;
		} else {
			ingredientsNeeded[ingredient] = {};
			ingredientsNeeded[ingredient]["recipes"] = [];
			ingredientsNeeded[ingredient]["quantity"] = quantityNeeded;
		}
		ingredientsNeeded[ingredient]["recipes"].push(desiredRecipe);
		ingredientsNeeded[ingredient]["img"] = recipes[desiredRecipe][ingredient]["img"];
	}
}

function finalizeShoppingList (ingredientsInPossession, ingredientsNeeded) {
	var shoppingList = {};
	for (var ingredient in ingredientsNeeded) {
		var difference = ingredientsNeeded[ingredient]["quantity"];
		if (ingredient in ingredientsInPossession) {
			difference -= ingredientsInPossession[ingredient];
		}
		if (difference > 0) {
			shoppingList[ingredient] = {};
			shoppingList[ingredient]["recipes"] = [];
			shoppingList[ingredient]["quantity"] = Math.ceil(difference);
			shoppingList[ingredient]["img"] = ingredientsNeeded[ingredient]["img"];
			var associatedRecipes = ingredientsNeeded[ingredient]["recipes"]
			for (var i = 0; i < associatedRecipes.length; i++) {
				var recipe = associatedRecipes[i];
				if (shoppingList[ingredient]["recipes"].indexOf(recipe) < 0) {
					shoppingList[ingredient]["recipes"].push(recipe);
				}
			}
		}
	}
	return shoppingList;
}

function recipeUnselected (unselectedRecipe, ingredientsNeeded) {
	var serving_size = Session.get("serving_size");
	for (var ingredient in recipes[unselectedRecipe]) {
		ingredientsNeeded[ingredient]["quantity"] -= recipes[unselectedRecipe][ingredient]["quantity"]*serving_size;
		if (ingredientsNeeded[ingredient]["quantity"] < 0) {
			ingredientsNeeded[ingredient]["quantity"] = 0;
		}
		var recipesWanted = ingredientsNeeded[ingredient]["recipes"];
		var index = recipesWanted.indexOf(unselectedRecipe);
		if (index >= 0) {
			recipesWanted.splice(index, 1);
		}
	}
}

function resetShoppingList() {
	var shoppingList = finalizeShoppingList(ingredientsInPossession, ingredientsNeeded);
	var newIngredients = []
	for (var ingredient in shoppingList) {
		newIngredients.push({"name": ingredient, 
							 "quantity": shoppingList[ingredient]["quantity"], 
							 "img": shoppingList[ingredient]["img"],
							 "recipes": shoppingList[ingredient]["recipes"]});
	}
	Session.set("newIngredients", newIngredients);
}

results = openRecipeFile(menufile);
recipesList = results[0];
ingredientsInPossessionList = results[1];
parsedResults = parseData(recipesList, ingredientsInPossessionList);
recipes = parsedResults[0];
ingredientsInPossession = parsedResults[1];
Session.set("newIngredients", []);
Session.set("mealsShowing", []);

Session.set("serving_size", 1);
Session.set("selected_index", 0);
Session.set("num_selected", 0);
Session.set("recipes_showing", recipesList);

details_extracted_id = null;

selected_recipe_card_width = null;
selected_recipe_card_height = null;
recipe_card_width = null;
recipe_card_height = null;

window_width = $(window).width();
//window_width = window.orientation == 0 ? window.screen.width: window.screen.height;

Template.recipes.rendered = function() {

	selected_recipe_card_width = window_width * 0.75;
	selected_recipe_card_height = selected_recipe_card_width + 50;
	recipe_card_width = selected_recipe_card_height * 0.75;
	recipe_card_height = recipe_card_width + 50;

	$('.recipe-card.selected').css('width', selected_recipe_card_width);
	$('.recipe-card.selected').css('height', selected_recipe_card_height);
	$('.recipe-card:not(.selected)').css('width', recipe_card_width);
	$('.recipe-card:not(.selected)').css('height', recipe_card_height);

	var z = 1000;//parseInt(next_card.css('z-index'), 10);
	var curr_z = z - 1;
	$('.recipe-card.selected').parent().nextAll().each(function() {
		console.log(curr_z);
		$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
		curr_z--;
	});
	curr_z = z - 1;
	$('.recipe-card.selected').parent().prevAll().each(function() {
		$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
		curr_z--;
	});

	$('.recipe-cards').css('padding-left', ((window_width - selected_recipe_card_width) / 2)).css('min-height', selected_recipe_card_height);
};

Template.recipes.helpers({

	recipes_gestures: {
		"tap .recipe-card.selected.details .recipe-name > i.ion-chevron-left": function(e, t) {
			// $(e.target).closest('.recipe-card.selected.details').removeClass('details').css('width','');
			// $(e.target).parents('.recipe-cards').css('overflow', '').css('padding', '');
			$('.recipe-cards').css('overflow', '');
			var details = $(e.target).closest('.recipe-card.selected.details').removeClass('details').detach();
			details.css('z-index', '1000').css('width', selected_recipe_card_width).css('height', selected_recipe_card_height);
			console.log(details_extracted_id);
			details.appendTo('.recipe-cards > #' + details_extracted_id);
		},

		"tap .scroll > .scroll-right > i": function(e, t) {
			var curr_card = $('.recipe-cards').find('.recipe-card.selected:not(.details)');
			var next_card = curr_card.parent().nextAll().find('.recipe-card:not(selected)');
			if (next_card.length) {
				next_card = $(next_card.get(0));
				curr_card.removeClass('selected');
				next_card.addClass('selected');
				curr_card.css('width', recipe_card_width);
				curr_card.css('height', recipe_card_height);
				curr_card.css('z-index', '');
				next_card.css('width', selected_recipe_card_width);
				next_card.css('height', selected_recipe_card_height);
				next_card.css('z-index', '');
				var z = 1000;//parseInt(next_card.css('z-index'), 10);
				var curr_z = z - 1;
				next_card.parent().nextAll().each(function() {
					console.log(curr_z);
					$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
					curr_z--;
				});
				curr_z = z - 1;
				next_card.parent().prevAll().each(function() {
					$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
					curr_z--;
				});

				$('.recipe-cards').animate({
					left: "-" + (next_card.position().left - (selected_recipe_card_width - recipe_card_width) - ((window_width - selected_recipe_card_width) / 2))
				}, 500);
			}
		},

		"tap .scroll > .scroll-left > i": function(e, t) {
			var curr_card = $('.recipe-cards').find('.recipe-card.selected:not(.details)');
			var next_card = curr_card.parent().prevAll().find('.recipe-card:not(selected)');
			if (next_card.length) {
				next_card = $(next_card.get(-1));
				curr_card.removeClass('selected');
				next_card.addClass('selected');
				curr_card.css('width', recipe_card_width);
				curr_card.css('height', recipe_card_height);
				curr_card.css('z-index', '');
				next_card.css('width', selected_recipe_card_width);
				next_card.css('height', selected_recipe_card_height);
				next_card.css('z-index', '');
				var z = 1000;//parseInt(next_card.css('z-index'), 10);
				var curr_z = z - 1;
				next_card.parent().nextAll().each(function() {
					console.log(curr_z);
					$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
					curr_z--;
				});
				curr_z = z - 1;
				next_card.parent().prevAll().each(function() {
					$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
					curr_z--;
				});
				$('.recipe-cards').animate({
					left: "-" + (next_card.position().left - ((window_width - selected_recipe_card_width) / 2))
				}, 500);
			}
		},

		"tap .recipe-card.selected .recipe-choice > .add-recipe": function(e, t) {
			// var num_selected = parseInt(Session.get("num_selected"), 10) + 1;
			// Session.set("num_selected", num_selected);
			var curr_card = $(e.target).closest('.recipe-card.selected');
			var next_card = $('#' + details_extracted_id).nextAll().find('.recipe-card:not(.selected)');
			var select_right = true;
			if (!next_card.length) {
				next_card = $('#' + details_extracted_id).prevAll().find('.recipe-card:not(.selected)');
				next_card = $(next_card.get(-1));
				select_right = false;
			} else {
				next_card = $(next_card.get(0));
			}

			// curr_card.css('z-index', '').css('width', '').css('height', '');
			$('.recipe-cards').css('overflow', '');
			curr_card.removeClass('selected details').addClass('thumbnail');
			curr_card.detach();
			curr_card.appendTo('#recipe-footer > .chosen-recipes');

			$('#recipe-footer > .chosen-recipes > div.select-recipe-message').hide();

			var recipe_name = curr_card.find('div.recipe-name > span').text();
			recipeSelected(recipe_name, ingredientsNeeded);
			resetShoppingList();

			if (next_card.length) {
				var left_val = "-" + (next_card.position().left - (selected_recipe_card_width - recipe_card_width) - ((window_width - selected_recipe_card_width) / 2))
				if (select_right) {
					left_val = "-" + (next_card.position().left - ((window_width - selected_recipe_card_width) / 2))
				}
				next_card.addClass('selected');
				next_card.css('width', selected_recipe_card_width);
				next_card.css('height', selected_recipe_card_height);
				next_card.css('z-index', '');
				var z = 1000;//parseInt(next_card.css('z-index'), 10);
				var curr_z = z - 1;
				next_card.parent().nextAll().each(function() {
					console.log(curr_z);
					$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
					curr_z--;
				});
				curr_z = z - 1;
				next_card.parent().prevAll().each(function() {
					$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
					curr_z--;
				});
				$('.recipe-cards').animate({
					left: left_val
				}, 500);
			}
		},

		"tap .recipe-card.selected .recipe-choice > .discard-recipe": function(e, t) {
			var curr_card = $(e.target).closest('.recipe-card.selected');
			var next_card = $('#' + details_extracted_id).nextAll().find('.recipe-card:not(.selected)');
			var select_right = true;
			if (!next_card.length) {
				next_card = $('#' + details_extracted_id).prevAll().find('.recipe-card:not(.selected)');
				next_card = $(next_card.get(-1));
				select_right = false;
			} else {
				next_card = $(next_card.get(0));
			}

			curr_card.fadeOut(400, function() {
				curr_card.removeClass('selected recipe-card');
				$('.recipe-cards').css('overflow', '');
				if (next_card.length) {
					var left_val = "-" + (next_card.position().left - (selected_recipe_card_width - recipe_card_width) - ((window_width - selected_recipe_card_width) / 2))
					if (select_right) {
						left_val = "-" + (next_card.position().left - ((window_width - selected_recipe_card_width) / 2))
					}
					next_card.addClass('selected');
					next_card.css('width', selected_recipe_card_width);
					next_card.css('height', selected_recipe_card_height);
					next_card.css('z-index', '');
					var z = 1000;//parseInt(next_card.css('z-index'), 10);
					var curr_z = z - 1;
					next_card.parent().nextAll().each(function() {
						console.log(curr_z);
						$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
						curr_z--;
					});
					curr_z = z - 1;
					next_card.parent().prevAll().each(function() {
						$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
						curr_z--;
					});
					$('.recipe-cards').animate({
						left: left_val
					}, 500);
				}
			});
		}
	},

	recipes: function() {
		return Session.get("recipes_showing");
	},

	servingSize: function() {
		return Session.get("serving_size");
	}
});

Template.recipes.events({
	// "click .recipe-card.selected.details .recipe-name > i.ion-chevron-left": function(e, t) {
	// 	// $(e.target).closest('.recipe-card.selected.details').removeClass('details').css('width','');
	// 	// $(e.target).parents('.recipe-cards').css('overflow', '').css('padding', '');
	// 	$('.recipe-cards').css('overflow', '');
	// 	var details = $(e.target).closest('.recipe-card.selected.details').removeClass('details').detach();
	// 	details.css('z-index', '1000').css('width', selected_recipe_card_width).css('height', selected_recipe_card_height);
	// 	console.log(details_extracted_id);
	// 	details.appendTo('.recipe-cards > #' + details_extracted_id);
	// },

	// "click .scroll > .scroll-right > i": function(e, t) {
	// 	var curr_card = $('.recipe-cards').find('.recipe-card.selected:not(.details)');
	// 	var next_card = curr_card.parent().next().find('.recipe-card:not(selected)');
	// 	if (next_card.length) {
	// 		curr_card.removeClass('selected');
	// 		next_card.addClass('selected');
	// 		curr_card.css('width', recipe_card_width);
	// 		curr_card.css('height', recipe_card_height);
	// 		curr_card.css('z-index', '');
	// 		next_card.css('width', selected_recipe_card_width);
	// 		next_card.css('height', selected_recipe_card_height);
	// 		next_card.css('z-index', '');
	// 		var z = 1000;//parseInt(next_card.css('z-index'), 10);
	// 		var curr_z = z - 1;
	// 		next_card.parent().nextAll().each(function() {
	// 			console.log(curr_z);
	// 			$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
	// 			curr_z--;
	// 		});
	// 		curr_z = z - 1;
	// 		next_card.parent().prevAll().each(function() {
	// 			$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
	// 			curr_z--;
	// 		});

	// 		$('.recipe-cards').animate({
	// 			left: "-" + (next_card.position().left - (selected_recipe_card_width - recipe_card_width) - ((window_width - selected_recipe_card_width) / 2))
	// 		}, 500);
	// 	}
	// },

	// "click .scroll > .scroll-left > i": function(e, t) {
	// 	var curr_card = $('.recipe-cards').find('.recipe-card.selected:not(.details)');
	// 	var next_card = curr_card.parent().prev().find('.recipe-card:not(selected)');
	// 	if (next_card.length) {
	// 		curr_card.removeClass('selected');
	// 		next_card.addClass('selected');
	// 		curr_card.css('width', recipe_card_width);
	// 		curr_card.css('height', recipe_card_height);
	// 		curr_card.css('z-index', '');
	// 		next_card.css('width', selected_recipe_card_width);
	// 		next_card.css('height', selected_recipe_card_height);
	// 		next_card.css('z-index', '');
	// 		var z = 1000;//parseInt(next_card.css('z-index'), 10);
	// 		var curr_z = z - 1;
	// 		next_card.parent().nextAll().each(function() {
	// 			console.log(curr_z);
	// 			$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
	// 			curr_z--;
	// 		});
	// 		curr_z = z - 1;
	// 		next_card.parent().prevAll().each(function() {
	// 			$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
	// 			curr_z--;
	// 		});
	// 		$('.recipe-cards').animate({
	// 			left: "-" + (next_card.position().left - 50 - ((window_width - selected_recipe_card_width) / 2))
	// 		}, 500);
	// 	}
	// }
	'input div#serving-size > input': function(e, t) {
		Session.set("serving_size", parseInt(e.currentTarget.value, 10));
		// setNumIngredients();
	}
});

Template.recipe_card.helpers({

	recipe_card_gestures: {

		"tap .recipe-card.selected .recipe-choice > .add-recipe": function(e, t) {
			// var num_selected = parseInt(Session.get("num_selected"), 10) + 1;
			// Session.set("num_selected", num_selected);
			var curr_card = $(e.target).closest('.recipe-card.selected');
			var next_card = curr_card.parent().nextAll().find('.recipe-card:not(.selected)');
			var select_right = true;
			if (!next_card.length) {
				next_card = curr_card.parent().prevAll().find('.recipe-card:not(.selected)');
				next_card = $(next_card.get(-1));
				select_right = false;
			} else {
				next_card = $(next_card.get(0));
			}

			curr_card.css('z-index', '').css('width', '').css('height', '');
			curr_card.removeClass('selected').addClass('thumbnail');
			curr_card.detach();
			curr_card.appendTo('#recipe-footer > .chosen-recipes');

			$('#recipe-footer > .chosen-recipes > div.select-recipe-message').hide();

			var recipe_name = curr_card.find('div.recipe-name > span').text();
			recipeSelected(recipe_name, ingredientsNeeded);
			resetShoppingList();

			if (next_card.length) {
				var left_val = "-" + (next_card.position().left - (selected_recipe_card_width - recipe_card_width) - ((window_width - selected_recipe_card_width) / 2))
				if (select_right) {
					left_val = "-" + (next_card.position().left - ((window_width - selected_recipe_card_width) / 2))
				}
				next_card.addClass('selected');
				next_card.css('width', selected_recipe_card_width);
				next_card.css('height', selected_recipe_card_height);
				next_card.css('z-index', '');
				var z = 1000;//parseInt(next_card.css('z-index'), 10);
				var curr_z = z - 1;
				next_card.parent().nextAll().each(function() {
					console.log(curr_z);
					$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
					curr_z--;
				});
				curr_z = z - 1;
				next_card.parent().prevAll().each(function() {
					$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
					curr_z--;
				});
				$('.recipe-cards').animate({
					left: left_val
				}, 500);
			}
		},

		"tap .recipe-card.selected .recipe-choice > .discard-recipe": function(e, t) {
			var curr_card = $(e.target).closest('.recipe-card.selected');
			var next_card = curr_card.parent().nextAll().find('.recipe-card:not(.selected)');
			var select_right = true;
			if (!next_card.length) {
				next_card = curr_card.parent().prevAll().find('.recipe-card:not(.selected)');
				next_card = $(next_card.get(-1));
				select_right = false;
			} else {
				next_card = $(next_card.get(0));
			}

			curr_card.fadeOut(400, function() {
				curr_card.removeClass('selected recipe-card');
				if (next_card.length) {
					var left_val = "-" + (next_card.position().left - (selected_recipe_card_width - recipe_card_width) - ((window_width - selected_recipe_card_width) / 2))
					if (select_right) {
						left_val = "-" + (next_card.position().left - ((window_width - selected_recipe_card_width) / 2))
					}
					next_card.addClass('selected');
					next_card.css('width', selected_recipe_card_width);
					next_card.css('height', selected_recipe_card_height);
					next_card.css('z-index', '');
					var z = 1000;//parseInt(next_card.css('z-index'), 10);
					var curr_z = z - 1;
					next_card.parent().nextAll().each(function() {
						console.log(curr_z);
						$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
						curr_z--;
					});
					curr_z = z - 1;
					next_card.parent().prevAll().each(function() {
						$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
						curr_z--;
					});
					$('.recipe-cards').animate({
						left: left_val
					}, 500);
				}
			});
		},

		"tap .recipe-card.selected:not(.details)": function(e, t) {
			var other_event = $(e.target).closest('div.add-recipe, div.discard-recipe');
			if (!other_event.length) {
				var w = window_width;
				// $(e.target).closest('.recipe-card.selected:not(.details)').addClass('details').css('width',w);
				$(e.target).parents('.recipe-cards').css('overflow', 'hidden');
				var details = $(e.target).closest('.recipe-card.selected:not(.details)');
				details.css('z-index', '').css('width', '').css('height', '');
				details_extracted_id = details.parent().attr('id');
				details = details.detach();
				details.appendTo('.fluid-container').addClass('details');
			}
		},

		"tap .recipe-card:not(.selected)": function(e, t) {
			var other_event = $(e.target).closest('div.add-recipe, div.discard-recipe');
			if (!other_event.length) {
				var next_card = $(e.target).closest('.recipe-card:not(selected)');
				var curr_card = next_card.parents('.recipe-cards').find('.recipe-card.selected:not(.details)');
				if (next_card.length){
					curr_card.removeClass('selected');
					next_card.addClass('selected');
					$('.recipe-cards').animate({
						left: "-" + (next_card.position().left - ((window_width - 250) / 2))
					}, 500);
				}
			}
		},

		"swipeleft .recipe-card.selected:not(.details)": function(e,t) {
			var curr_card = $(e.target).closest('.recipe-card.selected:not(.details)');
			var next_card = curr_card.parent().nextAll().find('.recipe-card:not(.selected)');
			if (next_card.length) {
				next_card = $(next_card.get(0));
				curr_card.removeClass('selected');
				next_card.addClass('selected');
				curr_card.css('width', recipe_card_width);
				curr_card.css('height', recipe_card_height);
				curr_card.css('z-index', '');
				next_card.css('width', selected_recipe_card_width);
				next_card.css('height', selected_recipe_card_height);
				next_card.css('z-index', '');
				var z = 1000;//parseInt(next_card.css('z-index'), 10);
				var curr_z = z - 1;
				next_card.parent().nextAll().each(function() {
					console.log(curr_z);
					$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
					curr_z--;
				});
				curr_z = z - 1;
				next_card.parent().prevAll().each(function() {
					$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
					curr_z--;
				});

				$('.recipe-cards').animate({
					left: "-" + (next_card.position().left - (selected_recipe_card_width - recipe_card_width) - ((window_width - selected_recipe_card_width) / 2))
				}, 500);
			}
		},

		"swiperight .recipe-card.selected:not(.details)": function(e,t) {
			var curr_card = $(e.target).closest('.recipe-card.selected:not(.details)');
			var next_card = curr_card.parent().prevAll().find('.recipe-card:not(.selected)');
			if (next_card.length) {
				next_card = $(next_card.get(-1));
				curr_card.removeClass('selected');
				next_card.addClass('selected');
				curr_card.css('width', recipe_card_width);
				curr_card.css('height', recipe_card_height);
				curr_card.css('z-index', '');
				next_card.css('width', selected_recipe_card_width);
				next_card.css('height', selected_recipe_card_height);
				next_card.css('z-index', '');
				var z = 1000;//parseInt(next_card.css('z-index'), 10);
				var curr_z = z - 1;
				next_card.parent().nextAll().each(function() {
					console.log(curr_z);
					$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
					curr_z--;
				});
				curr_z = z - 1;
				next_card.parent().prevAll().each(function() {
					$(this).find('.recipe-card:not(.selected)').css('z-index', curr_z);
					curr_z--;
				});
				$('.recipe-cards').animate({
					left: "-" + (next_card.position().left - ((window_width - selected_recipe_card_width) / 2))
				}, 500);
			}
		}

		// "tap .recipe-card.selected.details .recipe-name > i.ion-chevron-left": function(e, t) {
		// 	// $(e.target).closest('.recipe-card.selected.details').removeClass('details').css('width','');
		// 	// $(e.target).parents('.recipe-cards').css('overflow', '').css('padding', '');
		// 	var details = $(e.target).closest('.recipe-card.selected.details').removeClass('details').detach();
		// 	console.log(details_extracted_id);
		// 	details.appendTo('.recipe-cards > #' + details_extracted_id);
		// },
	},

	is_selected: function(index) {
		return index == Session.get("selected_index");
	},

	numIngredientsNeeded: function(recipeName) {
		var num = 0;
		var recipeIngredients = recipes[recipeName];
		var serving_size = Session.get("serving_size");
		
		for (var ingredient in recipeIngredients) {
			ingredientName = ingredient["name"];
			if (!(ingredient in ingredientsInPossession) || ingredientsInPossession[ingredient] < recipeIngredients[ingredient]["quantity"]*serving_size) {
				num++;
			}
		}
		return num;
	}
});

Template.recipe_footer.helpers({
	
	recipe_footer_gestures: {
		"tap .recipe-card.thumbnail": function(e, t) {
			// console.log($(e.target).closest('.recipe-card.thumbnail'));
			// var ind = ($(e.target).closest('.recipe-card.thumbnail').attr('id')).split('-')[1];
			// Session.set("selected_index", ind);
			$(e.target).closest('.recipe-card.thumbnail').addClass('tapped');
		},

		"tap .recipe-card.thumbnail.tapped > .overlay": function(e, t) {
			var curr_card = $(e.target).closest('.recipe-card.thumbnail.tapped');
			curr_card.fadeOut();

			var recipe_name = curr_card.find('div.recipe-name > span').text();
			recipeUnselected(recipe_name, ingredientsNeeded);
			resetShoppingList();
		}
	}

	// is_selected: function(index) {
	// 	return index == Session.get("selected_index");
	// }
});

Template.recipe_header.helpers({
	num_selected: function() {
		return Session.get("num_selected");
	}
});

Template.list.helpers({
	ingredients: function() {
		return Session.get("newIngredients");
	}
});


Template.category.events({
	"click .collapseable": function(event) {
		console.log($(event.currentTarget).find(".chevron_toggleable"));
		$(event.currentTarget).find(".chevron_toggleable").toggleClass('ion-chevron-down ion-chevron-up');
	}
});

Template.recipe_info.helpers({
	inPossession: function(name, quantity) {
		var serving_size = Session.get("serving_size");
		if (name in ingredientsInPossession) {
			if (ingredientsInPossession[name] >= quantity*serving_size) {
				return true;
			}
		}
		return false;
	}
});

