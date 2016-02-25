Template.signup.events({

  "submit #signup_form": function (event) {
    Router.go('sync');

    // Prevent default form submit
    return false;
  }
});