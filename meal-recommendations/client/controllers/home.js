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
	console.log(ingredientsNeeded);
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
	console.log(ingredientsNeeded);
}

results = openRecipeFile(menufile);
recipesList = results[0]
ingredientsInPossessionList = results[1];
parsedResults = parseData(recipesList, ingredientsInPossessionList);
recipes = parsedResults[0];
ingredientsInPossession = parsedResults[1];
Session.set("newIngredients", []);

Template.items.helpers({
	categories: function() {
		return ingredientsInPossessionList;
	}
});

// Template.category.helpers({
// 	isItems: function(type) {
// 		if (type == "items") {
// 			return true;
// 		}

// 		return false;
// 	}
// });

Template.category.events({
	"click .chevron_toggleable": function(event) {
		$(event.currentTarget).toggleClass('ion-chevron-down ion-chevron-up');
	}
})

Template.meals.helpers({
	meals: function() {
		return recipesList;
	}
});

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

Template.num_servings.events({
	"click div.add-meal": function (event) {
		var meal = $(event.currentTarget).siblings('span').text();
		recipeSelected(meal, ingredientsNeeded);
		resetShoppingList();
		var currServings = $(event.currentTarget).siblings('div.num-servings').children('span');
		var newNum = parseInt(currServings.text(), 10) + 1;
		currServings.text(newNum);
		event.stopPropagation();

	},
	"click div.remove-meal": function (event) {
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