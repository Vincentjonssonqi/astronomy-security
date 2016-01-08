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
task it tries to solve but using the framework is very intuitive and effortless. As you might know if you are a meteor developer with a few
apps on your belt, security in meteor is not always very effortless to implement. Allow and deny rules can get really complex very quickly
