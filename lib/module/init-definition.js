Astro.eventManager.on('initDefinition',function(schemaDefinition){
  var Class = this;
  var schema = Class.schema;
  //console.log('initDefinition');
  if (schema.hasOwnProperty('collection')){
    //console.log('has collection');
    var security;
    // Modify the "schemaDefinition"
    if (schemaDefinition.hasOwnProperty('security') && typeof schemaDefinition.security === 'object'){
        security = schemaDefinition.security;
        //if the secure property is set than the security modifications are added to  the class
        //set a defaultACL from the schema definition or the default deafultACL if not declared
        if (security.hasOwnProperty('implementsACL') && security.implementsACL){
          var defaultACL = security.hasOwnProperty('defaultACL')? security.defaultACL: new ACL();
          //console.log('hello');
          var fields = {
              ACL:{
                type:'object',
                nested:'ACL',
                default:function(){
                  return defaultACL;
                }
              }
            };
              var methods = {
                findOrCreateOLControl:function(type,id){
                      var acl = this.ACL;
                      var olcs = acl.controls.filter(function(c){
                        return id !== null? (c.type.name === type && c.type.hasOwnProperty('id') && c.type.id === id):(c.type.name === type);
                      });
                      var olc;
                      if (olcs.length <= 0){
                        var t = {
                          name:type
                        };
                        if (id != null) t['id'] = id;
                        var newOlc = new OLC({
                          type:t,
                          write:false,
                          read:false
                        });
                        acl.controls.push(newOlc);
                        olc = acl.controls[acl.controls.length - 1];
                      }else{
                        olc = olcs[0];
                      }
                      return olc;
                    },
                setTypeAccess:function(type,accessType,access,id){
                      var olc = this.findOrCreateOLControl(type,id);
                      if (accessType) olc.set(accessType,access);
                      else olc.set(access);
                      return olc;
                    },
                setUserAccess:function(userId,accessObj){
                      return this.setTypeAccess('user',null,accessObj,userId);
                    },
                setUserWriteAccess:function(userId,access){
                      return this.setTypeAccess('user','write',access,userId);
                    },
                    setUserReadAccess:function(userId,access){
                      return this.setTypeAccess('user','read',access,userId);
                    },
                    setRoleAccess:function(roleName,accessObj){
                      var role = Role.findOne({name:roleName});
                      return this.setTypeAccess('role',null,accessObj,role._id);
                    },
                    setRoleWriteAccess:function(roleName,access){
                      var role = Role.findOne({name:roleName});
                      return this.setTypeAccess('role','write',access,role._id);
                    },
                    setRoleReadAccess:function(roleName,access){
                      var role = Role.findOne({name:roleName});
                      return this.setTypeAccess('role','read',access,role._id);
                    },
                    setPublicAccess:function(accessObj){
                      return this.setTypeAccess('public',null,accessObj,null);
                    },
                    setPublicWriteAccess:function(access){
                      return this.setTypeAccess('public','write',access,null);
                    },
                    setPublicReadAccess:function(access){
                      return this.setTypeAccess('public','read',access,null);
                    }
              };
              Class.extend({
                methods:methods,
                fields:fields
              });
        }
      }else{
        security = {};
      }
      //set a CLP from the schema definition or the default CLP if not declared
      if (!security.hasOwnProperty('CLP')){
          security.CLP = new CLP();
      }
    //Extend the CLass with the security configuration
      schema.security = security;
      //console.log(Class);
      //console.log(schemaDefinition.fields);
      //console.log(schemaDefinition.name + ' is secured');
  }

});
