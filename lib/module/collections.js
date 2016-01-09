OLC = Astro.Class({
  name:'OLC',
  fields:{
    type:{
      type:'object',
      default:function(){
        return {
          name:'public'
        }
      }
    },
    read:{
      type:'boolean',
      default:false
    },
    write:{
      type:'boolean',
      default:false
    }
  }
});

CLC = Astro.Class({
 name:'CLC',
 fields:{
   type:{
     type:'object',
     default:function(){
       return {
         name:'public'
       };
     }
   },
   find:{
     type:'boolean',
     default:false
   },
   update:{
     type:'boolean',
     default:false
   },
   insert:{
     type:'boolean',
     default:false
   },
   remove:{
     type:'boolean',
     default:false
   }
 }
});

ACL = Astro.Class({
  name: 'ACL',
  /* No collection attribute */
  fields: {
    controls: {
      type: 'array',
      default: function() {
        return [new OLC()];
      },
      nested: 'OLC'
    }
  }
});


CLP = Astro.Class({
  name: 'CLP',
  /* No collection attribute */
  fields: {
    controls: {
      type: 'array',
      default: function() {
        return [new CLC()];
      },
      nested: 'CLC'
    }
  }
});

if (Meteor.isServer){
RoleMappings = new Mongo.Collection('roleMappings');
RoleMappings._ensureIndex( { roleId: 1,userId:1 }, { unique: true } );
RoleMapping = Astro.Class({
    name: 'RoleMapping',
    collection: RoleMappings,
    fields: {
      userId:'string',
      roleId:'string'
    },
    behaviors: ['timestamp']
  });

Roles = new Mongo.Collection('roles');
Roles._ensureIndex( { name: 1 }, { unique: true } );
Role = Astro.Class({
      name: 'Role',
      collection: Roles,
      fields: {
        name:'string'
      },
      relations:{
        usersMapped: {
          type: 'many',
          class: 'RoleMapping',
          local: '_id',
          foreign: 'roleId'
        }
      },
      behaviors: ['timestamp']
    });
}
