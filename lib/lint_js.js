var _ = require('lodash');
var eslint = require('eslint');
var ESLINT_CONFIG = require('./config/eslint');
var glob = require('glob');
var path = require('path');

var customRules = {};

var reactRules = require('eslint-plugin-react').rules;

_.defaults(customRules, reactRules);

var convertNameToRuleId = function(item) {
	var baseName = path.basename(item, '.js');

	return 'csf-' + baseName.replace(/_/g, '-');
};

var runLinter = function(contents, file, customRules, config) {
	eslint.linter.defineRules(customRules);

	if (_.isObject(config)) {
		config = _.merge({}, ESLINT_CONFIG, config);
	}
	else {
		config = ESLINT_CONFIG;
	}

	var ecmaVersion = _.get(config, 'parserOptions.ecmaVersion');

	if (ecmaVersion > 5) {
		var es6Config = require('./config/eslint_es6');

		_.merge(config, es6Config);
	}

	return eslint.linter.verify(contents, config, file);
};

var globOptions = {
	cwd: __dirname
};

module.exports = function(contents, file, config) {
	glob.sync(
		'./lint_js_rules/*.js',
		globOptions
	).forEach(
		function(item, index) {
			var id = convertNameToRuleId(item);

			customRules[id] = require(item);
		}
	);

	// eslint.linter.defineRules(customRules);

	return runLinter(contents, file, customRules, config);
};

module.exports.convertNameToRuleId = convertNameToRuleId;
module.exports.eslint = eslint;
module.exports.linter = eslint.linter;
module.exports.runLinter = runLinter;