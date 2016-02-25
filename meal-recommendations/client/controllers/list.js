Template.list.onRendered( function() {
	$('#footer div.link').removeClass('selected');
	$('#footer #list').addClass('selected');
});

Template.list.helpers({
    // TODO need to adjust to display accurate ingredients
	ingredients: function() {
		var json_url = "/json/vegan.json";
		var ingredients = new Array();

		$.ajax({
	        url: json_url,
	        async: false,
	        dataType: 'json',
	        success: function(json) {
	        	ingredients = json["ingredients_in_possession"]
	        }
	    });

	    return eval(ingredients);
	}
});