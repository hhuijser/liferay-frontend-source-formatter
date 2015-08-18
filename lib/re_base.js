var _ = require('lodash');
var getObject = require('getobject');

var sub = require('string-sub');

var re = function(rules) {
	var rulesets = {};

	_.assign(rulesets, rules);

	this.rules = rulesets;
};

re.prototype = {
	getValue: getObject.get,

	getMessage: function(lineNum, item, result, rule, context) {
		var warning;

		var message = rule.message || this.message;

		if (rule.message === false) {
			message = false;
		}

		if (_.isString(message)) {
			warning = this.message(message, lineNum, item, result, rule, context);
		}
		else if (_.isFunction(message)) {
			warning = message.call(this, lineNum, item, result, rule, context);
		}

		return warning;
	},

	isValidRule: function(ruleName, rule, context) {
		return (ruleName !== 'IGNORE' && ruleName.indexOf('_') !== 0) &&
				(rule.ignore !== 'node' || !context.hasSheBang);
	},

	isValidRuleSet: function(rules, fullItem, context) {
		var validRuleSet = false;

		if (_.isObject(rules)) {
			var ignore = rules.IGNORE;
			var customIgnore = context.customIgnore;

			validRuleSet = (!ignore || (ignore && !ignore.test(fullItem))) &&
					(!customIgnore || (customIgnore && !customIgnore.test(fullItem)));
		}

		return validRuleSet;
	},

	iterateRules: function(rules, context) {
		var instance = this;

		if (_.isString(rules)) {
			rules = instance.getValue(instance.rules, rules);
		}

		var fullItem = context.fullItem;
		var item = context.item;
		var lineNum = context.lineNum;
		var logger = context.logger;

		if (instance.isValidRuleSet(rules, fullItem, context)) {
			_.forEach(
				rules,
				function(rule, ruleName) {
					if (instance.isValidRule(ruleName, rule, context)) {
						var result = instance.testLine(rule, context);

						if (result) {
							var warning = instance.getMessage(lineNum, item, result, rule, context);

							if (warning && logger) {
								logger(lineNum, warning);
							}

							fullItem = instance.replaceItem(lineNum, result, rule, context);
						}
					}
				}
			);
		}

		return fullItem;
	},

	match: function(item, re) {
		return item.match(re);
	},

	message: function(message, lineNum, item, result, rule) {
		return sub(message, lineNum, item);
	},

	replaceItem: function(lineNum, result, rule, context) {
		var replacer = rule.replacer;

		var fullItem = context.fullItem;

		if (replacer) {
			fullItem = this._callReplacer(fullItem, result, rule, context);

			context.fullItem = fullItem;

			fullItem = this._callFormatItem(fullItem, context);
		}

		return fullItem;
	},

	test: function(item, regex) {
		return regex.test(item);
	},

	testLine: function(rule, context) {
		var regex = rule.regex;
		var test = rule.test || this.test;

		if (test === 'match') {
			test = this.match;
		}

		var testItem = context.item;

		if (rule.testFullItem) {
			testItem = context.fullItem;
		}

		return test.call(this, testItem, regex, rule, context);
	},

	_callReplacer: function(fullItem, result, rule, context) {
		var replacer = rule.replacer;

		if (_.isString(replacer)) {
			fullItem = fullItem.replace(rule.regex, replacer);
		}
		else if (_.isFunction(replacer)) {
			fullItem = replacer.call(this, fullItem, result, rule, context);
		}

		return fullItem;
	},

	_callFormatItem: function(fullItem, context) {
		var formatItem = context.formatItem;

		if (formatItem) {
			fullItem = formatItem.call(this, fullItem, context);
		}

		return fullItem;
	}
};

module.exports = re;