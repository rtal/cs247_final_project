Template.sync.helpers({
  sync_gestures: {
    "tap .device div.sync": function (e, t) {
      $(event.target).closest('.device div.sync').find('i').removeClass('ion-loop').addClass('ion-checkmark-round');
    },

    "tap #next": function (e, t) {
      Router.go('/items');
    }
  },
	devices: function() {
		return new Array({id: "device1", name: "Pantry Camera", img: "/img/device1.jpg"}, 
					     {id: "device2", name: "Refridgerator Camera", img: "/img/device2.jpg"}, 
					     {id: "device3", name: "Counter-Top Camera", img: "/img/device3.jpeg"});
	}
});

Template.sync.events({
  "click .device div.sync": function (event) {
    $(event.currentTarget).find('i').removeClass('ion-loop').addClass('ion-checkmark-round');
  },

  "click #next": function (event) {
  	Router.go('/items');
  }
});