var CallbackHandler = function(callback) {
	this._isFinalized = false;
	this._onFinalizeCallbacks = [];
	this.callback = callback;
};

CallbackHandler.prototype = {
	constructor: CallbackHandler,

	handle: function(func) {
		if (!this.isFinalized()) {
			func.call(null, this);
		}
	},
	next: function(callback) {
		var self = this;
		return function() {
			if (!self.isFinalized()) {
				if (arguments[0]) {
					self.finalize.apply(self, arguments);
				}
				else {
					[].shift.call(arguments);
					callback.apply(null, arguments);
				}
			}
		};
	},
	nextIf: function(predicate, callback) {
		var self = this;
		return function() {
			if (!self.isFinalized()) {
				if (arguments[0] || !predicate.apply(null, [].slice.call(arguments, 1))) {
					self.finalize.apply(self, arguments);
				}
				else {
					[].shift.call(arguments);
					callback.apply(null, arguments);
				}
			}
		};
	},
	last: function() {
		var self = this;
		return function() {
			self.finalize.apply(self, arguments);
		};
	},
	flatten: function(callback) {
		var self = this;
		return function() {
			if (!self.isFinalized()) {
				if (arguments[0]) {
					self.finalize.apply(self, arguments);
				}
				else {
					callback.apply(null, Array.isArray(arguments[1]) ? arguments[1] : []);
				}
			}
		};
	},
	consume: function(callback) {
		var self = this;
		return function(err, f) {
			if (!err) {
				self.onFinalize(f);
			}
			self.next(callback).call(null, err);
		};
	},
	success: function() {
		if (!this.isFinalized()) {
			[].unshift.call(arguments, null);
			this.finalize.apply(this, arguments);
		}
	},
	error: function() {
		if (!this.isFinalized()) {
			this.finalize.apply(this, arguments);
		}
	},
	finalize: function() {
		if (!this.isFinalized()) {
			this._isFinalized = true;
			this._onFinalizeCallbacks.slice().forEach(function(f) {
				f();
			});
			if (arguments[0]) {
				this.errorHandler.call(this, arguments[0], null)
			}
			else {
				[].shift.call(arguments);
				this.successHandler.apply(this, arguments)
			}
		}
	},
	onFinalize: function(f) {
		if (!this.isFinalized()) {
			this._onFinalizeCallbacks.push(f);;
		}
		return this;
	},
	isFinalized: function() {
		return !!this._isFinalized;
	},
	successHandler: function() {
		[].unshift.call(arguments, null);
		this.callback.apply(null, arguments);
	},
	errorHandler: function() {
		this.callback.apply(null, arguments);
	}
};

module.exports = CallbackHandler;