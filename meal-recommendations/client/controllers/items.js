Template.items.onRendered( function() {
	$('#footer div').removeClass('selected');
	$('#footer #items').addClass('selected');
});

Template.items.helpers({
	items: function() {
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