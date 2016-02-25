// prints a json file to browser console
$(document).ready(function() {
	openRecipeFile('vegan.json', function(response) {
		var recipes = response[0];
		var ingredientsInPossession = response[1];

		ingredientsNeeded = {};
		recipeSelected(recipes["Tofu Mushroom Soup"], ingredientsNeeded);
		console.log(ingredientsNeeded);
		// recipeUnselected(recipes["Tofu Mushroom Soup"], ingredientsNeeded);
		// console.log(ingredientsNeeded);
		var shoppingList = finalizeShoppingList(ingredientsInPossession, ingredientsNeeded);
		console.log(shoppingList);
	});
});


/* openRecipeFile
 * ==============
 * filename: the recipe file that needs to be opened
 * callback: the function to run on the recipe and ingredientsInPossession dictionaries
 * 
 * parses the json file and creates data structures for recipes and ingredients that the user has
 * in their fridge and pantry
 * recipes (dictionary):
 * 		key: name of the recipe (string)
 * 		value: ingredient list (dictionary):
 *			key: name (string)
 *			value: quantity needed to make recipe (int)
 * ingredientsInPossession (dictionary):
 * 		key: ingredient name (string)
 * 		value: quantity in possession (int)

 * parameter to callback: [recipes, ingredientsInPossession]
 */
function openRecipeFile(filename, callback) {
	$.getJSON(filename, function(data) {
		var recipes = {};
		var ingredientsInPossession = {};

		// parse recipes
		var tempRecipes = data["recipes"];
		for (var i = 0; i < tempRecipes.length; i++) {
			var currentRecipe = tempRecipes[i];
			recipes[currentRecipe["name"]] = {};
			var tempIngredients = currentRecipe["ingredients"];
			for (var j = 0; j < tempIngredients.length; j++) {
				var currentIngredient = tempIngredients[j];
				recipes[currentRecipe["name"]][currentIngredient["name"]] = currentIngredient["quantity"];
			}
		}

		// parse ingredients in possession
		var tempIngredients = data["ingredients_in_possession"];
		for (var i = 0; i < tempIngredients.length; i++) {
			var currentIngredient = tempIngredients[i];
			ingredientsInPossession[currentIngredient["name"]] = currentIngredient["quantity"]
		}

		callback([recipes, ingredientsInPossession]);
	});
}


/* recipeSelected
 * ===========================
 * desiredRecipe: the recipe to be added to the plan
 * ingredientsNeeded: ingredients needed for all the planned recipes and their quantities

 * ingredientsNeeded is updated by adding ingredients in desiredRecipe, it's passed by reference
 * so nothing is returned
 */
function recipeSelected(desiredRecipe, ingredientsNeeded) {
	for (var ingredient in desiredRecipe) {
		var quantityNeeded = desiredRecipe[ingredient];
		if (ingredient in ingredientsNeeded) {
			ingredientsNeeded[ingredient] += quantityNeeded;
		} else {
			ingredientsNeeded[ingredient] = quantityNeeded;
		}
	}
}


/* finalizeShoppingList
 * ===========================
 * ingredientsInPossession: the ingredients the user has in their fridge/pantry
 * ingredientsNeeded: ingredients needed for all the planned recipes and their quantities

 * return: shoppingList: what the user needs to purchase to make all the ingredients in plan
 */
function finalizeShoppingList(ingredientsInPossession, ingredientsNeeded) {
	var shoppingList = {};
	for (var ingredient in ingredientsNeeded) {
		var difference = ingredientsNeeded[ingredient];
		if (ingredient in ingredientsInPossession) {
			difference -= ingredientsInPossession[ingredient];
		}
		if (difference > 0) {
			shoppingList[ingredient] = difference;
		}
	}
	return shoppingList;
}


/* recipeUnselected
 * ===========================
 * unselectedRecipe: the recipe to be removed from the plan
 * ingredientsNeeded: ingredients needed for all the planned recipes and their quantities

 * ingredientsNeeded is updated by removing ingredients in unselectedRecipe, it's passed by
 * reference so nothing is returned
 */
function recipeUnselected(unselectedRecipe, ingredientsNeeded) {
	for (var ingredient in unselectedRecipe) {
		ingredientsNeeded[ingredient] -= unselectedRecipe[ingredient];
	}
}