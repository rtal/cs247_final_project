datafiles = ["/json/vegan.json"/*, "/json/omnivore.json", "/json/vegetarian.json"*/];
var menufile = datafiles[Math.floor(Math.random() * datafiles.length)];

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
		var currentIngredient = ingredientsArray[i];
		ingredientsInPossession[currentIngredient["name"]] = currentIngredient["quantity"]
	}

	return [recipes, ingredientsInPossession];
}

function recipeSelected (desiredRecipe, ingredientsNeeded) {
	for (var ingredient in desiredRecipe) {
		var quantityNeeded = desiredRecipe[ingredient]["quantity"];
		if (ingredient in ingredientsNeeded) {
			ingredientsNeeded[ingredient]["quantity"] += quantityNeeded;
		} else {
			ingredientsNeeded[ingredient] = {};
			ingredientsNeeded[ingredient]["quantity"] = quantityNeeded;
		}
		ingredientsNeeded[ingredient]["img"] = desiredRecipe[ingredient]["img"];
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
			shoppingList[ingredient]["quantity"] = difference;
			shoppingList[ingredient]["img"] = ingredientsNeeded[ingredient]["img"];
		}
	}
	return shoppingList;
}

function recipeUnselected (unselectedRecipe, ingredientsNeeded) {
	for (var ingredient in unselectedRecipe) {
		ingredientsNeeded[ingredient]["quantity"] -= unselectedRecipe[ingredient];
	}
}

results = openRecipeFile(menufile);
parsedResults = parseData(results[0], results[1]);
recipes = parsedResults[0];
ingredientsInPossession = parsedResults[1];
Session.set("newIngredients", []);

Template.items.helpers({
	items: function() {
		var items = new Array();

		$.ajax({
	        url: menufile,
	        async: false,
	        dataType: 'json',
	        success: function(json) {
	        	items = json["ingredients_in_possession"]
	        }
	    });

	    return eval(items);
	}
});

Template.meals.helpers({
	meals: function() {
		var meals = new Array();

		$.ajax({
	        url: menufile,
	        async: false,
	        dataType: 'json',
	        success: function(json) {
	        	meals = json["recipes"]
	        }
	    });

	    return eval(meals);
	}
});

Template.meal.events({
	"click td.add_meal": function (event) {
		var meal = $(event.currentTarget).find('span').text();
		recipeSelected(recipes[meal], ingredientsNeeded);
		var shoppingList = finalizeShoppingList(ingredientsInPossession, ingredientsNeeded);
		var newIngredients = []
		for (var ingredient in shoppingList) {
			newIngredients.push({"name": ingredient, "quantity": shoppingList[ingredient]["quantity"], "img": shoppingList[ingredient]["img"]});
		}
		Session.set("newIngredients", newIngredients);
	}
});

Template.list.helpers({
	ingredients: function() {
		return Session.get("newIngredients");
	}
});