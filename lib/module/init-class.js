if(Meteor.isServer){
Astro.eventManager.on('initClass', function() {
  //console.log('initClass');
  var Class = this;
  var schema = Class.schema;
  var security = schema.security;

  Class.getSecurityConfig = function(){
    return schema.security;
  };


  Class.findOrCreateCLControl = function(type,id){
    var clp = schema.security.CLP;
    var clcs = clp.controls.filter(function(c){
      return id !== null? (c.type.name === type && c.type.hasOwnProperty('id') && c.type.id === id):(c.type.name === type);
    });
    var clc;
    if (clcs.length <= 0){
      var t = {
        name:type
      };
      if (id != null) t['id'] = id;
      var newClc = new CLC({
        type:t,
        find:false,
        insert:false,
        update:false,
        remove:false
      });
      clp.controls.push(newClc);
      clc = clp.controls[clp.controls.length - 1];
    }else{
      clc = clcs[0];
    }
    return clc;
  };
  Class.setTypeAccess = function(type,accessType,access,id){
    var values = accessType? (accessType === 'write'? {
      insert:access,
      remove:access,
      update:access
    }:{
      find:access
    }):access;
    var clc = this.findOrCreateCLControl(type,id);
    if (values) clc.set(values);
    return clc;
  };
  Class.setUserAccess = function(userId,accessObj){
    return this.setTypeAccess('user',null,accessObj,userId);
  };
  Class.setUserWriteAccess = function(userId,access){
    return this.setTypeAccess('user','write',access,userId);
  };
  Class.setUserReadAccess = function(userId,access){
    return this.setTypeAccess('user','read',access,userId);
  };
  Class.setRoleAccess = function(roleName,accessObj){
    var role = Role.findOne({name:roleName});
    return this.setTypeAccess('role',null,accessObj,role._id);
  };
  Class.setRoleWriteAccess = function(roleName,access){
    var role = Role.findOne({name:roleName});
    return this.setTypeAccess('role','write',access,role._id);
  };
  Class.setRoleReadAccess = function(roleName,access){
    var role = Role.findOne({name:roleName});
    return this.setTypeAccess('role','read',access,role._id);
  };
  Class.setPublicAccess = function(accessObj){
    return this.setTypeAccess('public',null,accessObj,null);
  };
  Class.setPublicWriteAccess = function(access){
    return this.setTypeAccess('public','write',access,null);
  };
  Class.setPublicReadAccess = function(access){
    return this.setTypeAccess('public','read',access,null);
  };
  Class.isAuthorized = function(rt,userId,SO) {//SO = SecurityObject (either ACL or CLP)
      //evaute if the public can perform the rt on this collection
      var authorized = [];
      //console.log(SO);
      var publicControl = SO.controls.filter(function(c){
        return c.type.name === 'public' && c[rt];
      });
      //there is no reason to evaluate any other CLC if public access is true
      if (publicControl.length > 0) return true;
      //chack to see if the userId is set, the following functions need it to evaluate
      if (!userId) return false;
      //console.log('no public access');

      var userControls = SO.controls.filter(function(c){
        return c.type.name === 'user' && c[rt] && c.type.id === userId;
      });
      //console.log(userControls);

      if (userControls.length > 0) return true;
      //else console.log('no user specific access: ' + userId);

      //evaluate if the user is in one of the roles in the SO
      var roleControls = SO.controls.filter(function(c){
        return c.type.name === 'role' && c[rt];
      });
      //console.log(roleControls);
      if (roleControls.length > 0){
        var roleIds = [];
        roleControls.forEach(function(c){
          roleIds.push(c.type.id);
        });
        var userRoleMap = RoleMapping.findOne({roleId:{$in:roleIds}});
        if (userRoleMap){
          //console.log('user is in role');
          return true;
        }else{
          return false;
        }
      }else{
        return false;
      }
    };


  Class.getACLRT = function(rt){
      return ['insert','remove','update'].indexOf(rt) > 0? 'write':'read';
    };
  Class.autorizeRequest = function(rt,userId,acl){
      //evaluate write request
      //console.log(Class.getACLRT(rt));
        return Class.isAuthorized(rt,userId, schema.security.CLP)? (acl? Class.isAuthorized(Class.getACLRT(rt),userId, acl):true):false;
    };
  Class.buildQuery = function(query,userId){
    var aclOrQuery = [{
        'ACL.controls':{
          $elemMatch:{
            'type.name':'public',
            'read':true
          }
        }
      }];

      //this is the role elemMatch
      if (userId){
        aclOrQuery.push({
          'ACL.controls':{
            $elemMatch:{
              'type.name':'role',
              'read':true
            }
          }
        });
        aclOrQuery.push({
          'ACL.controls':{
            $elemMatch:{
              'type.name':'user',
              'read':true
            }
          }
        });

        var rolesMapped = RoleMapping.find({userId:userId});
        var roleIds = [];
        rolesMapped.forEach(function(r){
          roleIds.push(r.get('roleId'));
        });
        aclOrQuery[1]['ACL.controls'].$elemMatch['type.id'] = {
          $in:roleIds
        };
		//console.log(aclOrQuery[1]['ACL.controls'].$elemMatch['type.id']);
        //this is the user elemMatch
        aclOrQuery[2]['ACL.controls'].$elemMatch['type.id'] = userId;
      }

      var andQuery = [{$or:aclOrQuery}];
	  if (query) andQuery.push(query);
      var queryObj = {$and:andQuery};
      //console.log(aclOrQuery[0]);
      //console.log(aclOrQuery[1]);
      //console.log(aclOrQuery[2]);
      return queryObj;
    };

    //This is an experimental feature that will generate all the methods and publications for find, fetch, insert, update and remove operations
    //all the functions will go through validation and authorization through the class clp and the object acl.
    Class.generateSecureMethodsAndPublications = function(){
      //Evaluate the CLP and run the generator functions
      var clp = Class.getSecurityConfig().CLP;
      var controls = clp.get('controls');
      var types = {
        insert:false,
        remove:false,
        update:false,
        find:false
      };

      controls.forEach(function(c){
        for (var key in types){
          if (c[key]) types[key] = true;
        }
      });
      //console.log(types);
      //ci = class instance
      var methods = {};

      if (types['insert']){
         methods['insert' + schema.className] = function(values){
          //do an initial check to ensure that the values sent to the function are the expected types
          //console.log("inserting to: "+ this.userId);
          check(values,Object);
          //variable declaration
          var acl,
              ci;

          //Now we to authorize the request be calling Class.authorizeRequest() wich will evaluate the request against the CLP and possibly an ACL to.
          if (!Class.autorizeRequest('insert',this.userId,null)) throw new Meteor.Error('404', 'Not authorized to update the object');
          //Set the values that the update requested
          ci = new Class(values);
          //ci.setPublicReadAccess(false);
          //ci.setRoleReadAccess('citizen',true);
          //If there is a userId than set a user OLC (if public write is in the clp the owner OLC will not be required)
          if (this.userId) ci.setUserAccess(this.userId,{write:true,read:true});
          //See if the ci object passes the validators
          if (!ci.validate()) throw new Meteor.Error('403', 'Not a valid ci');
          //save the ci
          try{
            ci.save();
            return ci;
          }catch (err){
            throw new Meteor.Error('400', err);
          }
        };
      }

      if (types['update']){
        methods['update' + schema.className] = function(ciId,values) {
          //do an initial check to ensure that the values sent to the function are the expected types
          check(ciId,String);
          check(values,Object);
          //variable declaration
          var acl,
              ci = Class.findOne({_id:ciId});
          //if the ci in question was not found
          if (!ci) throw new Meteor.Error('403', 'Not a valid ciId');
          //There is no need to check ACL for clearnece if the Class does not imoplement ACLs.
          if (Class.getSecurityConfig().implementsACL) acl = ci.get('ACL');
          //Now we to authorize the request be calling Class.authorizeRequest() wich will evaluate the request against the CLP and possibly an ACL too.
          if (!Class.autorizeRequest('update',this.userId,acl)) throw new Meteor.Error('404', 'Not authorized to update the object');
          //Set the values that the update requested
          ci.set(values);
          //See if the ci object passes the validators
          if (!ci.validate()) throw new Meteor.Error('403', 'Not a valid ci');
          //save the ci
          try{
            ci.save();
            return ci;
          }catch (err){
            throw new Meteor.Error('400', err);
          }
        };
      }

      if (types['remove']) {
          methods['remove' + schema.className] = function(ciId) {
          check(ciId,String);
          //console.log('trying to insert ci');
          var acl,
              ci = Class.findOne({_id:ciId});

          if (!ci) throw new Meteor.Error('403', 'Not a valid ciId');

          if (Class.getSecurityConfig().implementsACL) acl = ci.get('ACL');

          if (!Class.autorizeRequest('remove',this.userId,acl)) throw new Meteor.Error('404', 'Not authorized to remove the object');

          try{
            ci.remove();
            return true;
          } catch (err){
            throw new Meteor.Error('400', err);
          }
        };
      }
      //console.log(methods);
      Meteor.methods(methods);
      if (types['find']) {

        Meteor.publish(schema.className,function(){
            console.log("publishing to: "+ this.userId);
            if (!Class.autorizeRequest('find',this.userId,null)) throw new Meteor.Error('404', 'Not authorized to find objects in this class');
            var query = Class.buildQuery(null,this.userId);
            return Class.find(query,{fields:{ACL:0}});
          });
        }
        console.log("added crud methods for class: " + Class.schema.className);

    };
});
}
