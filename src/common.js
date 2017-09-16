const RULE_TYPES = ['filename', 'referrer', 'mime'];

const MODES = ['Rename', 'Overwrite', 'Skip', 'Prompt'];

const MODE_TO_ACTION = create_mapping(
  MODES, ['uniquify', 'overwrite', undefined, 'prompt']);

const DEFAULT_MODE = MODES[2];

function create_map (keys, get_value) {
  let map = {};
  get_value = get_value || (key => key);
  keys = keys.slice();
  let define = function (name, value) {
    (define.p = define.p || {__proto__: null}).value = value;
    Object.defineProperty(map, name, define.p);
  };
  keys.forEach((key, index) => {
    let value = get_value(key);
    define(key, value);
    define(index, value);
  });
  define('keys', keys);
  define('length', keys.length);
  return Object.freeze(map);
}

function create_mapping (keys, values) {
  let desc = {__proto__: null};
  return keys.reduce((map, key, i) => {
    desc.value = values[i];
    Object.defineProperty(map, key, desc);
    return map;
  }, {});
}

function save_item (name, value) {
  if (value) value = JSON.stringify(value);
  localStorage.setItem(name, value);
}

function load_item (name) {
  let item = localStorage.getItem(name);
  if (item) return JSON.parse(item);
  return undefined;
}

function save_rule (rule_type, rules) {
  //let cache = load_rule.rules = load_rule.rules || {};
  //cache[rule_type] = rules;
  save_item(rule_type + '_rules', rules);
}

function load_rule (rule_type) {
  //let cache = load_rule.rules = load_rule.rules || {};
  //let rule = cache[rule_type] || load_item(rule_type + '_rules');
  //return cache[rule_type] = rule;
  return load_item(rule_type + '_rules');
}

function g (id) { return document.getElementById(id) }