Template.sync.helpers({
	devices: function() {
		return new Array({id: "device1", name: "Device 1", img: "/img/device1.jpg"}, 
					     {id: "device2", name: "Device 2", img: "/img/device2.jpg"}, 
					     {id: "device3", name: "Device 3", img: "/img/device3.jpeg"});
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