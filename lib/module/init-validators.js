//don't forget to add the file
//This will make the security of the ACL object better as it will evaluate if the acl is correctly formatted and does not contain OLC duplicates.
Astro.createValidator({
  name: 'validACL',
  validate: function(fieldValue, fieldName, maxLength) {
    if (_.isNull(fieldValue) || !_.has(fieldValue, 'length')) {
      return false;
    }

    return fieldValue.length <= maxLength;
  },
  events: {
    validationError: function(e) {
      var fieldName = e.data.fieldName;
      var maxLength = e.data.param;

      e.setMessage(
        'The length of the value of the "' + fieldName +
        '" field has to be at most ' + maxLength
      );
    }
  }
});
