var assert = require('chai').assert;

var CallbackHandler = require('../src/CallbackHandler');

describe('CallbackHandler', function() {

	function successfulAsyncAction() {
		var f = [].pop.call(arguments);
		[].unshift.call(arguments, f, null);
		setImmediate.apply(null, arguments);
	}
	function failingAsyncAction() {
		var f = [].pop.call(arguments);
		[].unshift.call(arguments, f, new Error('Fail'));
		setImmediate.apply(null, arguments);
	}

	describe('#finalize()', function() {
		it('should call the handler\'s callback with the given arguments (the first one replaced with null) if the first argument is falsy', function(done) {
			var handler = new CallbackHandler(function(err, data, moreData) {
				assert.lengthOf(arguments, 3);
				assert.strictEqual(err, null);
				assert.strictEqual(data, "some data");
				assert.strictEqual(moreData, "more data");
				done();
			});
			handler.finalize(false, "some data", "more data");
		});

		it('should call the handler\'s callback with the first arguments and null if the first argument is truthy', function(done) {
			var handler = new CallbackHandler(function(err, data, moreData) {
				assert.lengthOf(arguments, 2);
				assert.strictEqual(err, "some error");
				assert.strictEqual(data, null);
				done();
			});
			handler.finalize("some error", "some data", "more data");
		});

		it('should have no effect if it was already called', function(done) {
			var called = 0;
			var handler = new CallbackHandler(function() {
				called++;
				assert.strictEqual(called, 1);
			});
			for (var i = 0; i < 10; i++) {
				handler.finalize();
			}			
			setImmediate(function() {
				assert.strictEqual(called, 1);
				done();
			});
		});
	});

	describe('#success(data...)', function() {
		it('should call the handler\'s callback with null, followed by all given arguments', function(done) {
			var handler = new CallbackHandler(function(err, a, b, c) {
				assert.strictEqual(err, null);
				assert.strictEqual(a, "a");
				assert.strictEqual(b, "b");
				assert.strictEqual(c, "c");
				done();
			});
			handler.success("a", "b", "c");
		});

		it('should have no effect if it was already called', function(done) {
			var called = 0;
			var handler = new CallbackHandler(function(err, a, b, c) {
				called++;
				assert.strictEqual(called, 1);
				assert.strictEqual(err, null);
				assert.strictEqual(a, "aa");
				assert.strictEqual(b, "ba");
				assert.strictEqual(c, "ca");
			});
			for (var i = 0; i < 10; i++) {
				handler.success("aa", "ba", "ca");
			}			
			setImmediate(function() {
				assert.strictEqual(called, 1);
				done();
			});
		});
	});

	describe('#error(err)', function() {
		it('should call the handler\'s callback with the first given argument and null as second argument', function(done) {
			var handler = new CallbackHandler(function(err, data) {
				assert.lengthOf(arguments, 2);
				assert.strictEqual(err, "some error");
				assert.strictEqual(data, null);
				done();
			});
			handler.error("some error", "some data", "more data");
		});

		it('should have no effect if it was already called', function(done) {
			var called = 0;
			var handler = new CallbackHandler(function(err, data, moreData) {
				called++;
				assert.strictEqual(called, 1);
				assert.lengthOf(arguments, 2);
				assert.strictEqual(err, "error");
				assert.strictEqual(data, null);
			});
			for (var i = 0; i < 10; i++) {
				handler.error("error", "data", "more");
			}			
			setImmediate(function() {
				assert.strictEqual(called, 1);
				done();
			});
		});
	});

	describe('#onFinalize(callback)', function() {
		it('should call the given callback as soon the handler is finalized', function(done) {
			var n = 0;
			var handler = new CallbackHandler(function() {
				assert.strictEqual(n, 45);
				done();
			});
			handler.onFinalize(function() {
				n = 7;
			});
			handler.onFinalize(function() {
				n = n + 2;
			});
			handler.onFinalize(function() {
				n = n * 5;
			});
			handler.finalize();
		});

		it('should call the given callback as soon the handler is finalized by using \'success\'', function(done) {
			var n = 0;
			var handler = new CallbackHandler(function() {
				assert.strictEqual(n, 45);
				done();
			});
			handler.onFinalize(function() {
				n = 7;
			});
			handler.onFinalize(function() {
				n = n + 2;
			});
			handler.onFinalize(function() {
				n = n * 5;
			});
			handler.success();
		});

		it('should call the given callback as soon the handler is finalized by using \'error\'', function(done) {
			var n = 0;
			var handler = new CallbackHandler(function() {
				assert.strictEqual(n, 45);
				done();
			});
			handler.onFinalize(function() {
				n = 7;
			});
			handler.onFinalize(function() {
				n = n + 2;
			});
			handler.onFinalize(function() {
				n = n * 5;
			});
			handler.error("some error");
		});

		it('should call all given callbacks as soon the handler is finalized by receiving an error', function(done) {
			var n = 0;
			var handler = new CallbackHandler(function() {
				assert.strictEqual(n, 45);
				done();
			});
			handler.onFinalize(function() {
				n = 7;
			});
			handler.onFinalize(function() {
				n = n + 2;
			});
			handler.onFinalize(function() {
				n = n * 5;
			});
			handler.error("some error");
		});

		it('should have no effect if the handler is already finalized', function(done) {
			var called = 0;
			var handler = new CallbackHandler(function() {
				assert.strictEqual(called, 1);
			});
			handler.onFinalize(function() {
				called++;
				assert.strictEqual(called, 1);
			});
			for (var i = 0; i < 10; i++) {
				handler.finalize();
			}
			failingAsyncAction(1, 2, 3, handler.next(function(one, two, three) {
				assert.fail();
				done();
			}));
			setImmediate(function() {
				assert.strictEqual(called, 1);
				done();
			});
		});

		it('should return the handler to allow method chaining', function(done) {
			var handler = new CallbackHandler(function() {});
			assert.strictEqual(handler.onFinalize(function() {}), handler);
			done();
		});
	});

	describe('#next(callback)', function() {
		it('should return a function that calls the given callback with all arguments except the first one if the first argument is falsy', function(done) {
			var handler = new CallbackHandler(function() {});
			successfulAsyncAction(1, 2, 3, handler.next(function(one, two, three) {
				assert.strictEqual(one, 1);
				assert.strictEqual(two, 2);
				assert.strictEqual(three, 3);
				done();
			}));
		});

		it('should return a function that calls the handler\'s callback with the first argument and null if the first argument is truthy', function(done) {
			var handler = new CallbackHandler(function(err, data) {
				assert.lengthOf(arguments, 2);
				assert(err);
				assert.strictEqual(data, null);
				done();
			});
			failingAsyncAction(1, 2, 3, handler.next(function(one, two, three) {
				assert.fail();
				done();
			}));
		});

		it('should return a no-op function if the handler\'s callback has already been called', function(done) {
			var handler = new CallbackHandler(function(err, data) {
				assert.lengthOf(arguments, 2);
				assert(err);
				assert.strictEqual(data, null);
				handler.next(function() {
					assert.fail();
					done();
				})
				setImmediate(function() {
					done();
				});
			});
			failingAsyncAction(1, 2, 3, handler.next(function(one, two, three) {
				assert.fail();
				done();
			}));
		});
	});

	describe('#nextIf(predicate, callback)', function() {
		it('should return a function that calls the given callback with all arguments except the first one if the first argument is falsy and the other arguments pass the given predicate', function(done) {
			function isTrue(one, two, three) {
				return true;
			}
			var handler = new CallbackHandler(function() {});
			successfulAsyncAction(1, 2, 3, handler.nextIf(isTrue, function(one, two, three) {
				assert.strictEqual(one, 1);
				assert.strictEqual(two, 2);
				assert.strictEqual(three, 3);
				done();
			}));
		});

		it('should return a function that calls the handler\'s callback with the first argument and null if the first argument is truthy', function(done) {
			function isTrue(one, two, three) {
				return true;
			}
			var handler = new CallbackHandler(function(err, data) {
				assert.lengthOf(arguments, 2);
				assert(err);
				assert.strictEqual(data, null);
				done();
			});
			failingAsyncAction(1, 2, 3, handler.nextIf(isTrue, function(one, two, three) {
				assert.fail();
				done();
			}));
		});

		it('should return a function that calls the handler\'s callback with all arguments if the first argument is falsy and the other arguments do not pass the given predicate', function(done) {
			function isFalse(one, two, three) {
				return false;
			}
			var handler = new CallbackHandler(function(err, one, two, three) {
				assert.lengthOf(arguments, 4);
				assert.strictEqual(err, null);
				assert.strictEqual(one, 1);
				assert.strictEqual(two, 2);
				assert.strictEqual(three, 3);
				done();
			});
			successfulAsyncAction(1, 2, 3, handler.nextIf(isFalse, function(one, two, three) {
				assert.fail();
			}));
		});

		it('should return a no-op function if the handler\'s callback has already been called', function(done) {
			function isTrue(one, two, three) {
				return true;
			}
			var handler = new CallbackHandler(function(err, data) {
				assert.lengthOf(arguments, 2);
				assert(err);
				assert.strictEqual(data, null);
				handler.nextIf(isTrue, function() {
					assert.fail();
					done();
				})
				setImmediate(function() {
					done();
				});
			});
			failingAsyncAction(1, 2, 3, handler.nextIf(isTrue, function(one, two, three) {
				assert.fail();
				done();
			}));
		});
	});

	describe('#flatten(callback)', function() {
		it('should return a function that calls the given callback with the second argument one-level flattened except the first one if the first argument is falsy', function(done) {
			var handler = new CallbackHandler(function() {});
			successfulAsyncAction([1, 2, 3], handler.flatten(function(one, two, three) {
				assert.strictEqual(one, 1);
				assert.strictEqual(two, 2);
				assert.strictEqual(three, 3);
				done();
			}));
		});

		it('should return a function that calls the handler\'s callback with the first argument and null if the first argument is truthy', function(done) {
			var handler = new CallbackHandler(function(err, data) {
				assert.lengthOf(arguments, 2);
				assert(err);
				assert.strictEqual(data, null);
				done();
			});
			failingAsyncAction([1, 2, 3], handler.flatten(function(one, two, three) {
				assert.fail();
				done();
			}));
		});

		it('should return a no-op function if the handler\'s callback has already been called', function(done) {
			var handler = new CallbackHandler(function(err, data) {
				assert.lengthOf(arguments, 2);
				assert(err);
				assert.strictEqual(data, null);
				handler.flatten(function() {
					assert.fail();
					done();
				})
				setImmediate(function() {
					done();
				});
			});
			failingAsyncAction([1, 2, 3], handler.flatten(function(one, two, three) {
				assert.fail();
				done();
			}));
		});
	});

	describe('#consume(callback)', function() {
		it('should return a function that calls the given callback without arguments if the first argument is falsy', function(done) {
			var handler = new CallbackHandler(function() {
				assert.fail();
			});
			function f() {
				assert.fail();
				done();
			}
			successfulAsyncAction(f, "1", "2", handler.consume(function() {
				assert.lengthOf(arguments, 0);
				done();
			}));
		});

		it('should return a function that calls the function given as its second argument as soon the handler is finalized', function(done) {
			var handler = new CallbackHandler(function() {});
			var n = 0;
			function f() {
				assert.strictEqual(n, 12);
				done();
			}
			successfulAsyncAction(f, handler.consume(function() {
				assert.strictEqual(n, 0);
				n = 3;
				successfulAsyncAction(1, 2, handler.next(function() {
					assert.strictEqual(n, 3);
					n = n * 4;
					handler.finalize(null, 1);
				}));
			}));
		});

		it('should return a function that calls the handler\'s callback with the first argument and null if the first argument is truthy', function(done) {
			var handler = new CallbackHandler(function(a, b) {
				assert.lengthOf(arguments, 2);
				assert(a);
				assert.strictEqual(b, null);
				done();
			});
			function f() {
				assert.fail();
				done();
			}
			failingAsyncAction(f, "a", "b", "c", handler.consume(function() {
				assert.fail();
				done();
			}));
		});

		it('should return a no-op function if the handler\'s callback has already been called', function(done) {
			var handler = new CallbackHandler(function() {});
			var called = 0;
			function f() {
				called++;
				assert.strictEqual(called, 1);
				failingAsyncAction(f, 1, 2, 3, handler.consume(function(one, two, three) {
					assert.fail();
				}));
				setImmediate(function() {
					assert.strictEqual(called, 1);
					done();
				});
			}
			successfulAsyncAction(f, 1, 2, 3, handler.consume(function(one, two, three) {
				handler.error("error");
			}));
		});
	});

	describe('#isFinalized()', function() {
		it('should return false if the handler\'s callback has not yet been called', function(done) {
			var handler = new CallbackHandler(function() {});
			assert.strictEqual(handler.isFinalized(), false);
			successfulAsyncAction(handler.next(function() {
				assert.strictEqual(handler.isFinalized(), false);
				done();
			}));
		});

		it('should return true if the handler\'s callback has already been called', function(done) {
			var handler = new CallbackHandler(function() {
				assert.strictEqual(handler.isFinalized(), true);
				done();
			});
			handler.finalize();
		});
	});
});