if (Meteor.isServer){
	Astro['addRoles'] = function(roles){
		if (typeof roles === 'string') roles = [roles];
		roles.forEach(function(roleName){
			var role = new Role({
				name:roleName
			});
			try{
				role.save();
			}catch (err){
				console.error(err);
			}
		});
	};
	Astro['mapUserToRole'] = function(userId,roleName){
		if (typeof userId !== 'string' && typeof roleName !== 'string') throw "mapUserToRole: not valid input types";

		var role = Role.find({name:roleName});

		if (!role) throw "did not find a role with the name: " + roleName;

		var userRoleMap = new RoleMapping({
			userId:userId,
			roleId:role._id
		});

		return userRoleMap.save();
	};
	Astro['mapNewUsersToRoles'] = function(roleNames){
		if (typeof roleNames === 'string') roleNames = [roleNames];

		Accounts.onCreateUser(function(options, user) {
			console.log(roleNames);
	      	roleNames.forEach(function(roleName){
				try{
					Astro.mapUserToRole(user._id,roleName);
				}catch (err){
					console.log(err);
				}

		  	});
		  	return user;
		});
	};
}
