Template.sync.helpers({
	devices: function() {
		return new Array({id: "device1", name: "Pantry Camera", img: "/img/device1.jpg"}, 
					     {id: "device2", name: "Refridgerator Camera", img: "/img/device2.jpg"}, 
					     {id: "device3", name: "Counter-Top Camera", img: "/img/device3.jpeg"});
	}
});

Template.sync.events({
  "click .device button": function (event) {
  	$(event.target).html('Synced');
  	$(event.target).addClass('disabled');
  	$('#next-container').removeClass('hidden');
  },

  "click #next": function (event) {
  	Router.go('/items');
  }
});