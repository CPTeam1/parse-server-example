Parse.Cloud.define('pushChannelTest', function(request, response) {

  // request has 2 parameters: params passed by the client and the authorized user
  var params = request.params;
  var user = request.user;

  // To be used with:
  // https://github.com/codepath/ParsePushNotificationExample
  // See https://github.com/codepath/ParsePushNotificationExample/blob/master/app/src/main/java/com/test/MyCustomReceiver.java
  var customData = params.customData;
  var launch = params.launch;
  var broadcast = params.broadcast;

  // use to custom tweak whatever payload you wish to send
  var pushQuery = new Parse.Query(Parse.Installation);
  pushQuery.equalTo("deviceType", "android");

  var payload = {};

  if (customData) {
      payload.customdata = customData;
  }
  else if (launch) {
      payload.launch = launch;
  }
  else if (broadcast) {
      payload.broadcast = broadcast;
  }

  // Note that useMasterKey is necessary for Push notifications to succeed.

  Parse.Push.send({
  where: pushQuery,      // for sending to a specific channel
  data: payload,
  }, { success: function() {
     console.log("#### PUSH OK");
  }, error: function(error) {
     console.log("#### PUSH ERROR" + error.message);
  }, useMasterKey: true});

  response.success('success');
});

Parse.Cloud.define('pushFriendship', function(request, response) {
  var params = request.params;
  var user = request.user;

  var friendUsername = params.friend;
  var friendQuery = new Parse.Query(Parse.User);
  friendQuery.equalTo("username", friendUsername);

  var pushQuery = new Parse.Query(Parse.Installation);
  pushQuery.matchesQuery("user", friendQuery);

  var payload = {};

  payload.new_buddy_id = params.userid;
  console.log("request user objectid " + params.userid);

  Parse.Push.send({
    where: pushQuery,      // for sending to a specific channel
    data: payload,
  }, {useMasterKey: true}).then(function () {
    console.log("#### Friendship PUSH OK");

  }, function (error) {
    console.log("Error while promises: ", error);
    console.log("#### Friendship PUSH ERROR" + error.message);
  });

  response.success('success');
});

Parse.Cloud.define('pushEntryToFriends', function(request, response) {
  var params = request.params;
  var user = request.user;

  var username = params.username;
  var entryid = params.entryid;
  var launch = params.launch;
  var broadcast = params.broadcast;

  var userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo("username", username);

  userQuery.find().then(function (results) {
    console.log("Retrieved user..");
    return results[0];

  }).then(function(userObj) {
    console.log("user type: ", Object.prototype.toString.call(userObj));
    var friendsRelation = userObj.relation("friends");
    var friendsQuery = friendsRelation.query();
    return friendsQuery.find();

  }).then(function(friends) {
    console.log("Retrieved friends..");
    var subQueries = [];
    if (friends.length == 0) {
      return Parse.Promise.as(1);
    }

    for (var friend of friends) {
      var query = new Parse.Query(Parse.Installation);
      query.equalTo("user", friend);
      subQueries.push(query);
    }

    var pushQuery = new Parse.Query(Parse.Installation)
    pushQuery._orQuery(subQueries);
    pushQuery.equalTo("deviceType", "android");

    console.log("Constructed push query!");

    var payload = {};

    if (username) {
      payload.username = username;
      payload.entryid = entryid;
    }
    else if (launch) {
      payload.launch = launch;
    }
    else if (broadcast) {
      payload.broadcast = broadcast;
    }

    return Parse.Push.send({
      where: pushQuery,      // for sending to a specific channel
      data: payload,
    }, {useMasterKey: true});

  }).then( function() {
    console.log("#### PUSH OK");

  }, function (error) {
    console.log("Error while promises: ", error);
    console.log("#### PUSH ERROR" + error.message);
  });

  response.success('success');
});
