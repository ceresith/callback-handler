# callback-handler
This is a utility package to handle errors and unwanted results in callbacks automatically. It is used to improve readability of code and simplify working with callbacks.

## Installation

```bash
$ npm install callback-handler
```

## Usage

```javascript
var CallbackHandler = require('callback-handler');
```

## Version

The current version is 0.1.2

## Features

  * Simplified callbacks
  * Automatic error handling
  * Automatic handling of additional common callback use-cases
  * Callbacks will never be triggered twice accidentally
  * Well tested
  * Extendable

## Quick Examples

```javascript
// Create a callback handler:

	var handler = new CallbackHandler(callback);

// Use `#next(callback)` instead of adding `if (err) { return callback(err); }` to the callback code:

	userModel.findById(userId, handler.next(function(user) {
		// Error argument has already been checked
	}));

// Use `#nextIf(predicate, callback)` if you want to pre-check the result:

	function isNull(any) { return any === null; } // Helper function

	chatRoomModel.findByRoomName(roomName, handler.nextIf(isNull, function(room) {
		// Error argument has already been checked and the room is null
	}));

// Use `#last()` to finish a callback chain and return the result:

	chatRoomModel.create(userId, roomName, handler.last());

// See it altogether:

	function isNull(any) { return any === null; } // Helper function

	function createChatRoom(userId, roomName, callback) { // calls back with (err, room)
		var handler = new CallbackHandler(callback);
		userModel.findById(userId, handler.next(function(user) {
			chatRoomModel.findByRoomName(roomName, handler.nextIf(isNull, function(room) {
				chatRoomModel.create(userId, roomName, handler.last());
			}));
		}));
	}
```

## Advanced Examples

```javascript
// Use `#error(err)` to finish the callback chain and call the global callback with an error:

	handler.error(new Error('Chat room already exists'));

// Use `#success(data...)` to finish the callback chain and call the global callback with one or more (or none) results:

	function doesChatRoomExist( roomName, callback) { // calls back with (err, exists) - exists is either true or false
		var handler = new CallbackHandler(callback);
		chatRoomModel.findByRoomName(roomName, handler.next(function(room) {
			handler.success(!!room);
		}));
	}

// Or use `#finalize(err, data...)` if you prefer to be more explicit:

	function doesChatRoomExist( roomName, callback) { // calls back with (err, exists) - exists is either true or false
		var handler = new CallbackHandler(callback);
		chatRoomModel.findByRoomName(roomName, handler.next(function(room) {
			handler.finalize(null, !!room);
		}));
	}

// Use `#flatten(callback)` to use explicit variable names instead of working with array indices:

	async.parallel([
		userModel.findById.bind(userModel, userId),
		chatRoomModel.findById.bind(chatRoomModel, roomId),
	], handler.flatten(function(user, room) {
		// Work with user and room instead of result[0] and result[1]
		// Also note that the error handling is done automatically
	}));

// Use `#consume(callback)` if your callback returns a function that should be called just before the global callback is called:

	function unlockDatabase() {
		// Unlock the database here
	}

	function lockDatabase(callback) {
		// Lock the database here
		callback(null, unlockDatabase)
	}

	function doALotOfDatabaseStuff(callback) {
		var handler = new CallbackHandler(callback);
		lockDatabase(handler.consume(function() {
			// Do some database calls. The database will be unlocked as soon an error occurres or the callback chain finishes regular
		}));
	}

// Or use `#onFinalize(function)` if you want to be more explicit:

	function doALotOfDatabaseStuff(callback) {
		var handler = new CallbackHandler(callback);
		lockDatabase(handler.next(function(unlockDatabase) {
			handler.onFinalize(unlockDatabase);
			// Do some database calls. The database will be unlocked as soon an error occurres or the callback chain finishes regular
		}));
	}
```

## Tests

Tests are written with mocha. Install the dev dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

## License

  [MIT](LICENSE)