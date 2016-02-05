Package.describe({
  name: 'vincentjonssonqi:astronomy-security',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Add Class and object level security to astronomy',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/Vincentjonssonqi/astronomy-security.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.use('accounts-base');
  api.use('mongo');
  api.use('check');
  api.use('jagi:astronomy@1.2.10');
  api.use('jagi:astronomy-relations@1.0.0');
  api.use('jagi:astronomy-validators@1.0.0');
  api.use('jagi:astronomy-timestamp-behavior@1.1.0');
  api.use( 'livedata', [ 'server' ] ) ;
  api.imply('mongo');
  api.imply('check');
  api.addFiles(['lib/module/collections.js'],['client','server']);
  api.addFiles([
    'lib/module/init-class.js',
    'lib/module/init-definition.js',
    'lib/module/init-roleMapping.js'
  ], ['server']);

  api.export(['ACL', 'OLC','CLC','CLP'], ['client','server']);
  api.export(['Role','Roles','RoleMapping','RoleMappings'],['server'])
});

Package.onTest(function(api) {
  api.use('ecmascript');
  //api.use('tinytest');
  api.use('vincentjonssonqi:astronomy-security');
  //api.addFiles('astronomy-security-tests.js');
});
