Template.meals.onRendered( function() {
	$('#footer div').removeClass('selected');
	$('#footer #meals').addClass('selected');
});

Template.meals.helpers({
	meals: function() {
		var json_url = "/json/vegan.json";
		var ingredients = new Array();

		$.ajax({
	        url: json_url,
	        async: false,
	        dataType: 'json',
	        success: function(json) {
	        	ingredients = json["recipes"]
	        }
	    });

	    return eval(ingredients);
	}
});