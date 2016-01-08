# Meteor Astronomy Security

This module will make it possible for you as a developer to add class and document level
permissions to your Astro classes. 

### Why should you use this package?
Well Astronomy is a great package for enforcing a schema on your mongo collections. You just define what the 
collection schemas are and astronomy will make sure that every document that the app produces conforms to your schema 
definitions. What astronomy doesn't solve yet is who gets to modify the collections.
Sure it does not have to solve this problem as there are numorous patterns and packages that help you with this already.
So why build another one you might ask? What is so unique about this package?
Well a number of things. As you might know if you are using Astronomy the framework is a breaze to work with. It is not a simple 
task it tries to solve but using the framework is very intuitive and effortless. As you also might know if you are a meteor developer with a few apps on your belt, security in meteor is not always very effortless to implement. Allow and deny rules can get really complex very quickly and also can't secure single documents in a collection. Alternative two is securing your app using methods and publications. In my opinion this is the way to go. The only problem with this approach is that it will take much more time to implement. Appart from these two fundamental security patterns you also have to consider what type of security you want to implement. Do you want role based security? Maybe you need private user specific documents or maybe a combination of the two on just a single document. Yes there are many cases to cover, somthing that makes it hard to implement security in a generic and repetable fasion. So finally we arrive at the seed out of which this framework was grown from. <b>The idea is to make a security framework that is simple and generic, secure and flexible as well as ulta cool.</b>

### Features
This package supports securing a collection on a class and document level. You have three security categories: public, roles and user specific. You can set mutiple security controls of different categories for each level. For every control on the class level you can specify insert,update,remove and find rights. For the document level each control can specify read and write rights.

### Let's get down to business

In this part o the readme I will explain how everything works.

#### Security Configuration
Ones you've added the astronomy-security to your meteor app every Astro class except classes without collections will implement a security configuration property. If you want to override the default values in it at initlisation of the astro class you can by providing a security object. This object has three properties that you can set, implementsACL, defaultACL and CLP. You do not need to define these at all if you don't want to as astronomy-security will add this object itself on init. 

```javascript
var Comments = new Mongo.Collection('comments');
var Comment = Astro.Class({
  name: 'Comment',
  collection: Comments,
  fields: {
    /*...*/
    }
  },
  security:{
    implementsACL:false,    //optional
    defaultACL: new ACL(),  //optional (read:false, write:false)
    CLP:new CLP()           //optional (insert:false,update:false,remove:false,find:false)
  }

});
```
By default the security configuration will not allow anything by anyone. This can be changed later or by passing your own values into the security object.

#### Class Level Permissions (CLP)
You can think of a CLP as a list of CLCs, short for Class Level Controls. A CLC holds information about insert, update, remove and find permissions. It also contains information regarding who it concerns. This means that you could have different read and write permissions for different users.

Both CLP and CLC are Astro classes. The schema for them can be found here: https://github.com/Vincentjonssonqi/meteor-astronomy-security/blob/master/lib/module/collections.js

To create a CLP you create an array of CLCs and add them to the constrols property of the CLP on init.
```javascript
var clcs = [];
var roleCLC = new CLC({
                  type:{
                    name:'role',  //This can be either public, role, or user
                    id:'roleId'   //This is only required if name is role or user
                  },
                  insert:true,    // default false
                  update:true,       // default false
                  remove:true
                //find:will be false
                });
  clcs.push(roleCLC); 
  
var clp = new CLP({controls:clcs});

//add to security configuration at init
```
It looks kinda difficult and tedious. And I admit it kinda is, but it is very generic. The CLC class can take the form of any security category control and the clp houses them all. What makes this code really bad is the number of classes you have to use in order to encomplish your goal. wouldn't it be great if you could just write.
```javascript 
AstroClass.setRoleWriteAccess('admin',true);
AstroClass.setRoleReadAccess('admin',false);
//or get creative
AstroClass.setRoleAccess('admin',{insert:true,remove:false,update:false,find:true});
//referencing roles is done by name and not by roleId as this will maintain the oneliner format :P
```
and
```javascript 
//set user specific class access
AstroClass.setUserWriteAccess(/*userId*/,true);
AstroClass.setUserReadAccess(/*userId*/,true);
//get creative
AstroClass.setUserAccess(/*userId*/,{insert:true,remove:false,update:false,find:true});
//set public access rights
AstroClass.setPublicWriteAccess(false);
AstroClass.setPublicReadAccess(false);
```
That would be swell right? In fact this is how you write your class level permissions in astronomy-security. The framework adds these helper functions so that you do not need to directly interface with the CLP or CLC class, thus making your code more readable and sexier. I only covered the generic and long example above to show you what really happens when you call the helper functions.


#### Access Control List (ACL)
This could be translated into Document level permissions. Why not call it that then? Well That would just confuse all of the people out there that know the ACL expression and what it stands for. Besides DLP is not as sexy as ACL. 

Now that we got that out of the way lets quickly introduce what document level permissions or ACLs are. An ACL in astronomy-security is similar in format to the CLP Class, the difference being that an ACL is a list of security controls for a single document instead of the entire class. To activate ACL security on a collection you set implementsACL to true in the security configuration. Now every document you create will have its own ACL object. 

An ACL security control is called an OLC, which is short for Object level control. This filles the same function as a CLC does for the CLP. As every document has an extra ACL object it is important to keep the size of the overhead down as much as possible. So the only difference between a CLC and an OLC is that you can only specify read and write permissions (not remove or insert for example). This is a consious choice as I found that the usecases for any complex control configuration on the document level is minimal.  

Configuring the ACL object on an instance of an Astro class is just as simple as how you would configure the CLP for the entire Astro class.
```javascript
var Comment = Astro.Class({
  /*...*/
  security:{
    implementsACL:true
  }
});
//This line of code will set the public read for the entire class to true (CLP config)
Comment.setPublicReadAccess(true);

//Initilize a comment 
var comment = new Comment();
//This line of code will set the public read on this specific comment document to false (ACL config)
comment.setPublicReadAccess(false);
//here are the rest of the functions you can use to config your acl
comment.setPublicWriteAccess(true);
comment.setPublicAccess({write:true,read:false}); //if you want to a one liner

comment.setRoleReadAccess('admin',true);
comment.setRoleWriteAccess('admin',true);
comment.setRoleAccess('admin',{write:true,read:true}); //if you want a one liner

comment.setUserReadAccess(/*userId*/,true);
comment.setUserWriteAccess(/*userId*/,true);
comment.setUserAccess(/*userId*/,{write:true,read:true}); //if you want a one liner

```
As you can see this is a very intuitive way of setting document security. You have the same helper functions as you have for setting you class level permissions, the difference being these functions will change the ACL property on the document instead of the CLP for the entire class.

#### Evaluating user access to methods and publications
As is mentioned in the intro I believe that using methods and publications is the way to go when it comes to making your meteor app more secure. Up till this point I have only talked about how you would define your security permissions. Now it is time to show you how easy it is for you to build methods and publications that authorize every request against your security configurations.

I really wanted this part to be as flexible as possible but at the same time providing you with some tools to quickly get up and running. 
If you just want secure insert, update and remove methods as well as a basic find publication for your collection you can use the s helper function called generateMethodsAndPublications.
```javascript
var Comment = Astro.Class(/*...*/);
    Comment.generateMethodsAndPublications();
```
Yes that is it! By calling this function the following will happen:
```javascript
Meteor.methods({
  insertComment:function(values){/*...*/},
  updateComment:function(commentId,values){/*...*/},
  removeComment:function(commentId){/*...*/}
});
Meteor.publish('Comment',function(){/*...*/})
```
So these functions will do as their title implies. But before the function inserts or updates anything they will make sure that the user who is requesting a the certain operation is authorized to do so. The insert and update methods will also validate the the input values against class schema. The simple find publication will malso make sure to filter out any documents that the user requesting the find should not be able to see.

Okay so that was the tool that will make it really easy to get up and running with your secure Astro class. You may however later on in the development phase whant to add more methods and publications that do more specific things. How do you secure these your own custom methods and publications? Well Astronomy security has your back here to. 

### AstroClass.autorizeRequest(userId,requestType,acl)
To evaluate if a user can perform a request you use this function
```javascript
  //inside a meteor update method (acl is optional)
  if (!Class.autorizeRequest(this.userId,'update',acl)) throw new Meteor.Error('404', 'Not authorized to remove the object');
```

### AstroClass.buildQuery(query,userId)
To build a find query that filter out documents that the user does not have access to use this function
```javascript
  //inside a meteor find publication (acl is optional)
  var query = Class.buildQuery(null,this.userId);
  return Class.find(query,{fields:{ACL:0}});
```
