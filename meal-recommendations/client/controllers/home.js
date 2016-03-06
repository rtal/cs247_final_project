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
	for (var ingredient in recipes[desiredRecipe]) {
		var quantityNeeded = recipes[desiredRecipe][ingredient]["quantity"];
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
			shoppingList[ingredient]["quantity"] = difference;
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
	console.log(unselectedRecipe);
	for (var ingredient in recipes[unselectedRecipe]) {
		ingredientsNeeded[ingredient]["quantity"] -= recipes[unselectedRecipe][ingredient]["quantity"];
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

results = openRecipeFile(menufile);
recipesList = results[0]
ingredientsInPossessionList = results[1];
parsedResults = parseData(recipesList, ingredientsInPossessionList);
recipes = parsedResults[0];
ingredientsInPossession = parsedResults[1];
Session.set("newIngredients", []);
Session.set("mealsShowing", []);

var grid = Math.random() < .5;

var numMeals = 3;
var currNumMeals = 0;
var offset = 0;

Template.home.helpers({
	showGrid: function() {
		return true;
		// return grid;
	}
});

Template.home.events({
	"click, touchstart #add-num-meals": function(event) {
		var input = $(event.currentTarget).siblings("input#num-meals");
		var curr_num_meals = input.val();
		input.val(parseInt(curr_num_meals, 10) + 1);

	},
	"click, touchstart #remove-num-meals": function(event) {
		var input = $(event.currentTarget).siblings("input#num-meals");
		var curr_num_meals = input.val();
		input.val(parseInt(curr_num_meals, 10) - 1);
	},
	"click #footer > a": function(event) {
		var input_value = $(event.currentTarget).parent().siblings("div:not(#footer-space)").find("input#num-meals").val()
		numMeals = parseInt(input_value, 10);
		Session.set("mealsShowing", recipesList.slice(offset, offset+numMeals+2));
	}
})

Template.items.helpers({
	categories: function() {
		return ingredientsInPossessionList;
	}
});

// Template.category.helpers({
//  isItems: function(type) {
//      if (type == "items") {
//          return true;
//      }

//      return false;
//  }
// });

Template.category.events({
	"click .chevron_toggleable": function(event) {
		$(event.currentTarget).toggleClass('ion-chevron-down ion-chevron-up');
	}
});

Template.item.helpers({
	quantityCeiling: function(quantity) {
		return Math.ceil(quantity);
	},
	quantityPercentage: function(quantity) {
		return (quantity / Math.ceil(quantity)) * 100;
	}
});

Template.meals_list.helpers({
	meals: function() {
		return recipesList;
	}
});

Template.meals.helpers({
	meals: function() {
		return Session.get("mealsShowing");
		// return recipesList;
	}

	// hidingRecipe: function(index) {
	//  if (index+offset >= (numMeals+2)){
	//      return true;
	//  }
	//  return false;
	// }
});

Template.meals.events({
	"click button#regenerate": function(event) {
		offset += numMeals+2;
		Session.set('mealsShowing', recipesList.slice(offset, offset+numMeals+2));
	}
});

function showDialog(jquery_target) {
	var visible_dialog = $(".dialog:not(.hide)");
	if (visible_dialog.length) {
		visible_dialog.addClass("hide");
		$('body').css({ overflow: 'inherit'});
	} else {
		var dialog = jquery_target.next(".dialog");
		dialog.removeClass("hide");
		$('body').css({ overflow: 'hidden'});
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
	console.log(newIngredients);
}

function incrementMealCount() {
	currNumMeals++;
	if (currNumMeals >= numMeals) {
		Router.go('/list');
	}
}

var DELAY = 400;
var clicks = 0;
var timer = null;

// $('div.meal-grid').hammer({
// 	drag_min_distance:1,
// 	swipe_velocity:0.1
// 	prevent_default:true
// });

Template.meal_grid.helpers({

	meal_grid_gestures:{
		'tap div.meal-grid': function (event, templateInstance) {
			clicks++;
			if(clicks === 1) {
				timer = setTimeout(function() {
					showDialog($(event.target).closest('div.meal-grid'));
					clicks = 0;
				}, DELAY);

			} else {
				clearTimeout(timer);
				clicks = 0;
			}
	 	},

		'doubletap div.meal-grid': function (event, templateInstance) {
			var target = $(event.target).closest('div.meal-grid');
			var meal_index = (target.attr('id')).split("-")[1];
			var meal = target.find('div#recipe-name > span').text();
			recipeSelected(meal, ingredientsNeeded);
			resetShoppingList();
			incrementMealCount();
			target.children("div.overlay").fadeIn(700, function() {
				$(this).fadeOut(1000, function() {
					var mealsShowing = Session.get('mealsShowing');
					mealsShowing.splice(meal_index, 1);
					mealsShowing.push(recipesList[numMeals+2+offset]);
					Session.set('mealsShowing', mealsShowing);
					offset++;
				});
			});
		}
	},

	numIngredientsNeeded: function(recipeName) {
		var num = 0;
		var recipeIngredients = recipes[recipeName];
		for (var ingredient in recipeIngredients) {
			ingredientName = ingredient["name"];
			if (!(ingredient in ingredientsInPossession) || ingredientsInPossession[ingredient] < recipeIngredients[ingredient]["quantity"]) {
				num++;
			}
		}
		return num;
	}
});

Template.meal_grid.events({
	// "dblclick div.meal-grid": function(event) {
	//  event.preventDefault();
	// },

	// meal_grid_Gestures: {
	//  'tap div.meal-grid': function (event, templateInstance) {
	//      console.log(this);
	//      showDialog(event);
	//  },
	//  'doubletap div.meal-grid': function (event, templateInstance) {
	//      var meal_index = ($(event.currentTarget).attr('id')).split("-")[1];
	//      var meal = $(event.currentTarget).find('div#recipe-name > span').text();
	//      recipeSelected(meal, ingredientsNeeded);
	//      resetShoppingList();
	//      incrementMealCount();
	//      $(event.currentTarget).children("div.overlay").fadeIn(700, function() {
	//          $(this).fadeOut(1000, function() {
	//              var mealsShowing = Session.get('mealsShowing');
	//              mealsShowing.splice(meal_index, 1);
	//              mealsShowing.push(recipesList[numMeals+2+offset]);
	//              Session.set('mealsShowing', mealsShowing);
	//              offset++;
	//          });
	//      });
	//  }
	// },

	// "click div.meal-grid": function(event) {
	// 	// showDialog(event);
	// 	clicks++;
	// 	if(clicks === 1) {
	// 		timer = setTimeout(function() {
	// 			showDialog($(event.currentTarget));  
	// 			clicks = 0;
	// 		}, DELAY);

	// 	} else {
	// 		clearTimeout(timer);
	// 		// var meal_index = ($(event.currentTarget).attr('id')).split("-")[1];
	// 		// var meal = $(event.currentTarget).find('div#recipe-name > span').text();
	// 		// recipeSelected(meal, ingredientsNeeded);
	// 		// resetShoppingList();
	// 		// incrementMealCount();
	// 		// $(event.currentTarget).children("div.overlay").fadeIn(700, function() {
	// 		//  $(this).fadeOut(1000, function() {
	// 		//      var mealsShowing = Session.get('mealsShowing');
	// 		//      mealsShowing.splice(meal_index, 1);
	// 		//      mealsShowing.push(recipesList[numMeals+2+offset]);
	// 		//      Session.set('mealsShowing', mealsShowing);
	// 		//      offset++;
	// 		//  });
	// 		// });
	// 		clicks = 0;
	// 	}
	// },

	// "dblclick div.meal-grid": function(event) {
	// 	var meal_index = ($(event.currentTarget).attr('id')).split("-")[1];
	// 	var meal = $(event.currentTarget).find('div#recipe-name > span').text();
	// 	recipeSelected(meal, ingredientsNeeded);
	// 	resetShoppingList();
	// 	incrementMealCount();
	// 	$(event.currentTarget).children("div.overlay").fadeIn(700, function() {
	// 		$(this).fadeOut(1000, function() {
	// 			var mealsShowing = Session.get('mealsShowing');
	// 			mealsShowing.splice(meal_index, 1);
	// 			mealsShowing.push(recipesList[numMeals+2+offset]);
	// 			Session.set('mealsShowing', mealsShowing);
	// 			offset++;
	// 		});
	// 	});
	// },

	"click div.modal-dialog .modal-close": function(event) {
		var dialog = $(event.currentTarget).closest(".dialog:not(.hide)");
		dialog.addClass('hide');
		$('body').css({ overflow: 'inherit'});
	},	

	"click div.modal-dialog .add-recipe": function(event) {
		var dialog = $(event.currentTarget).closest(".dialog:not(.hide)");
		var meal_div = dialog.siblings('div.meal-grid');
		var meal_index = (meal_div.attr('id')).split("-")[1];
		var meal = meal_div.find('div#recipe-name > span').text();
		recipeSelected(meal, ingredientsNeeded);
		resetShoppingList();
		incrementMealCount();
		dialog.addClass('hide');
		$('body').css({ overflow: 'inherit'});
		meal_div.children("div.overlay").fadeIn(700, function() {
			$(this).fadeOut(1000, function() {
				var mealsShowing = Session.get('mealsShowing');
				mealsShowing.splice(meal_index, 1);
				mealsShowing.push(recipesList[numMeals+2+offset]);
				Session.set('mealsShowing', mealsShowing);
				offset++;
			});
		});
	}

});

Template.num_servings.events({
	"click, touchstart div.add-meal": function (event) {
		var meal = $(event.currentTarget).siblings('span').text();
		recipeSelected(meal, ingredientsNeeded);
		resetShoppingList();
		var currServings = $(event.currentTarget).siblings('div.num-servings').children('span');
		var newNum = parseInt(currServings.text(), 10) + 1;
		currServings.text(newNum);
		event.stopPropagation();

	},
	"click, touchstart div.remove-meal": function (event) {
		var currServings = $(event.currentTarget).siblings('div.num-servings').children('span');
		var newNum = parseInt(currServings.text(), 10) - 1;
		if (newNum < 0) return;
		currServings.text(newNum);
		var meal = $(event.currentTarget).siblings('span').text();
		recipeUnselected(meal, ingredientsNeeded);
		resetShoppingList();
		event.stopPropagation();
	}
});

Template.list.helpers({
	ingredients: function() {
		return Session.get("newIngredients");
	}
});

Template.recipe_info.helpers({
	inPossession: function(name, quantity) {
		if (name in ingredientsInPossession) {
			if (ingredientsInPossession[name] >= quantity) {
				return true;
			}
		}
		return false;
	}
});