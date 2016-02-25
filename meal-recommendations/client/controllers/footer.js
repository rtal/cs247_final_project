Template.footer.events({
	"click #footer div.link": function (event) {
		var dest = $(event.target).attr('id');
		Router.go(dest);
	}
});