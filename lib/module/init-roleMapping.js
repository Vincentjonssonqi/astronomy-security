if (Meteor.isServer){
  Accounts.onCreateUser(function(options, user) {
    var citizenRole = Role.findOne({name:'citizen'});
    var mapUserToRole = new RoleMapping({
        userId:user._id,
        roleId:citizenRole._id
    });
    mapUserToRole.save();
    return user;
  });
}
