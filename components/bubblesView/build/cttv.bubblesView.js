(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
// if (typeof bubblesView === "undefined") {
//     module.exports = bubblesView = {}
// }
// bubblesView.bubblesView = require("./src/bubblesView.js");
module.exports = bubblesView = require("./src/bubblesView.js");

},{"./src/bubblesView.js":11}],3:[function(require,module,exports){
var node = require("./src/node.js");
module.exports = exports = node;

},{"./src/node.js":10}],4:[function(require,module,exports){
module.exports = require("./src/api.js");

},{"./src/api.js":5}],5:[function(require,module,exports){
var api = function (who) {

    var _methods = function () {
	var m = [];

	m.add_batch = function (obj) {
	    m.unshift(obj);
	};

	m.update = function (method, value) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			m[i][p] = value;
			return true;
		    }
		}
	    }
	    return false;
	};

	m.add = function (method, value) {
	    if (m.update (method, value) ) {
	    } else {
		var reg = {};
		reg[method] = value;
		m.add_batch (reg);
	    }
	};

	m.get = function (method) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			return m[i][p];
		    }
		}
	    }
	};

	return m;
    };

    var methods    = _methods();
    var api = function () {};

    api.check = function (method, check, msg) {
	if (method instanceof Array) {
	    for (var i=0; i<method.length; i++) {
		api.check(method[i], check, msg);
	    }
	    return;
	}

	if (typeof (method) === 'function') {
	    method.check(check, msg);
	} else {
	    who[method].check(check, msg);
	}
	return api;
    };

    api.transform = function (method, cbak) {
	if (method instanceof Array) {
	    for (var i=0; i<method.length; i++) {
		api.transform (method[i], cbak);
	    }
	    return;
	}

	if (typeof (method) === 'function') {
	    method.transform (cbak);
	} else {
	    who[method].transform(cbak);
	}
	return api;
    };

    var attach_method = function (method, opts) {
	var checks = [];
	var transforms = [];

	var getter = opts.on_getter || function () {
	    return methods.get(method);
	};

	var setter = opts.on_setter || function (x) {
	    for (var i=0; i<transforms.length; i++) {
		x = transforms[i](x);
	    }

	    for (var j=0; j<checks.length; j++) {
		if (!checks[j].check(x)) {
		    var msg = checks[j].msg || 
			("Value " + x + " doesn't seem to be valid for this method");
		    throw (msg);
		}
	    }
	    methods.add(method, x);
	};

	var new_method = function (new_val) {
	    if (!arguments.length) {
		return getter();
	    }
	    setter(new_val);
	    return who; // Return this?
	};
	new_method.check = function (cbak, msg) {
	    if (!arguments.length) {
		return checks;
	    }
	    checks.push ({check : cbak,
			  msg   : msg});
	    return this;
	};
	new_method.transform = function (cbak) {
	    if (!arguments.length) {
		return transforms;
	    }
	    transforms.push(cbak);
	    return this;
	};

	who[method] = new_method;
    };

    var getset = function (param, opts) {
	if (typeof (param) === 'object') {
	    methods.add_batch (param);
	    for (var p in param) {
		attach_method (p, opts);
	    }
	} else {
	    methods.add (param, opts.default_value);
	    attach_method (param, opts);
	}
    };

    api.getset = function (param, def) {
	getset(param, {default_value : def});

	return api;
    };

    api.get = function (param, def) {
	var on_setter = function () {
	    throw ("Method defined only as a getter (you are trying to use it as a setter");
	};

	getset(param, {default_value : def,
		       on_setter : on_setter}
	      );

	return api;
    };

    api.set = function (param, def) {
	var on_getter = function () {
	    throw ("Method defined only as a setter (you are trying to use it as a getter");
	};

	getset(param, {default_value : def,
		       on_getter : on_getter}
	      );

	return api;
    };

    api.method = function (name, cbak) {
	if (typeof (name) === 'object') {
	    for (var p in name) {
		who[p] = name[p];
	    }
	} else {
	    who[name] = cbak;
	}
	return api;
    };

    return api;
    
};

module.exports = exports = api;
},{}],6:[function(require,module,exports){
module.exports = require("./src/index.js");

},{"./src/index.js":7}],7:[function(require,module,exports){
// require('fs').readdirSync(__dirname + '/').forEach(function(file) {
//     if (file.match(/.+\.js/g) !== null && file !== __filename) {
// 	var name = file.replace('.js', '');
// 	module.exports[name] = require('./' + file);
//     }
// });

// Same as
var utils = require("./utils.js");
utils.reduce = require("./reduce.js");
module.exports = exports = utils;

},{"./reduce.js":8,"./utils.js":9}],8:[function(require,module,exports){
var reduce = function () {
    var smooth = 5;
    var value = 'val';
    var redundant = function (a, b) {
	if (a < b) {
	    return ((b-a) <= (b * 0.2));
	}
	return ((a-b) <= (a * 0.2));
    };
    var perform_reduce = function (arr) {return arr;};

    var reduce = function (arr) {
	if (!arr.length) {
	    return arr;
	}
	var smoothed = perform_smooth(arr);
	var reduced  = perform_reduce(smoothed);
	return reduced;
    };

    var median = function (v, arr) {
	arr.sort(function (a, b) {
	    return a[value] - b[value];
	});
	if (arr.length % 2) {
	    v[value] = arr[~~(arr.length / 2)][value];	    
	} else {
	    var n = ~~(arr.length / 2) - 1;
	    v[value] = (arr[n][value] + arr[n+1][value]) / 2;
	}

	return v;
    };

    var clone = function (source) {
	var target = {};
	for (var prop in source) {
	    if (source.hasOwnProperty(prop)) {
		target[prop] = source[prop];
	    }
	}
	return target;
    };

    var perform_smooth = function (arr) {
	if (smooth === 0) { // no smooth
	    return arr;
	}
	var smooth_arr = [];
	for (var i=0; i<arr.length; i++) {
	    var low = (i < smooth) ? 0 : (i - smooth);
	    var high = (i > (arr.length - smooth)) ? arr.length : (i + smooth);
	    smooth_arr[i] = median(clone(arr[i]), arr.slice(low,high+1));
	}
	return smooth_arr;
    };

    reduce.reducer = function (cbak) {
	if (!arguments.length) {
	    return perform_reduce;
	}
	perform_reduce = cbak;
	return reduce;
    };

    reduce.redundant = function (cbak) {
	if (!arguments.length) {
	    return redundant;
	}
	redundant = cbak;
	return reduce;
    };

    reduce.value = function (val) {
	if (!arguments.length) {
	    return value;
	}
	value = val;
	return reduce;
    };

    reduce.smooth = function (val) {
	if (!arguments.length) {
	    return smooth;
	}
	smooth = val;
	return reduce;
    };

    return reduce;
};

var block = function () {
    var red = reduce()
	.value('start');

    var value2 = 'end';

    var join = function (obj1, obj2) {
        return {
            'object' : {
                'start' : obj1.object[red.value()],
                'end'   : obj2[value2]
            },
            'value'  : obj2[value2]
        };
    };

    // var join = function (obj1, obj2) { return obj1 };

    red.reducer( function (arr) {
	var value = red.value();
	var redundant = red.redundant();
	var reduced_arr = [];
	var curr = {
	    'object' : arr[0],
	    'value'  : arr[0][value2]
	};
	for (var i=1; i<arr.length; i++) {
	    if (redundant (arr[i][value], curr.value)) {
		curr = join(curr, arr[i]);
		continue;
	    }
	    reduced_arr.push (curr.object);
	    curr.object = arr[i];
	    curr.value = arr[i].end;
	}
	reduced_arr.push(curr.object);

	// reduced_arr.push(arr[arr.length-1]);
	return reduced_arr;
    });

    reduce.join = function (cbak) {
	if (!arguments.length) {
	    return join;
	}
	join = cbak;
	return red;
    };

    reduce.value2 = function (field) {
	if (!arguments.length) {
	    return value2;
	}
	value2 = field;
	return red;
    };

    return red;
};

var line = function () {
    var red = reduce();

    red.reducer ( function (arr) {
	var redundant = red.redundant();
	var value = red.value();
	var reduced_arr = [];
	var curr = arr[0];
	for (var i=1; i<arr.length-1; i++) {
	    if (redundant (arr[i][value], curr[value])) {
		continue;
	    }
	    reduced_arr.push (curr);
	    curr = arr[i];
	}
	reduced_arr.push(curr);
	reduced_arr.push(arr[arr.length-1]);
	return reduced_arr;
    });

    return red;

};

module.exports = reduce;
module.exports.line = line;
module.exports.block = block;


},{}],9:[function(require,module,exports){

module.exports = {
    iterator : function(init_val) {
	var i = init_val || 0;
	var iter = function () {
	    return i++;
	};
	return iter;
    },

    script_path : function (script_name) { // script_name is the filename
	var script_scaped = script_name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	var script_re = new RegExp(script_scaped + '$');
	var script_re_sub = new RegExp('(.*)' + script_scaped + '$');

	// TODO: This requires phantom.js or a similar headless webkit to work (document)
	var scripts = document.getElementsByTagName('script');
	var path = "";  // Default to current path
	if(scripts !== undefined) {
            for(var i in scripts) {
		if(scripts[i].src && scripts[i].src.match(script_re)) {
                    return scripts[i].src.replace(script_re_sub, '$1');
		}
            }
	}
	return path;
    },

    defer_cancel : function (cbak, time) {
	var tick;

	var defer_cancel = function () {
	    clearTimeout(tick);
	    tick = setTimeout(cbak, time);
	};

	return defer_cancel;
    }
};

},{}],10:[function(require,module,exports){
var apijs = require("tnt.api");
var iterator = require("tnt.utils").iterator;

var tnt_node = function (data) {
//tnt.tree.node = function (data) {
    "use strict";

    var node = function () {
    };

    var api = apijs (node);

    // API
//     node.nodes = function() {
// 	if (cluster === undefined) {
// 	    cluster = d3.layout.cluster()
// 	    // TODO: length and children should be exposed in the API
// 	    // i.e. the user should be able to change this defaults via the API
// 	    // children is the defaults for parse_newick, but maybe we should change that
// 	    // or at least not assume this is always the case for the data provided
// 		.value(function(d) {return d.length})
// 		.children(function(d) {return d.children});
// 	}
// 	nodes = cluster.nodes(data);
// 	return nodes;
//     };

    var apply_to_data = function (data, cbak) {
	cbak(data);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		apply_to_data(data.children[i], cbak);
	    }
	}
    };

    var create_ids = function () {
	var i = iterator(1);
	// We can't use apply because apply creates new trees on every node
	// We should use the direct data instead
	apply_to_data (data, function (d) {
	    if (d._id === undefined) {
		d._id = i();
		// TODO: Not sure _inSubTree is strictly necessary
		// d._inSubTree = {prev:true, curr:true};
	    }
	});
    };

    var link_parents = function (data) {
	if (data === undefined) {
	    return;
	}
	if (data.children === undefined) {
	    return;
	}
	for (var i=0; i<data.children.length; i++) {
	    // _parent?
	    data.children[i]._parent = data;
	    link_parents(data.children[i]);
	}
    };

    var compute_root_dists = function (data) {
	apply_to_data (data, function (d) {
	    var l;
	    if (d._parent === undefined) {
		d._root_dist = 0;
	    } else {
		var l = 0;
		if (d.branch_length) {
		    l = d.branch_length
		}
		d._root_dist = l + d._parent._root_dist;
	    }
	});
    };

    // TODO: data can't be rewritten used the api yet. We need finalizers
    node.data = function(new_data) {
	if (!arguments.length) {
	    return data
	}
	data = new_data;
	create_ids();
	link_parents(data);
	compute_root_dists(data);
	return node;
    };
    // We bind the data that has been passed
    node.data(data);

    api.method ('find_all', function (cbak, deep) {
	var nodes = [];
	node.apply (function (n) {
	    if (cbak(n)) {
		nodes.push (n);
	    }
	});
	return nodes;
    });
    
    api.method ('find_node', function (cbak, deep) {
	if (cbak(node)) {
	    return node;
	}

	if (data.children !== undefined) {
	    for (var j=0; j<data.children.length; j++) {
		var found = tnt_node(data.children[j]).find_node(cbak, deep);
		if (found) {
		    return found;
		}
	    }
	}

	if (deep && (data._children !== undefined)) {
	    for (var i=0; i<data._children.length; i++) {
		tnt_node(data._children[i]).find_node(cbak, deep)
		var found = tnt_node(data._children[i]).find_node(cbak, deep);
		if (found) {
		    return found;
		}
	    }
	}
    });

    api.method ('find_node_by_name', function(name, deep) {
	return node.find_node (function (node) {
	    return node.node_name() === name
	}, deep);
    });

    api.method ('toggle', function() {
	if (data) {
	    if (data.children) { // Uncollapsed -> collapse
		var hidden = 0;
		node.apply (function (n) {
		    var hidden_here = n.n_hidden() || 0;
		    hidden += (n.n_hidden() || 0) + 1;
		});
		node.n_hidden (hidden-1);
		data._children = data.children;
		data.children = undefined;
	    } else {             // Collapsed -> uncollapse
		node.n_hidden(0);
		data.children = data._children;
		data._children = undefined;
	    }
	}
	return this;
    });

    api.method ('is_collapsed', function () {
	return (data._children !== undefined && data.children === undefined);
    });

    var has_ancestor = function(n, ancestor) {
	// It is better to work at the data level
	n = n.data();
	ancestor = ancestor.data();
	if (n._parent === undefined) {
	    return false
	}
	n = n._parent
	for (;;) {
	    if (n === undefined) {
		return false;
	    }
	    if (n === ancestor) {
		return true;
	    }
	    n = n._parent;
	}
    };

    // This is the easiest way to calculate the LCA I can think of. But it is very inefficient too.
    // It is working fine by now, but in case it needs to be more performant we can implement the LCA
    // algorithm explained here:
    // http://community.topcoder.com/tc?module=Static&d1=tutorials&d2=lowestCommonAncestor
    api.method ('lca', function (nodes) {
	if (nodes.length === 1) {
	    return nodes[0];
	}
	var lca_node = nodes[0];
	for (var i = 1; i<nodes.length; i++) {
	    lca_node = _lca(lca_node, nodes[i]);
	}
	return lca_node;
	// return tnt_node(lca_node);
    });

    var _lca = function(node1, node2) {
	if (node1.data() === node2.data()) {
	    return node1;
	}
	if (has_ancestor(node1, node2)) {
	    return node2;
	}
	return _lca(node1, node2.parent());
    };

    api.method('n_hidden', function (val) {
	if (!arguments.length) {
	    return node.property('_hidden');
	}
	node.property('_hidden', val);
	return node
    });

    api.method ('get_all_nodes', function (deep) {
	var nodes = [];
	node.apply(function (n) {
	    nodes.push(n);
	}, deep);
	return nodes;
    });

    api.method ('get_all_leaves', function (deep) {
	var leaves = [];
	node.apply(function (n) {
	    if (n.is_leaf(deep)) {
		leaves.push(n);
	    }
	}, deep);
	return leaves;
    });

    api.method ('upstream', function(cbak) {
	cbak(node);
	var parent = node.parent();
	if (parent !== undefined) {
	    parent.upstream(cbak);
	}
//	tnt_node(parent).upstream(cbak);
// 	node.upstream(node._parent, cbak);
    });

    api.method ('subtree', function(nodes, keep_singletons) {
	if (keep_singletons === undefined) {
	    keep_singletons = false;
	}
    	var node_counts = {};
    	for (var i=0; i<nodes.length; i++) {
	    var n = nodes[i];
	    if (n !== undefined) {
		n.upstream (function (this_node){
		    var id = this_node.id();
		    if (node_counts[id] === undefined) {
			node_counts[id] = 0;
		    }
		    node_counts[id]++
    		});
	    }
    	}
    
	var is_singleton = function (node_data) {
	    var n_children = 0;
	    if (node_data.children === undefined) {
		return false;
	    }
	    for (var i=0; i<node_data.children.length; i++) {
		var id = node_data.children[i]._id;
		if (node_counts[id] > 0) {
		    n_children++;
		}
	    }
	    return n_children === 1;
	};

	var subtree = {};
	copy_data (data, subtree, 0, function (node_data) {
	    var node_id = node_data._id;
	    var counts = node_counts[node_id];
	    
	    // Is in path
	    if (counts > 0) {
		if (is_singleton(node_data) && !keep_singletons) {
		    return false; 
		}
		return true;
	    }
	    // Is not in path
	    return false;
	});

	return tnt_node(subtree.children[0]);
    });

    var copy_data = function (orig_data, subtree, currBranchLength, condition) {
        if (orig_data === undefined) {
	    return;
        }

        if (condition(orig_data)) {
	    var copy = copy_node(orig_data, currBranchLength);
	    if (subtree.children === undefined) {
                subtree.children = [];
	    }
	    subtree.children.push(copy);
	    if (orig_data.children === undefined) {
                return;
	    }
	    for (var i = 0; i < orig_data.children.length; i++) {
                copy_data (orig_data.children[i], copy, 0, condition);
	    }
        } else {
	    if (orig_data.children === undefined) {
                return;
	    }
	    currBranchLength += orig_data.branch_length || 0;
	    for (var i = 0; i < orig_data.children.length; i++) {
                copy_data(orig_data.children[i], subtree, currBranchLength, condition);
	    }
        }
    };

    var copy_node = function (node_data, extraBranchLength) {
	var copy = {};
	// copy all the own properties excepts links to other nodes or depth
	for (var param in node_data) {
	    if ((param === "children") ||
		(param === "_children") ||
		(param === "_parent") ||
		(param === "depth")) {
		continue;
	    }
	    if (node_data.hasOwnProperty(param)) {
		copy[param] = node_data[param];
	    }
	}
	if ((copy.branch_length !== undefined) && (extraBranchLength !== undefined)) {
	    copy.branch_length += extraBranchLength;
	}
	return copy;
    };

    
    // TODO: This method visits all the nodes
    // a more performant version should return true
    // the first time cbak(node) is true
    api.method ('present', function (cbak) {
	// cbak should return true/false
	var is_true = false;
	node.apply (function (n) {
	    if (cbak(n) === true) {
		is_true = true;
	    }
	});
	return is_true;
    });

    // cbak is called with two nodes
    // and should return a negative number, 0 or a positive number
    api.method ('sort', function (cbak) {
	if (data.children === undefined) {
	    return;
	}

	var new_children = [];
	for (var i=0; i<data.children.length; i++) {
	    new_children.push(tnt_node(data.children[i]));
	}

	new_children.sort(cbak);

	data.children = [];
	for (var i=0; i<new_children.length; i++) {
	    data.children.push(new_children[i].data());
	}

	for (var i=0; i<data.children.length; i++) {
	    tnt_node(data.children[i]).sort(cbak);
	}
    });

    api.method ('flatten', function () {
	if (node.is_leaf()) {
	    return node;
	}
	var data = node.data();
	var newroot = copy_node(data);
	var leaves = node.get_all_leaves();
	newroot.children = [];
	for (var i=0; i<leaves.length; i++) {
	    newroot.children.push(copy_node(leaves[i].data()));
	}

	return tnt_node(newroot);
    });

    
    // TODO: This method only 'apply's to non collapsed nodes (ie ._children is not visited)
    // Would it be better to have an extra flag (true/false) to visit also collapsed nodes?
    api.method ('apply', function(cbak, deep) {
	if (deep === undefined) {
	    deep = false;
	}
	cbak(node);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		var n = tnt_node(data.children[i])
		n.apply(cbak, deep);
	    }
	}

	if ((data._children !== undefined) && deep) {
	    for (var j=0; j<data._children.length; j++) {
		var n = tnt_node(data._children[j]);
		n.apply(cbak, deep);
	    }
	}
    });

    // TODO: Not sure if it makes sense to set via a callback:
    // root.property (function (node, val) {
    //    node.deeper.field = val
    // }, 'new_value')
    api.method ('property', function(prop, value) {
	if (arguments.length === 1) {
	    if ((typeof prop) === 'function') {
		return prop(data)	
	    }
	    return data[prop]
	}
	if ((typeof prop) === 'function') {
	    prop(data, value);   
	}
	data[prop] = value;
	return node;
    });

    api.method ('is_leaf', function(deep) {
	if (deep) {
	    return ((data.children === undefined) && (data._children === undefined));
	}
	return data.children === undefined;
    });

    // It looks like the cluster can't be used for anything useful here
    // It is now included as an optional parameter to the tnt.tree() method call
    // so I'm commenting the getter
    // node.cluster = function() {
    // 	return cluster;
    // };

    // node.depth = function (node) {
    //     return node.depth;
    // };

//     node.name = function (node) {
//         return node.name;
//     };

    api.method ('id', function () {
	return node.property('_id');
    });

    api.method ('node_name', function () {
	return node.property('name');
    });

    api.method ('branch_length', function () {
	return node.property('branch_length');
    });

    api.method ('root_dist', function () {
	return node.property('_root_dist');
    });

    api.method ('children', function (deep) {
	var children = [];

	if (data.children) {
	    for (var i=0; i<data.children.length; i++) {
		children.push(tnt_node(data.children[i]));
	    }
	}
	if ((data._children) && deep) {
	    for (var j=0; j<data._children.length; j++) {
		children.push(tnt_node(data._children[j]));
	    }
	}
	if (children.length === 0) {
	    return undefined;
	}
	return children;
    });

    api.method ('parent', function () {
	if (data._parent === undefined) {
	    return undefined;
	}
	return tnt_node(data._parent);
    });

    return node;

};

module.exports = exports = tnt_node;


},{"tnt.api":4,"tnt.utils":6}],11:[function(require,module,exports){
var tree_node = require("tnt.tree.node");

var bubblesView = function () {
    "use strict";
    
    var conf = {
	diameter : 600,
	format : d3.format(",d"),
	color : d3.scale.category20c(),
	colorPalette : true,
	data : undefined,
	value : "value",
	key : "name",
	label: "name",
	divId : undefined,
	onclick : function () {},
	duration: 1000,
	breadcrumsClick : function () {
	    render.focus(conf.data);
	},
	maxVal : 1,
	legendText : "<text>Current score range</text>"
	//labelOffset : 10
    };

    var focus; // undef by default
    var highlight; // undef by default
    var view;
    var svg;
    var legend;
    var bubblesView_g;
    var breadcrums;
    var pack;
    var nodes;
    var circle;
    var label;
    var path;

    var currTranslate = [0,0];
    var currScale = 1;
    // var zoom = d3.behavior.zoom()
    // 	.scaleExtent([0.8, Infinity])
    // 	.on("zoom", function () {
    // 	    redraw(svg);
    // 	});
    
    /*
     * Render valid JSON data
     */
    var render = function(div) {
	conf.divId = d3.select(div).attr("id");

	// breadcrums-like navigation
	breadcrums = d3.select(div)
	    .append("div")
	    .attr("id", "cttv_bubblesView_breadcrums")
	    .attr("height","50");
	
	svg = d3.select(div)
	    .append("svg")
	    .attr("width", conf.diameter)
            .attr("height", conf.diameter)
	    .attr("class", "cttv_bubblesView");

	bubblesView_g = svg
	    .append("g");
	
	pack = d3.layout.pack()
	    .value(function (d) {
		return d[conf.value];
	    })
            .sort(null)
            .size([conf.diameter, conf.diameter])
            .padding(1.5);

	if (conf.maxVal !== undefined) {
	    legend = svg
		.append("g")
		.attr("transform", "translate(20, " + (conf.diameter - 20) + ")");
	    legend
		.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", 80)
		.attr("height", 5)
		.attr("fill", "#c6dcec");
	    legend
		.append("rect")
		.attr("class", "cttv_bubblesView_legendBar")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", 0)
		.attr("height", 5)
		.attr("fill", d3.rgb(62,139,173));
	    legend
		.append("polygon")
	    	.attr("points", "0,5 -5,15 5,15")
	    	.attr("fill", "none")
	    	.attr("stroke", "black")
	    	.attr("stroke-width", 2);

	    legend
	    	.append("text")
		.attr("class", "cttv_bubblesView_currentMaxValue")
	    	.attr("x", 0)
	    	.attr("y", -5)
	    	.attr("text-anchor", "middle")
	    	.text("0");

	    legend
		.append("text")
		.attr("x", -5)
		.attr("y", 5)
		.attr("text-anchor", "end")
		.text(0);

	    legend
		.append("text")
		.attr("x", 85)
		.attr("y", 5)
		.attr("text-anchor", "start")
		.text(conf.maxVal);

	    legend
		.append("g")
		.attr("transform", "translate(100, 5)")
		.html(conf.legendText);
	    
	    // legend
	    // 	.append("a")
	    // 	.attr("x", 100)
	    // 	.attr("y", 5)
	    // 	.attr("text-anchor", "start")
	    // 	.html("<a href='xlink:href=\"http://www.google.com\"'>Hurrah!</a>");

	}
	
	render.update();

	var d = conf.data.data();
	view = [d.x, d.y, d.r*2];
	//focusTo([d.x, d.y, d.r*2]);
	//render.focus (conf.data);

	return render;
    };

    render.update = function () {
	// Safely unfocus on update

	if (conf.data.children()) {
	    render.focus(conf.data);
	}
	
	var packData = pack.nodes(conf.data.data());
	
	circle = bubblesView_g.selectAll("circle")
	    .data(packData, function (d) {
		if (d._parent === undefined) {
		    return d[conf.key];
		}
		return d[conf.key] + "_" + d._parent[conf.key];
	    });
	//.data(packData)

	// new circles
	circle
            .enter()
	    .append("circle")
	    .attr("class", function (d) {
		return "bubblesView_" + d[conf.key] + "_" + conf.divId;
	    })
	    .classed("bubblesViewNode", true)

	    .on("dblclick", function () {
		if (d3.event.defaultPrevented) {
		    return;
		}
		d3.event.stopPropagation();
	    })
	    .on("click", function (d) {
		if (d3.event.defaultPrevented) {
		    return;
		}
		conf.onclick.call(this, tree_node(d));
	    });
	circle.exit().remove();

	// // titles
	// bubblesView_g.selectAll("title")
	//     .data(packData, function (d) {
	// 	return d._id;
	//     })
	//     .enter()
	//     .append("title")
        //     .text(function(d) { return d[conf.key] + ": " + conf.format(d[conf.value]); });	
	
        //newNodes.append ("circle");

        //newNodes.append("text");

	path = bubblesView_g.selectAll("path")
	    .data(packData, function (d) {
		if (d._parent === undefined) {
		    return d[conf.key];
		}
		return d[conf.key] + "_" + d._parent[conf.key];
	    });
	// new paths
	path
	//.data(packData)
	    .enter()
	    .append("path")
	    // .attr ("id", function (d, i) {
	    // 	return "s" + i;
	    // })
	    .attr("id", function(d,i){
	    	if (d._parent === undefined) {
	    	    return "s_" + d[conf.key];
	    	}
	    	return "s_"+ d[conf.key] + "_" + d._parent[conf.key];
	    })
	    .attr("fill", "none");


	label = bubblesView_g.selectAll("text")
	    .data(packData, function (d) {
		if (d._parent === undefined) {
		    return d[conf.key];
		}
		return d[conf.key] + "_" + d._parent[conf.key];
	    });
	//.data(packData)

	var newLabels = label
	    .enter()
	    .append("text")
	    .attr("class", function (d) {
		if (d.children) return "topLabel";
		return "leafLabel";
	    })
	    .style("cursor", "default")
	    .attr("pointer-events", function (d) {return d.children ? "auto" : "none";})
	    .on("click", function (d) { // only on those with pointer-events "auto" ie, on therapeutic areas labels
		if (d3.event.defaultPrevented) {
		    return;
		}
		conf.onclick.call(this, tree_node(d));
	    })
	    .attr("fill", "navy")
	    .attr("font-size", 10)
	    .attr("text-anchor", "middle");

	// Create new labels on therapeutic areas
	newLabels
	    .each(function (d, i) {
		if (d.children) {
		    d3.select(this)
			.append("textPath")
			// .attr("xlink:href", function () {
			//     return "#s" + i;
			// })
			.attr("xlink:href", function () {
			    if (d._parent === undefined) {
				return "#s_" + d[conf.key];
			    }
			    return "#s_" + d[conf.key] + "_" + d._parent[conf.key];
			})
			.attr("startOffset", "50%")
			.text(function () {
			    return d[conf.label] ? d[conf.label].substring(0, Math.PI*d.r/8) : "";
			});
		}
	    });

	label.exit().remove();

	var updateTransition = bubblesView_g.transition()
	    .duration(conf.duration);

	updateTransition
	    .selectAll("circle")
	    .attr("cx", function (d) {
		return d.x;
	    })
	    .attr("cy", function (d) {
		return d.y;
	    })
	    .attr("r", function (d) {
		return d.r;
	    });

	// Move labels
	updateTransition
	    .selectAll(".leafLabel")
	    .attr("dy", ".3em")
	    .attr("x", function (d) { return d.x; })
	    .attr("y", function (d) { return d.y; })
	    .text(function (d) {
		return d[conf.label].substring(0, d.r / 3);
	    });
	
	// Move labels
	// label
	//     .each(function (d, i) {
	// 	if (!d.children) {
	// 	    d3.select(this)
	// 		.transition()
	// 		.duration(conf.duration)
	// 		.attr("dy", ".3em")
	// 		.attr("x", function (d) { return d.x; })
	// 		.attr("y", function (d) { return d.y; })
	// 		.text(function (d) {
	// 		    return d[conf.label].substring(0, d.r / 3);
	// 		});
	// 	}
	//     });

	updateTransition
	    .selectAll("path")
	    .attr("d", function (d) {
		return describeArc(d.x, d.y+10, d.r, 160, -160);
	    });

	
	// Moving nodes
	circle
	    //.attr("class", "node")
	    .classed ("bubblesViewLeaf", function (d) {
		return !d.children;
	    })
	    .classed ("bubblesViewRoot", function (d) {
		return !d._parent;
	    });
	    // .transition()
	    // .duration(conf.duration)
	    // .attr("cx", function (d) {
	    // 	return d.x;
	    // })
	    // .attr("cy", function (d) { return d.y; })
	    // .attr("r", function (d) { return d.r; });


	// .attr("transform", function(d) {
	    // 	return "translate(" + d.x + "," + d.y + ")";
	    // });

	//	nodes.select("path")			   

	//nodes.select("text")
	
        // nodes.select("circle")
	//     .attr ("class", function (d) {
	//     	return "bubblesView_" + d[conf.key] + "_" + conf.divId;
	//     })
	//     .transition()
	//     .duration(conf.duration)
	//     .attr ("r", function(d) {
	// 	//return d.r - (d.children ? 0 : conf.labelOffset);
	// 	return d.r;
	//     });
	
	//circle = nodes.selectAll("circle");

	// Exiting nodes
	// nodes
	//     .exit()
	//     .remove();

	// Size legend
	var maxCurrentVal = 0;
	conf.data.apply(function (node) {
	    var score = node.property("association_score");
	    if (score && score > maxCurrentVal) {
		maxCurrentVal = score;
	    }
	});

	if (conf.maxVal !== undefined) {
	    var legendScale = d3.scale.linear()
		.range([0,80])
		.domain([0,conf.maxVal]);

	    var pos = legendScale(maxCurrentVal);
	    legend
		.select(".cttv_bubblesView_legendBar")
		.transition()
		.duration(conf.duration)
		.attr("width", pos);
	    legend
		.select("polygon")
		.transition()
		.duration(conf.duration)
	    	.attr("points", ((pos+0) + ",5 " + (pos-5) + ",15 " + (pos+5) + ",15"));
	    legend
		.select(".cttv_bubblesView_currentMaxValue")
		.transition()
		.duration(conf.duration)
	    	.attr("x", pos)
	    	.text(maxCurrentVal);
	}
    };

    ////////////////////////
    // Auxiliar functions //
    ////////////////////////

    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
	var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
	return {
	    x: centerX + (radius * Math.cos(angleInRadians)),
	    y: centerY + (radius * Math.sin(angleInRadians))
	};
    }

    function describeArc(x, y, radius, startAngle, endAngle){
	var start = polarToCartesian(x, y, radius, endAngle);
	var end = polarToCartesian(x, y, radius, startAngle);
	var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
	var d = [
	    "M", start.x, start.y,
	    "A", radius, radius, 0, 1, 1, end.x, end.y
	].join(" ");
	return d;
    }
    
    function redraw (viz) {
	viz.attr ("transform",
		   "translate (" + d3.event.translate + ") " +
		  "scale (" + d3.event.scale + ")");
    }
    
    function focusTo (v) {
	var k = conf.diameter / v[2];
	var offset = conf.diameter / 2;
	view = v;

	circle
	    .attr("cx", function (d) {
		return ((d.x - v[0])*k)+offset;
	    })
	    .attr("cy", function (d) {
		return ((d.y - v[1])*k)+offset;
	    })
	    // .attr("transform", function(d) {
	    // 	return "translate(" + (((d.x - v[0]) * k) + offset) + "," + (((d.y - v[1]) * k) + offset) + ")";
	    // });
	    .attr("r", function(d) {
		return d.r * k;
	    });

	path
	    .attr("d", function (d) {
		return describeArc(((d.x-v[0])*k)+offset, ((d.y-v[1])*k)+10+offset, d.r*k, 160, -160);
	    });

	label
	    .each(function (d, i) {
		if (d.children) {
		    d3.select(this)
			.select("*")
			.remove();
		    d3.select(this)
		    	.append("textPath")
			// .attr("xlink:href", function () {
			//     return "#s"+i;
			// })
			.attr("xlink:href", function () {
			    if (d._parent === undefined) {
				return "#s_" + d[conf.key];
			    }
			    return "#s_" + d[conf.key] + "_" + d._parent[conf.key];
			})
			.attr("startOffset", "50%")
			.text(function () {
			    return d[conf.label] ? d[conf.label].substring(0, Math.PI*d.r*k/8) : "";
			});
		} else {
		    d3.select(this)
		    	.attr("x", function (d) { return ((d.x - v[0])*k)+offset; })
			.attr("y", function (d) { return ((d.y - v[1])*k)+offset; })
		    	.text(function (d) {
			    if (d[conf.label]) {
				return d[conf.label].substring(0, d.r*k / 3);
			    }
			})
			.attr("font-size", function (d) {
			    var circleLength = d.r * k / 3;
			    var labelLength = d[conf.label] ? d[conf.label].length : 0;
			    if (circleLength < labelLength) {
				return 10;
			    }
			    if (circleLength * 0.8 < labelLength) {
				return 12;
			    }
			    if (circleLength * 0.6 < labelLength) {
				return 14;
			    }
			});
		}
	    });
    }

    //////////
    // API  //
    //////////

    render.maxVal = function (v) {
	if (!arguments.length) {
	    return conf.maxVal;
	}
	conf.maxVal = v;
	return this;
    };

    render.legendText = function (t) {
	if (!arguments.length) {
	    return conf.legendText;
	}
	conf.legendText = t;
	return this;
    };
    
    render.select = function (nodes) {
	if (!arguments.length) {
	    return highlight;
	}
	highlight = nodes;

	// Unhighlight everything
	d3.selectAll(".highlight")
	    .classed("highlight", false);

	// No node to highlight
	if ((nodes === null) || (nodes === undefined) || (nodes.length === 0)) {
	    return this;
	}

	for (var i=0; i<nodes.length; i++) {
	    var node = nodes[i];
	    var circle = d3.selectAll(".bubblesView_" + node.property(conf.key) + "_" + conf.divId);
	    circle
		.classed ("highlight", true);
	}
	return this;
    };
    
    render.focus = function (node) {
	if (!arguments.length) {
	    return focus;
	}

	// Breadcrums
	var up = [];
	node.upstream (function (ancestor) {
	    if (ancestor.parent() === undefined) {
		up.push(ancestor.property(conf.label) || "All");
	    } else {
		up.push(node.property(conf.label));
	    }
	});
	up.reverse();

	var breadLabels = breadcrums.selectAll("span")
	    .data(up, function (d) {
		return d;
	    });

	breadLabels
	    .enter()
	    .append("span")
	    .attr("class", "cttv_bubblesView_breadcrumLabel")
	    .text(function (d) {
		return d;
	    });
	breadLabels
	    .classed ("cttv_bubblesView_link", false)
	    .on ("click", null);

	breadLabels.exit().remove();

	breadcrums.selectAll(":not(:last-child)")
	    .classed ("cttv_bubblesView_link", true)
	    .on("click", conf.breadcrumsClick);

	// Focus
	focus = node;
	var focusData = focus.data();
	var transition = d3.transition()
	    .duration (conf.duration)
	    .tween ("zoom", function () {
		var i = d3.interpolateZoom (view, [focusData.x, focusData.y, focusData.r*2]);
		return function (t) {
		    focusTo(i(t));
		};
	    });
	return this;
    };

    render.breadcrumsClick = function (cb) {
	if (!arguments.length) {
	    return conf.breadcrumsClick;
	}
	conf.breadcrumsClick = cb;
	return this;
    };
    
    render.data = function (newData) {
	if (!arguments.length) {
	    return conf.data;
	}
	conf.data = newData;
	return this;
    };

    render.onclick = function (cbak) {
	if (!arguments.length) {
	    return conf.onclick;
	}
	conf.onclick = cbak;
	return this;
    };
    
    render.key = function (n) {
	if (!arguments.length) {
	    return conf.key;
	}
	conf.key = n;
	return this;
    };

    render.label = function (n) {
	if (!arguments.length) {
	    return conf.label;
	}
	conf.label = n;
	return this;
    };

    render.value = function (v) {
	if (!arguments.length) {
	    return conf.value;
	}
	conf.value = v;
	return this;
    };

    render.diameter = function (d) {
	if (!arguments.length) {
	    return conf.diameter;
	}
	conf.diameter = d;
	return this;
    };

    // render.flat = function (bool) {
    // 	if (!arguments.length) {
    // 	    return conf.flat;
    // 	}
    // 	conf.flat = bool;
    // 	return this;
    // };

    // render.node = tree_node;
    return render;
};

module.exports = bubblesView;

},{"tnt.tree.node":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvZmFrZV8yODFkYWIzNS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LmFwaS9zcmMvYXBpLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvcmVkdWNlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL3V0aWxzLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL3NyYy9ub2RlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L3NyYy9idWJibGVzVmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0ZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCIvLyBpZiAodHlwZW9mIGJ1YmJsZXNWaWV3ID09PSBcInVuZGVmaW5lZFwiKSB7XG4vLyAgICAgbW9kdWxlLmV4cG9ydHMgPSBidWJibGVzVmlldyA9IHt9XG4vLyB9XG4vLyBidWJibGVzVmlldy5idWJibGVzVmlldyA9IHJlcXVpcmUoXCIuL3NyYy9idWJibGVzVmlldy5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gYnViYmxlc1ZpZXcgPSByZXF1aXJlKFwiLi9zcmMvYnViYmxlc1ZpZXcuanNcIik7XG4iLCJ2YXIgbm9kZSA9IHJlcXVpcmUoXCIuL3NyYy9ub2RlLmpzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gbm9kZTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL2FwaS5qc1wiKTtcbiIsInZhciBhcGkgPSBmdW5jdGlvbiAod2hvKSB7XG5cbiAgICB2YXIgX21ldGhvZHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBtID0gW107XG5cblx0bS5hZGRfYmF0Y2ggPSBmdW5jdGlvbiAob2JqKSB7XG5cdCAgICBtLnVuc2hpZnQob2JqKTtcblx0fTtcblxuXHRtLnVwZGF0ZSA9IGZ1bmN0aW9uIChtZXRob2QsIHZhbHVlKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRtW2ldW3BdID0gdmFsdWU7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBmYWxzZTtcblx0fTtcblxuXHRtLmFkZCA9IGZ1bmN0aW9uIChtZXRob2QsIHZhbHVlKSB7XG5cdCAgICBpZiAobS51cGRhdGUgKG1ldGhvZCwgdmFsdWUpICkge1xuXHQgICAgfSBlbHNlIHtcblx0XHR2YXIgcmVnID0ge307XG5cdFx0cmVnW21ldGhvZF0gPSB2YWx1ZTtcblx0XHRtLmFkZF9iYXRjaCAocmVnKTtcblx0ICAgIH1cblx0fTtcblxuXHRtLmdldCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtLmxlbmd0aDsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgcCBpbiBtW2ldKSB7XG5cdFx0ICAgIGlmIChwID09PSBtZXRob2QpIHtcblx0XHRcdHJldHVybiBtW2ldW3BdO1xuXHRcdCAgICB9XG5cdFx0fVxuXHQgICAgfVxuXHR9O1xuXG5cdHJldHVybiBtO1xuICAgIH07XG5cbiAgICB2YXIgbWV0aG9kcyAgICA9IF9tZXRob2RzKCk7XG4gICAgdmFyIGFwaSA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgYXBpLmNoZWNrID0gZnVuY3Rpb24gKG1ldGhvZCwgY2hlY2ssIG1zZykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkuY2hlY2sobWV0aG9kW2ldLCBjaGVjaywgbXNnKTtcblx0ICAgIH1cblx0ICAgIHJldHVybjtcblx0fVxuXG5cdGlmICh0eXBlb2YgKG1ldGhvZCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIG1ldGhvZC5jaGVjayhjaGVjaywgbXNnKTtcblx0fSBlbHNlIHtcblx0ICAgIHdob1ttZXRob2RdLmNoZWNrKGNoZWNrLCBtc2cpO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS50cmFuc2Zvcm0gPSBmdW5jdGlvbiAobWV0aG9kLCBjYmFrKSB7XG5cdGlmIChtZXRob2QgaW5zdGFuY2VvZiBBcnJheSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG1ldGhvZC5sZW5ndGg7IGkrKykge1xuXHRcdGFwaS50cmFuc2Zvcm0gKG1ldGhvZFtpXSwgY2Jhayk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QudHJhbnNmb3JtIChjYmFrKTtcblx0fSBlbHNlIHtcblx0ICAgIHdob1ttZXRob2RdLnRyYW5zZm9ybShjYmFrKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICB2YXIgYXR0YWNoX21ldGhvZCA9IGZ1bmN0aW9uIChtZXRob2QsIG9wdHMpIHtcblx0dmFyIGNoZWNrcyA9IFtdO1xuXHR2YXIgdHJhbnNmb3JtcyA9IFtdO1xuXG5cdHZhciBnZXR0ZXIgPSBvcHRzLm9uX2dldHRlciB8fCBmdW5jdGlvbiAoKSB7XG5cdCAgICByZXR1cm4gbWV0aG9kcy5nZXQobWV0aG9kKTtcblx0fTtcblxuXHR2YXIgc2V0dGVyID0gb3B0cy5vbl9zZXR0ZXIgfHwgZnVuY3Rpb24gKHgpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTx0cmFuc2Zvcm1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0eCA9IHRyYW5zZm9ybXNbaV0oeCk7XG5cdCAgICB9XG5cblx0ICAgIGZvciAodmFyIGo9MDsgajxjaGVja3MubGVuZ3RoOyBqKyspIHtcblx0XHRpZiAoIWNoZWNrc1tqXS5jaGVjayh4KSkge1xuXHRcdCAgICB2YXIgbXNnID0gY2hlY2tzW2pdLm1zZyB8fCBcblx0XHRcdChcIlZhbHVlIFwiICsgeCArIFwiIGRvZXNuJ3Qgc2VlbSB0byBiZSB2YWxpZCBmb3IgdGhpcyBtZXRob2RcIik7XG5cdFx0ICAgIHRocm93IChtc2cpO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIG1ldGhvZHMuYWRkKG1ldGhvZCwgeCk7XG5cdH07XG5cblx0dmFyIG5ld19tZXRob2QgPSBmdW5jdGlvbiAobmV3X3ZhbCkge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGdldHRlcigpO1xuXHQgICAgfVxuXHQgICAgc2V0dGVyKG5ld192YWwpO1xuXHQgICAgcmV0dXJuIHdobzsgLy8gUmV0dXJuIHRoaXM/XG5cdH07XG5cdG5ld19tZXRob2QuY2hlY2sgPSBmdW5jdGlvbiAoY2JhaywgbXNnKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gY2hlY2tzO1xuXHQgICAgfVxuXHQgICAgY2hlY2tzLnB1c2ggKHtjaGVjayA6IGNiYWssXG5cdFx0XHQgIG1zZyAgIDogbXNnfSk7XG5cdCAgICByZXR1cm4gdGhpcztcblx0fTtcblx0bmV3X21ldGhvZC50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoY2Jhaykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIHRyYW5zZm9ybXM7XG5cdCAgICB9XG5cdCAgICB0cmFuc2Zvcm1zLnB1c2goY2Jhayk7XG5cdCAgICByZXR1cm4gdGhpcztcblx0fTtcblxuXHR3aG9bbWV0aG9kXSA9IG5ld19tZXRob2Q7XG4gICAgfTtcblxuICAgIHZhciBnZXRzZXQgPSBmdW5jdGlvbiAocGFyYW0sIG9wdHMpIHtcblx0aWYgKHR5cGVvZiAocGFyYW0pID09PSAnb2JqZWN0Jykge1xuXHQgICAgbWV0aG9kcy5hZGRfYmF0Y2ggKHBhcmFtKTtcblx0ICAgIGZvciAodmFyIHAgaW4gcGFyYW0pIHtcblx0XHRhdHRhY2hfbWV0aG9kIChwLCBvcHRzKTtcblx0ICAgIH1cblx0fSBlbHNlIHtcblx0ICAgIG1ldGhvZHMuYWRkIChwYXJhbSwgb3B0cy5kZWZhdWx0X3ZhbHVlKTtcblx0ICAgIGF0dGFjaF9tZXRob2QgKHBhcmFtLCBvcHRzKTtcblx0fVxuICAgIH07XG5cbiAgICBhcGkuZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZn0pO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5nZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHR2YXIgb25fc2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdGhyb3cgKFwiTWV0aG9kIGRlZmluZWQgb25seSBhcyBhIGdldHRlciAoeW91IGFyZSB0cnlpbmcgdG8gdXNlIGl0IGFzIGEgc2V0dGVyXCIpO1xuXHR9O1xuXG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWYsXG5cdFx0ICAgICAgIG9uX3NldHRlciA6IG9uX3NldHRlcn1cblx0ICAgICAgKTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuc2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX2dldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBzZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIGdldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9nZXR0ZXIgOiBvbl9nZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLm1ldGhvZCA9IGZ1bmN0aW9uIChuYW1lLCBjYmFrKSB7XG5cdGlmICh0eXBlb2YgKG5hbWUpID09PSAnb2JqZWN0Jykge1xuXHQgICAgZm9yICh2YXIgcCBpbiBuYW1lKSB7XG5cdFx0d2hvW3BdID0gbmFtZVtwXTtcblx0ICAgIH1cblx0fSBlbHNlIHtcblx0ICAgIHdob1tuYW1lXSA9IGNiYWs7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGFwaTtcbiAgICBcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGFwaTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC5qc1wiKTtcbiIsIi8vIHJlcXVpcmUoJ2ZzJykucmVhZGRpclN5bmMoX19kaXJuYW1lICsgJy8nKS5mb3JFYWNoKGZ1bmN0aW9uKGZpbGUpIHtcbi8vICAgICBpZiAoZmlsZS5tYXRjaCgvLitcXC5qcy9nKSAhPT0gbnVsbCAmJiBmaWxlICE9PSBfX2ZpbGVuYW1lKSB7XG4vLyBcdHZhciBuYW1lID0gZmlsZS5yZXBsYWNlKCcuanMnLCAnJyk7XG4vLyBcdG1vZHVsZS5leHBvcnRzW25hbWVdID0gcmVxdWlyZSgnLi8nICsgZmlsZSk7XG4vLyAgICAgfVxuLy8gfSk7XG5cbi8vIFNhbWUgYXNcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xudXRpbHMucmVkdWNlID0gcmVxdWlyZShcIi4vcmVkdWNlLmpzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdXRpbHM7XG4iLCJ2YXIgcmVkdWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzbW9vdGggPSA1O1xuICAgIHZhciB2YWx1ZSA9ICd2YWwnO1xuICAgIHZhciByZWR1bmRhbnQgPSBmdW5jdGlvbiAoYSwgYikge1xuXHRpZiAoYSA8IGIpIHtcblx0ICAgIHJldHVybiAoKGItYSkgPD0gKGIgKiAwLjIpKTtcblx0fVxuXHRyZXR1cm4gKChhLWIpIDw9IChhICogMC4yKSk7XG4gICAgfTtcbiAgICB2YXIgcGVyZm9ybV9yZWR1Y2UgPSBmdW5jdGlvbiAoYXJyKSB7cmV0dXJuIGFycjt9O1xuXG4gICAgdmFyIHJlZHVjZSA9IGZ1bmN0aW9uIChhcnIpIHtcblx0aWYgKCFhcnIubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gYXJyO1xuXHR9XG5cdHZhciBzbW9vdGhlZCA9IHBlcmZvcm1fc21vb3RoKGFycik7XG5cdHZhciByZWR1Y2VkICA9IHBlcmZvcm1fcmVkdWNlKHNtb290aGVkKTtcblx0cmV0dXJuIHJlZHVjZWQ7XG4gICAgfTtcblxuICAgIHZhciBtZWRpYW4gPSBmdW5jdGlvbiAodiwgYXJyKSB7XG5cdGFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG5cdCAgICByZXR1cm4gYVt2YWx1ZV0gLSBiW3ZhbHVlXTtcblx0fSk7XG5cdGlmIChhcnIubGVuZ3RoICUgMikge1xuXHQgICAgdlt2YWx1ZV0gPSBhcnJbfn4oYXJyLmxlbmd0aCAvIDIpXVt2YWx1ZV07XHQgICAgXG5cdH0gZWxzZSB7XG5cdCAgICB2YXIgbiA9IH5+KGFyci5sZW5ndGggLyAyKSAtIDE7XG5cdCAgICB2W3ZhbHVlXSA9IChhcnJbbl1bdmFsdWVdICsgYXJyW24rMV1bdmFsdWVdKSAvIDI7XG5cdH1cblxuXHRyZXR1cm4gdjtcbiAgICB9O1xuXG4gICAgdmFyIGNsb25lID0gZnVuY3Rpb24gKHNvdXJjZSkge1xuXHR2YXIgdGFyZ2V0ID0ge307XG5cdGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG5cdCAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KHByb3ApKSB7XG5cdFx0dGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0YXJnZXQ7XG4gICAgfTtcblxuICAgIHZhciBwZXJmb3JtX3Ntb290aCA9IGZ1bmN0aW9uIChhcnIpIHtcblx0aWYgKHNtb290aCA9PT0gMCkgeyAvLyBubyBzbW9vdGhcblx0ICAgIHJldHVybiBhcnI7XG5cdH1cblx0dmFyIHNtb290aF9hcnIgPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIGxvdyA9IChpIDwgc21vb3RoKSA/IDAgOiAoaSAtIHNtb290aCk7XG5cdCAgICB2YXIgaGlnaCA9IChpID4gKGFyci5sZW5ndGggLSBzbW9vdGgpKSA/IGFyci5sZW5ndGggOiAoaSArIHNtb290aCk7XG5cdCAgICBzbW9vdGhfYXJyW2ldID0gbWVkaWFuKGNsb25lKGFycltpXSksIGFyci5zbGljZShsb3csaGlnaCsxKSk7XG5cdH1cblx0cmV0dXJuIHNtb290aF9hcnI7XG4gICAgfTtcblxuICAgIHJlZHVjZS5yZWR1Y2VyID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gcGVyZm9ybV9yZWR1Y2U7XG5cdH1cblx0cGVyZm9ybV9yZWR1Y2UgPSBjYmFrO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2UucmVkdW5kYW50ID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gcmVkdW5kYW50O1xuXHR9XG5cdHJlZHVuZGFudCA9IGNiYWs7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJlZHVjZS52YWx1ZSA9IGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gdmFsdWU7XG5cdH1cblx0dmFsdWUgPSB2YWw7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJlZHVjZS5zbW9vdGggPSBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHNtb290aDtcblx0fVxuXHRzbW9vdGggPSB2YWw7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJldHVybiByZWR1Y2U7XG59O1xuXG52YXIgYmxvY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlZCA9IHJlZHVjZSgpXG5cdC52YWx1ZSgnc3RhcnQnKTtcblxuICAgIHZhciB2YWx1ZTIgPSAnZW5kJztcblxuICAgIHZhciBqb2luID0gZnVuY3Rpb24gKG9iajEsIG9iajIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICdvYmplY3QnIDoge1xuICAgICAgICAgICAgICAgICdzdGFydCcgOiBvYmoxLm9iamVjdFtyZWQudmFsdWUoKV0sXG4gICAgICAgICAgICAgICAgJ2VuZCcgICA6IG9iajJbdmFsdWUyXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICd2YWx1ZScgIDogb2JqMlt2YWx1ZTJdXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8vIHZhciBqb2luID0gZnVuY3Rpb24gKG9iajEsIG9iajIpIHsgcmV0dXJuIG9iajEgfTtcblxuICAgIHJlZC5yZWR1Y2VyKCBmdW5jdGlvbiAoYXJyKSB7XG5cdHZhciB2YWx1ZSA9IHJlZC52YWx1ZSgpO1xuXHR2YXIgcmVkdW5kYW50ID0gcmVkLnJlZHVuZGFudCgpO1xuXHR2YXIgcmVkdWNlZF9hcnIgPSBbXTtcblx0dmFyIGN1cnIgPSB7XG5cdCAgICAnb2JqZWN0JyA6IGFyclswXSxcblx0ICAgICd2YWx1ZScgIDogYXJyWzBdW3ZhbHVlMl1cblx0fTtcblx0Zm9yICh2YXIgaT0xOyBpPGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgaWYgKHJlZHVuZGFudCAoYXJyW2ldW3ZhbHVlXSwgY3Vyci52YWx1ZSkpIHtcblx0XHRjdXJyID0gam9pbihjdXJyLCBhcnJbaV0pO1xuXHRcdGNvbnRpbnVlO1xuXHQgICAgfVxuXHQgICAgcmVkdWNlZF9hcnIucHVzaCAoY3Vyci5vYmplY3QpO1xuXHQgICAgY3Vyci5vYmplY3QgPSBhcnJbaV07XG5cdCAgICBjdXJyLnZhbHVlID0gYXJyW2ldLmVuZDtcblx0fVxuXHRyZWR1Y2VkX2Fyci5wdXNoKGN1cnIub2JqZWN0KTtcblxuXHQvLyByZWR1Y2VkX2Fyci5wdXNoKGFyclthcnIubGVuZ3RoLTFdKTtcblx0cmV0dXJuIHJlZHVjZWRfYXJyO1xuICAgIH0pO1xuXG4gICAgcmVkdWNlLmpvaW4gPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBqb2luO1xuXHR9XG5cdGpvaW4gPSBjYmFrO1xuXHRyZXR1cm4gcmVkO1xuICAgIH07XG5cbiAgICByZWR1Y2UudmFsdWUyID0gZnVuY3Rpb24gKGZpZWxkKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHZhbHVlMjtcblx0fVxuXHR2YWx1ZTIgPSBmaWVsZDtcblx0cmV0dXJuIHJlZDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJlZDtcbn07XG5cbnZhciBsaW5lID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWQgPSByZWR1Y2UoKTtcblxuICAgIHJlZC5yZWR1Y2VyICggZnVuY3Rpb24gKGFycikge1xuXHR2YXIgcmVkdW5kYW50ID0gcmVkLnJlZHVuZGFudCgpO1xuXHR2YXIgdmFsdWUgPSByZWQudmFsdWUoKTtcblx0dmFyIHJlZHVjZWRfYXJyID0gW107XG5cdHZhciBjdXJyID0gYXJyWzBdO1xuXHRmb3IgKHZhciBpPTE7IGk8YXJyLmxlbmd0aC0xOyBpKyspIHtcblx0ICAgIGlmIChyZWR1bmRhbnQgKGFycltpXVt2YWx1ZV0sIGN1cnJbdmFsdWVdKSkge1xuXHRcdGNvbnRpbnVlO1xuXHQgICAgfVxuXHQgICAgcmVkdWNlZF9hcnIucHVzaCAoY3Vycik7XG5cdCAgICBjdXJyID0gYXJyW2ldO1xuXHR9XG5cdHJlZHVjZWRfYXJyLnB1c2goY3Vycik7XG5cdHJlZHVjZWRfYXJyLnB1c2goYXJyW2Fyci5sZW5ndGgtMV0pO1xuXHRyZXR1cm4gcmVkdWNlZF9hcnI7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVkO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjZTtcbm1vZHVsZS5leHBvcnRzLmxpbmUgPSBsaW5lO1xubW9kdWxlLmV4cG9ydHMuYmxvY2sgPSBibG9jaztcblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpdGVyYXRvciA6IGZ1bmN0aW9uKGluaXRfdmFsKSB7XG5cdHZhciBpID0gaW5pdF92YWwgfHwgMDtcblx0dmFyIGl0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICByZXR1cm4gaSsrO1xuXHR9O1xuXHRyZXR1cm4gaXRlcjtcbiAgICB9LFxuXG4gICAgc2NyaXB0X3BhdGggOiBmdW5jdGlvbiAoc2NyaXB0X25hbWUpIHsgLy8gc2NyaXB0X25hbWUgaXMgdGhlIGZpbGVuYW1lXG5cdHZhciBzY3JpcHRfc2NhcGVkID0gc2NyaXB0X25hbWUucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyk7XG5cdHZhciBzY3JpcHRfcmUgPSBuZXcgUmVnRXhwKHNjcmlwdF9zY2FwZWQgKyAnJCcpO1xuXHR2YXIgc2NyaXB0X3JlX3N1YiA9IG5ldyBSZWdFeHAoJyguKiknICsgc2NyaXB0X3NjYXBlZCArICckJyk7XG5cblx0Ly8gVE9ETzogVGhpcyByZXF1aXJlcyBwaGFudG9tLmpzIG9yIGEgc2ltaWxhciBoZWFkbGVzcyB3ZWJraXQgdG8gd29yayAoZG9jdW1lbnQpXG5cdHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpO1xuXHR2YXIgcGF0aCA9IFwiXCI7ICAvLyBEZWZhdWx0IHRvIGN1cnJlbnQgcGF0aFxuXHRpZihzY3JpcHRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZvcih2YXIgaSBpbiBzY3JpcHRzKSB7XG5cdFx0aWYoc2NyaXB0c1tpXS5zcmMgJiYgc2NyaXB0c1tpXS5zcmMubWF0Y2goc2NyaXB0X3JlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NyaXB0c1tpXS5zcmMucmVwbGFjZShzY3JpcHRfcmVfc3ViLCAnJDEnKTtcblx0XHR9XG4gICAgICAgICAgICB9XG5cdH1cblx0cmV0dXJuIHBhdGg7XG4gICAgfSxcblxuICAgIGRlZmVyX2NhbmNlbCA6IGZ1bmN0aW9uIChjYmFrLCB0aW1lKSB7XG5cdHZhciB0aWNrO1xuXG5cdHZhciBkZWZlcl9jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICBjbGVhclRpbWVvdXQodGljayk7XG5cdCAgICB0aWNrID0gc2V0VGltZW91dChjYmFrLCB0aW1lKTtcblx0fTtcblxuXHRyZXR1cm4gZGVmZXJfY2FuY2VsO1xuICAgIH1cbn07XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciBpdGVyYXRvciA9IHJlcXVpcmUoXCJ0bnQudXRpbHNcIikuaXRlcmF0b3I7XG5cbnZhciB0bnRfbm9kZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4vL3RudC50cmVlLm5vZGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIG5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobm9kZSk7XG5cbiAgICAvLyBBUElcbi8vICAgICBub2RlLm5vZGVzID0gZnVuY3Rpb24oKSB7XG4vLyBcdGlmIChjbHVzdGVyID09PSB1bmRlZmluZWQpIHtcbi8vIFx0ICAgIGNsdXN0ZXIgPSBkMy5sYXlvdXQuY2x1c3RlcigpXG4vLyBcdCAgICAvLyBUT0RPOiBsZW5ndGggYW5kIGNoaWxkcmVuIHNob3VsZCBiZSBleHBvc2VkIGluIHRoZSBBUElcbi8vIFx0ICAgIC8vIGkuZS4gdGhlIHVzZXIgc2hvdWxkIGJlIGFibGUgdG8gY2hhbmdlIHRoaXMgZGVmYXVsdHMgdmlhIHRoZSBBUElcbi8vIFx0ICAgIC8vIGNoaWxkcmVuIGlzIHRoZSBkZWZhdWx0cyBmb3IgcGFyc2VfbmV3aWNrLCBidXQgbWF5YmUgd2Ugc2hvdWxkIGNoYW5nZSB0aGF0XG4vLyBcdCAgICAvLyBvciBhdCBsZWFzdCBub3QgYXNzdW1lIHRoaXMgaXMgYWx3YXlzIHRoZSBjYXNlIGZvciB0aGUgZGF0YSBwcm92aWRlZFxuLy8gXHRcdC52YWx1ZShmdW5jdGlvbihkKSB7cmV0dXJuIGQubGVuZ3RofSlcbi8vIFx0XHQuY2hpbGRyZW4oZnVuY3Rpb24oZCkge3JldHVybiBkLmNoaWxkcmVufSk7XG4vLyBcdH1cbi8vIFx0bm9kZXMgPSBjbHVzdGVyLm5vZGVzKGRhdGEpO1xuLy8gXHRyZXR1cm4gbm9kZXM7XG4vLyAgICAgfTtcblxuICAgIHZhciBhcHBseV90b19kYXRhID0gZnVuY3Rpb24gKGRhdGEsIGNiYWspIHtcblx0Y2JhayhkYXRhKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRhcHBseV90b19kYXRhKGRhdGEuY2hpbGRyZW5baV0sIGNiYWspO1xuXHQgICAgfVxuXHR9XG4gICAgfTtcblxuICAgIHZhciBjcmVhdGVfaWRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgaSA9IGl0ZXJhdG9yKDEpO1xuXHQvLyBXZSBjYW4ndCB1c2UgYXBwbHkgYmVjYXVzZSBhcHBseSBjcmVhdGVzIG5ldyB0cmVlcyBvbiBldmVyeSBub2RlXG5cdC8vIFdlIHNob3VsZCB1c2UgdGhlIGRpcmVjdCBkYXRhIGluc3RlYWRcblx0YXBwbHlfdG9fZGF0YSAoZGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIGlmIChkLl9pZCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZC5faWQgPSBpKCk7XG5cdFx0Ly8gVE9ETzogTm90IHN1cmUgX2luU3ViVHJlZSBpcyBzdHJpY3RseSBuZWNlc3Nhcnlcblx0XHQvLyBkLl9pblN1YlRyZWUgPSB7cHJldjp0cnVlLCBjdXJyOnRydWV9O1xuXHQgICAgfVxuXHR9KTtcbiAgICB9O1xuXG4gICAgdmFyIGxpbmtfcGFyZW50cyA9IGZ1bmN0aW9uIChkYXRhKSB7XG5cdGlmIChkYXRhID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXHRpZiAoZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIC8vIF9wYXJlbnQ/XG5cdCAgICBkYXRhLmNoaWxkcmVuW2ldLl9wYXJlbnQgPSBkYXRhO1xuXHQgICAgbGlua19wYXJlbnRzKGRhdGEuY2hpbGRyZW5baV0pO1xuXHR9XG4gICAgfTtcblxuICAgIHZhciBjb21wdXRlX3Jvb3RfZGlzdHMgPSBmdW5jdGlvbiAoZGF0YSkge1xuXHRhcHBseV90b19kYXRhIChkYXRhLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgdmFyIGw7XG5cdCAgICBpZiAoZC5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0XHRkLl9yb290X2Rpc3QgPSAwO1xuXHQgICAgfSBlbHNlIHtcblx0XHR2YXIgbCA9IDA7XG5cdFx0aWYgKGQuYnJhbmNoX2xlbmd0aCkge1xuXHRcdCAgICBsID0gZC5icmFuY2hfbGVuZ3RoXG5cdFx0fVxuXHRcdGQuX3Jvb3RfZGlzdCA9IGwgKyBkLl9wYXJlbnQuX3Jvb3RfZGlzdDtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIC8vIFRPRE86IGRhdGEgY2FuJ3QgYmUgcmV3cml0dGVuIHVzZWQgdGhlIGFwaSB5ZXQuIFdlIG5lZWQgZmluYWxpemVyc1xuICAgIG5vZGUuZGF0YSA9IGZ1bmN0aW9uKG5ld19kYXRhKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGRhdGFcblx0fVxuXHRkYXRhID0gbmV3X2RhdGE7XG5cdGNyZWF0ZV9pZHMoKTtcblx0bGlua19wYXJlbnRzKGRhdGEpO1xuXHRjb21wdXRlX3Jvb3RfZGlzdHMoZGF0YSk7XG5cdHJldHVybiBub2RlO1xuICAgIH07XG4gICAgLy8gV2UgYmluZCB0aGUgZGF0YSB0aGF0IGhhcyBiZWVuIHBhc3NlZFxuICAgIG5vZGUuZGF0YShkYXRhKTtcblxuICAgIGFwaS5tZXRob2QgKCdmaW5kX2FsbCcsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdHZhciBub2RlcyA9IFtdO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikpIHtcblx0XHRub2Rlcy5wdXNoIChuKTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcbiAgICBcbiAgICBhcGkubWV0aG9kICgnZmluZF9ub2RlJywgZnVuY3Rpb24gKGNiYWssIGRlZXApIHtcblx0aWYgKGNiYWsobm9kZSkpIHtcblx0ICAgIHJldHVybiBub2RlO1xuXHR9XG5cblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaj0wOyBqPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHR2YXIgZm91bmQgPSB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2pdKS5maW5kX25vZGUoY2JhaywgZGVlcCk7XG5cdFx0aWYgKGZvdW5kKSB7XG5cdFx0ICAgIHJldHVybiBmb3VuZDtcblx0XHR9XG5cdCAgICB9XG5cdH1cblxuXHRpZiAoZGVlcCAmJiAoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLl9jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2ldKS5maW5kX25vZGUoY2JhaywgZGVlcClcblx0XHR2YXIgZm91bmQgPSB0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltpXSkuZmluZF9ub2RlKGNiYWssIGRlZXApO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF9ub2RlX2J5X25hbWUnLCBmdW5jdGlvbihuYW1lLCBkZWVwKSB7XG5cdHJldHVybiBub2RlLmZpbmRfbm9kZSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHJldHVybiBub2RlLm5vZGVfbmFtZSgpID09PSBuYW1lXG5cdH0sIGRlZXApO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3RvZ2dsZScsIGZ1bmN0aW9uKCkge1xuXHRpZiAoZGF0YSkge1xuXHQgICAgaWYgKGRhdGEuY2hpbGRyZW4pIHsgLy8gVW5jb2xsYXBzZWQgLT4gY29sbGFwc2Vcblx0XHR2YXIgaGlkZGVuID0gMDtcblx0XHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHRcdCAgICB2YXIgaGlkZGVuX2hlcmUgPSBuLm5faGlkZGVuKCkgfHwgMDtcblx0XHQgICAgaGlkZGVuICs9IChuLm5faGlkZGVuKCkgfHwgMCkgKyAxO1xuXHRcdH0pO1xuXHRcdG5vZGUubl9oaWRkZW4gKGhpZGRlbi0xKTtcblx0XHRkYXRhLl9jaGlsZHJlbiA9IGRhdGEuY2hpbGRyZW47XG5cdFx0ZGF0YS5jaGlsZHJlbiA9IHVuZGVmaW5lZDtcblx0ICAgIH0gZWxzZSB7ICAgICAgICAgICAgIC8vIENvbGxhcHNlZCAtPiB1bmNvbGxhcHNlXG5cdFx0bm9kZS5uX2hpZGRlbigwKTtcblx0XHRkYXRhLmNoaWxkcmVuID0gZGF0YS5fY2hpbGRyZW47XG5cdFx0ZGF0YS5fY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfY29sbGFwc2VkJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQgJiYgZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKTtcbiAgICB9KTtcblxuICAgIHZhciBoYXNfYW5jZXN0b3IgPSBmdW5jdGlvbihuLCBhbmNlc3Rvcikge1xuXHQvLyBJdCBpcyBiZXR0ZXIgdG8gd29yayBhdCB0aGUgZGF0YSBsZXZlbFxuXHRuID0gbi5kYXRhKCk7XG5cdGFuY2VzdG9yID0gYW5jZXN0b3IuZGF0YSgpO1xuXHRpZiAobi5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybiBmYWxzZVxuXHR9XG5cdG4gPSBuLl9wYXJlbnRcblx0Zm9yICg7Oykge1xuXHQgICAgaWYgKG4gPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0ICAgIH1cblx0ICAgIGlmIChuID09PSBhbmNlc3Rvcikge1xuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgbiA9IG4uX3BhcmVudDtcblx0fVxuICAgIH07XG5cbiAgICAvLyBUaGlzIGlzIHRoZSBlYXNpZXN0IHdheSB0byBjYWxjdWxhdGUgdGhlIExDQSBJIGNhbiB0aGluayBvZi4gQnV0IGl0IGlzIHZlcnkgaW5lZmZpY2llbnQgdG9vLlxuICAgIC8vIEl0IGlzIHdvcmtpbmcgZmluZSBieSBub3csIGJ1dCBpbiBjYXNlIGl0IG5lZWRzIHRvIGJlIG1vcmUgcGVyZm9ybWFudCB3ZSBjYW4gaW1wbGVtZW50IHRoZSBMQ0FcbiAgICAvLyBhbGdvcml0aG0gZXhwbGFpbmVkIGhlcmU6XG4gICAgLy8gaHR0cDovL2NvbW11bml0eS50b3Bjb2Rlci5jb20vdGM/bW9kdWxlPVN0YXRpYyZkMT10dXRvcmlhbHMmZDI9bG93ZXN0Q29tbW9uQW5jZXN0b3JcbiAgICBhcGkubWV0aG9kICgnbGNhJywgZnVuY3Rpb24gKG5vZGVzKSB7XG5cdGlmIChub2Rlcy5sZW5ndGggPT09IDEpIHtcblx0ICAgIHJldHVybiBub2Rlc1swXTtcblx0fVxuXHR2YXIgbGNhX25vZGUgPSBub2Rlc1swXTtcblx0Zm9yICh2YXIgaSA9IDE7IGk8bm9kZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIGxjYV9ub2RlID0gX2xjYShsY2Ffbm9kZSwgbm9kZXNbaV0pO1xuXHR9XG5cdHJldHVybiBsY2Ffbm9kZTtcblx0Ly8gcmV0dXJuIHRudF9ub2RlKGxjYV9ub2RlKTtcbiAgICB9KTtcblxuICAgIHZhciBfbGNhID0gZnVuY3Rpb24obm9kZTEsIG5vZGUyKSB7XG5cdGlmIChub2RlMS5kYXRhKCkgPT09IG5vZGUyLmRhdGEoKSkge1xuXHQgICAgcmV0dXJuIG5vZGUxO1xuXHR9XG5cdGlmIChoYXNfYW5jZXN0b3Iobm9kZTEsIG5vZGUyKSkge1xuXHQgICAgcmV0dXJuIG5vZGUyO1xuXHR9XG5cdHJldHVybiBfbGNhKG5vZGUxLCBub2RlMi5wYXJlbnQoKSk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QoJ25faGlkZGVuJywgZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBub2RlLnByb3BlcnR5KCdfaGlkZGVuJyk7XG5cdH1cblx0bm9kZS5wcm9wZXJ0eSgnX2hpZGRlbicsIHZhbCk7XG5cdHJldHVybiBub2RlXG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZ2V0X2FsbF9ub2RlcycsIGZ1bmN0aW9uIChkZWVwKSB7XG5cdHZhciBub2RlcyA9IFtdO1xuXHRub2RlLmFwcGx5KGZ1bmN0aW9uIChuKSB7XG5cdCAgICBub2Rlcy5wdXNoKG4pO1xuXHR9LCBkZWVwKTtcblx0cmV0dXJuIG5vZGVzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbGVhdmVzJywgZnVuY3Rpb24gKGRlZXApIHtcblx0dmFyIGxlYXZlcyA9IFtdO1xuXHRub2RlLmFwcGx5KGZ1bmN0aW9uIChuKSB7XG5cdCAgICBpZiAobi5pc19sZWFmKGRlZXApKSB7XG5cdFx0bGVhdmVzLnB1c2gobik7XG5cdCAgICB9XG5cdH0sIGRlZXApO1xuXHRyZXR1cm4gbGVhdmVzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3Vwc3RyZWFtJywgZnVuY3Rpb24oY2Jhaykge1xuXHRjYmFrKG5vZGUpO1xuXHR2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnQoKTtcblx0aWYgKHBhcmVudCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBwYXJlbnQudXBzdHJlYW0oY2Jhayk7XG5cdH1cbi8vXHR0bnRfbm9kZShwYXJlbnQpLnVwc3RyZWFtKGNiYWspO1xuLy8gXHRub2RlLnVwc3RyZWFtKG5vZGUuX3BhcmVudCwgY2Jhayk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnc3VidHJlZScsIGZ1bmN0aW9uKG5vZGVzLCBrZWVwX3NpbmdsZXRvbnMpIHtcblx0aWYgKGtlZXBfc2luZ2xldG9ucyA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICBrZWVwX3NpbmdsZXRvbnMgPSBmYWxzZTtcblx0fVxuICAgIFx0dmFyIG5vZGVfY291bnRzID0ge307XG4gICAgXHRmb3IgKHZhciBpPTA7IGk8bm9kZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBuID0gbm9kZXNbaV07XG5cdCAgICBpZiAobiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0bi51cHN0cmVhbSAoZnVuY3Rpb24gKHRoaXNfbm9kZSl7XG5cdFx0ICAgIHZhciBpZCA9IHRoaXNfbm9kZS5pZCgpO1xuXHRcdCAgICBpZiAobm9kZV9jb3VudHNbaWRdID09PSB1bmRlZmluZWQpIHtcblx0XHRcdG5vZGVfY291bnRzW2lkXSA9IDA7XG5cdFx0ICAgIH1cblx0XHQgICAgbm9kZV9jb3VudHNbaWRdKytcbiAgICBcdFx0fSk7XG5cdCAgICB9XG4gICAgXHR9XG4gICAgXG5cdHZhciBpc19zaW5nbGV0b24gPSBmdW5jdGlvbiAobm9kZV9kYXRhKSB7XG5cdCAgICB2YXIgbl9jaGlsZHJlbiA9IDA7XG5cdCAgICBpZiAobm9kZV9kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bm9kZV9kYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGlkID0gbm9kZV9kYXRhLmNoaWxkcmVuW2ldLl9pZDtcblx0XHRpZiAobm9kZV9jb3VudHNbaWRdID4gMCkge1xuXHRcdCAgICBuX2NoaWxkcmVuKys7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIG5fY2hpbGRyZW4gPT09IDE7XG5cdH07XG5cblx0dmFyIHN1YnRyZWUgPSB7fTtcblx0Y29weV9kYXRhIChkYXRhLCBzdWJ0cmVlLCAwLCBmdW5jdGlvbiAobm9kZV9kYXRhKSB7XG5cdCAgICB2YXIgbm9kZV9pZCA9IG5vZGVfZGF0YS5faWQ7XG5cdCAgICB2YXIgY291bnRzID0gbm9kZV9jb3VudHNbbm9kZV9pZF07XG5cdCAgICBcblx0ICAgIC8vIElzIGluIHBhdGhcblx0ICAgIGlmIChjb3VudHMgPiAwKSB7XG5cdFx0aWYgKGlzX3NpbmdsZXRvbihub2RlX2RhdGEpICYmICFrZWVwX3NpbmdsZXRvbnMpIHtcblx0XHQgICAgcmV0dXJuIGZhbHNlOyBcblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdCAgICB9XG5cdCAgICAvLyBJcyBub3QgaW4gcGF0aFxuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHR9KTtcblxuXHRyZXR1cm4gdG50X25vZGUoc3VidHJlZS5jaGlsZHJlblswXSk7XG4gICAgfSk7XG5cbiAgICB2YXIgY29weV9kYXRhID0gZnVuY3Rpb24gKG9yaWdfZGF0YSwgc3VidHJlZSwgY3VyckJyYW5jaExlbmd0aCwgY29uZGl0aW9uKSB7XG4gICAgICAgIGlmIChvcmlnX2RhdGEgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmRpdGlvbihvcmlnX2RhdGEpKSB7XG5cdCAgICB2YXIgY29weSA9IGNvcHlfbm9kZShvcmlnX2RhdGEsIGN1cnJCcmFuY2hMZW5ndGgpO1xuXHQgICAgaWYgKHN1YnRyZWUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHN1YnRyZWUuY2hpbGRyZW4gPSBbXTtcblx0ICAgIH1cblx0ICAgIHN1YnRyZWUuY2hpbGRyZW4ucHVzaChjb3B5KTtcblx0ICAgIGlmIChvcmlnX2RhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgIH1cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3JpZ19kYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29weV9kYXRhIChvcmlnX2RhdGEuY2hpbGRyZW5baV0sIGNvcHksIDAsIGNvbmRpdGlvbik7XG5cdCAgICB9XG4gICAgICAgIH0gZWxzZSB7XG5cdCAgICBpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICBjdXJyQnJhbmNoTGVuZ3RoICs9IG9yaWdfZGF0YS5icmFuY2hfbGVuZ3RoIHx8IDA7XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvcHlfZGF0YShvcmlnX2RhdGEuY2hpbGRyZW5baV0sIHN1YnRyZWUsIGN1cnJCcmFuY2hMZW5ndGgsIGNvbmRpdGlvbik7XG5cdCAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGNvcHlfbm9kZSA9IGZ1bmN0aW9uIChub2RlX2RhdGEsIGV4dHJhQnJhbmNoTGVuZ3RoKSB7XG5cdHZhciBjb3B5ID0ge307XG5cdC8vIGNvcHkgYWxsIHRoZSBvd24gcHJvcGVydGllcyBleGNlcHRzIGxpbmtzIHRvIG90aGVyIG5vZGVzIG9yIGRlcHRoXG5cdGZvciAodmFyIHBhcmFtIGluIG5vZGVfZGF0YSkge1xuXHQgICAgaWYgKChwYXJhbSA9PT0gXCJjaGlsZHJlblwiKSB8fFxuXHRcdChwYXJhbSA9PT0gXCJfY2hpbGRyZW5cIikgfHxcblx0XHQocGFyYW0gPT09IFwiX3BhcmVudFwiKSB8fFxuXHRcdChwYXJhbSA9PT0gXCJkZXB0aFwiKSkge1xuXHRcdGNvbnRpbnVlO1xuXHQgICAgfVxuXHQgICAgaWYgKG5vZGVfZGF0YS5oYXNPd25Qcm9wZXJ0eShwYXJhbSkpIHtcblx0XHRjb3B5W3BhcmFtXSA9IG5vZGVfZGF0YVtwYXJhbV07XG5cdCAgICB9XG5cdH1cblx0aWYgKChjb3B5LmJyYW5jaF9sZW5ndGggIT09IHVuZGVmaW5lZCkgJiYgKGV4dHJhQnJhbmNoTGVuZ3RoICE9PSB1bmRlZmluZWQpKSB7XG5cdCAgICBjb3B5LmJyYW5jaF9sZW5ndGggKz0gZXh0cmFCcmFuY2hMZW5ndGg7XG5cdH1cblx0cmV0dXJuIGNvcHk7XG4gICAgfTtcblxuICAgIFxuICAgIC8vIFRPRE86IFRoaXMgbWV0aG9kIHZpc2l0cyBhbGwgdGhlIG5vZGVzXG4gICAgLy8gYSBtb3JlIHBlcmZvcm1hbnQgdmVyc2lvbiBzaG91bGQgcmV0dXJuIHRydWVcbiAgICAvLyB0aGUgZmlyc3QgdGltZSBjYmFrKG5vZGUpIGlzIHRydWVcbiAgICBhcGkubWV0aG9kICgncHJlc2VudCcsIGZ1bmN0aW9uIChjYmFrKSB7XG5cdC8vIGNiYWsgc2hvdWxkIHJldHVybiB0cnVlL2ZhbHNlXG5cdHZhciBpc190cnVlID0gZmFsc2U7XG5cdG5vZGUuYXBwbHkgKGZ1bmN0aW9uIChuKSB7XG5cdCAgICBpZiAoY2JhayhuKSA9PT0gdHJ1ZSkge1xuXHRcdGlzX3RydWUgPSB0cnVlO1xuXHQgICAgfVxuXHR9KTtcblx0cmV0dXJuIGlzX3RydWU7XG4gICAgfSk7XG5cbiAgICAvLyBjYmFrIGlzIGNhbGxlZCB3aXRoIHR3byBub2Rlc1xuICAgIC8vIGFuZCBzaG91bGQgcmV0dXJuIGEgbmVnYXRpdmUgbnVtYmVyLCAwIG9yIGEgcG9zaXRpdmUgbnVtYmVyXG4gICAgYXBpLm1ldGhvZCAoJ3NvcnQnLCBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHR2YXIgbmV3X2NoaWxkcmVuID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBuZXdfY2hpbGRyZW4ucHVzaCh0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2ldKSk7XG5cdH1cblxuXHRuZXdfY2hpbGRyZW4uc29ydChjYmFrKTtcblxuXHRkYXRhLmNoaWxkcmVuID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxuZXdfY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIGRhdGEuY2hpbGRyZW4ucHVzaChuZXdfY2hpbGRyZW5baV0uZGF0YSgpKTtcblx0fVxuXG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2ldKS5zb3J0KGNiYWspO1xuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmxhdHRlbicsIGZ1bmN0aW9uICgpIHtcblx0aWYgKG5vZGUuaXNfbGVhZigpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXHR2YXIgZGF0YSA9IG5vZGUuZGF0YSgpO1xuXHR2YXIgbmV3cm9vdCA9IGNvcHlfbm9kZShkYXRhKTtcblx0dmFyIGxlYXZlcyA9IG5vZGUuZ2V0X2FsbF9sZWF2ZXMoKTtcblx0bmV3cm9vdC5jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBuZXdyb290LmNoaWxkcmVuLnB1c2goY29weV9ub2RlKGxlYXZlc1tpXS5kYXRhKCkpKTtcblx0fVxuXG5cdHJldHVybiB0bnRfbm9kZShuZXdyb290KTtcbiAgICB9KTtcblxuICAgIFxuICAgIC8vIFRPRE86IFRoaXMgbWV0aG9kIG9ubHkgJ2FwcGx5J3MgdG8gbm9uIGNvbGxhcHNlZCBub2RlcyAoaWUgLl9jaGlsZHJlbiBpcyBub3QgdmlzaXRlZClcbiAgICAvLyBXb3VsZCBpdCBiZSBiZXR0ZXIgdG8gaGF2ZSBhbiBleHRyYSBmbGFnICh0cnVlL2ZhbHNlKSB0byB2aXNpdCBhbHNvIGNvbGxhcHNlZCBub2Rlcz9cbiAgICBhcGkubWV0aG9kICgnYXBwbHknLCBmdW5jdGlvbihjYmFrLCBkZWVwKSB7XG5cdGlmIChkZWVwID09PSB1bmRlZmluZWQpIHtcblx0ICAgIGRlZXAgPSBmYWxzZTtcblx0fVxuXHRjYmFrKG5vZGUpO1xuXHRpZiAoZGF0YS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBuID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSlcblx0XHRuLmFwcGx5KGNiYWssIGRlZXApO1xuXHQgICAgfVxuXHR9XG5cblx0aWYgKChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSAmJiBkZWVwKSB7XG5cdCAgICBmb3IgKHZhciBqPTA7IGo8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHR2YXIgbiA9IHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2pdKTtcblx0XHRuLmFwcGx5KGNiYWssIGRlZXApO1xuXHQgICAgfVxuXHR9XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBOb3Qgc3VyZSBpZiBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdmlhIGEgY2FsbGJhY2s6XG4gICAgLy8gcm9vdC5wcm9wZXJ0eSAoZnVuY3Rpb24gKG5vZGUsIHZhbCkge1xuICAgIC8vICAgIG5vZGUuZGVlcGVyLmZpZWxkID0gdmFsXG4gICAgLy8gfSwgJ25ld192YWx1ZScpXG4gICAgYXBpLm1ldGhvZCAoJ3Byb3BlcnR5JywgZnVuY3Rpb24ocHJvcCwgdmFsdWUpIHtcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcblx0ICAgIGlmICgodHlwZW9mIHByb3ApID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0cmV0dXJuIHByb3AoZGF0YSlcdFxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGRhdGFbcHJvcF1cblx0fVxuXHRpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgcHJvcChkYXRhLCB2YWx1ZSk7ICAgXG5cdH1cblx0ZGF0YVtwcm9wXSA9IHZhbHVlO1xuXHRyZXR1cm4gbm9kZTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdpc19sZWFmJywgZnVuY3Rpb24oZGVlcCkge1xuXHRpZiAoZGVlcCkge1xuXHQgICAgcmV0dXJuICgoZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSAmJiAoZGF0YS5fY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkpO1xuXHR9XG5cdHJldHVybiBkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQ7XG4gICAgfSk7XG5cbiAgICAvLyBJdCBsb29rcyBsaWtlIHRoZSBjbHVzdGVyIGNhbid0IGJlIHVzZWQgZm9yIGFueXRoaW5nIHVzZWZ1bCBoZXJlXG4gICAgLy8gSXQgaXMgbm93IGluY2x1ZGVkIGFzIGFuIG9wdGlvbmFsIHBhcmFtZXRlciB0byB0aGUgdG50LnRyZWUoKSBtZXRob2QgY2FsbFxuICAgIC8vIHNvIEknbSBjb21tZW50aW5nIHRoZSBnZXR0ZXJcbiAgICAvLyBub2RlLmNsdXN0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBcdHJldHVybiBjbHVzdGVyO1xuICAgIC8vIH07XG5cbiAgICAvLyBub2RlLmRlcHRoID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAvLyAgICAgcmV0dXJuIG5vZGUuZGVwdGg7XG4gICAgLy8gfTtcblxuLy8gICAgIG5vZGUubmFtZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4vLyAgICAgICAgIHJldHVybiBub2RlLm5hbWU7XG4vLyAgICAgfTtcblxuICAgIGFwaS5tZXRob2QgKCdpZCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ19pZCcpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ25vZGVfbmFtZScsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ25hbWUnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdicmFuY2hfbGVuZ3RoJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gbm9kZS5wcm9wZXJ0eSgnYnJhbmNoX2xlbmd0aCcpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3Jvb3RfZGlzdCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ19yb290X2Rpc3QnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdjaGlsZHJlbicsIGZ1bmN0aW9uIChkZWVwKSB7XG5cdHZhciBjaGlsZHJlbiA9IFtdO1xuXG5cdGlmIChkYXRhLmNoaWxkcmVuKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdGNoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHQgICAgfVxuXHR9XG5cdGlmICgoZGF0YS5fY2hpbGRyZW4pICYmIGRlZXApIHtcblx0ICAgIGZvciAodmFyIGo9MDsgajxkYXRhLl9jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuXHRcdGNoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5fY2hpbGRyZW5bal0pKTtcblx0ICAgIH1cblx0fVxuXHRpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG5cdCAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdHJldHVybiBjaGlsZHJlbjtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChkYXRhLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gdG50X25vZGUoZGF0YS5fcGFyZW50KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBub2RlO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0bnRfbm9kZTtcblxuIiwidmFyIHRyZWVfbm9kZSA9IHJlcXVpcmUoXCJ0bnQudHJlZS5ub2RlXCIpO1xuXG52YXIgYnViYmxlc1ZpZXcgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgXG4gICAgdmFyIGNvbmYgPSB7XG5cdGRpYW1ldGVyIDogNjAwLFxuXHRmb3JtYXQgOiBkMy5mb3JtYXQoXCIsZFwiKSxcblx0Y29sb3IgOiBkMy5zY2FsZS5jYXRlZ29yeTIwYygpLFxuXHRjb2xvclBhbGV0dGUgOiB0cnVlLFxuXHRkYXRhIDogdW5kZWZpbmVkLFxuXHR2YWx1ZSA6IFwidmFsdWVcIixcblx0a2V5IDogXCJuYW1lXCIsXG5cdGxhYmVsOiBcIm5hbWVcIixcblx0ZGl2SWQgOiB1bmRlZmluZWQsXG5cdG9uY2xpY2sgOiBmdW5jdGlvbiAoKSB7fSxcblx0ZHVyYXRpb246IDEwMDAsXG5cdGJyZWFkY3J1bXNDbGljayA6IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJlbmRlci5mb2N1cyhjb25mLmRhdGEpO1xuXHR9LFxuXHRtYXhWYWwgOiAxLFxuXHRsZWdlbmRUZXh0IDogXCI8dGV4dD5DdXJyZW50IHNjb3JlIHJhbmdlPC90ZXh0PlwiXG5cdC8vbGFiZWxPZmZzZXQgOiAxMFxuICAgIH07XG5cbiAgICB2YXIgZm9jdXM7IC8vIHVuZGVmIGJ5IGRlZmF1bHRcbiAgICB2YXIgaGlnaGxpZ2h0OyAvLyB1bmRlZiBieSBkZWZhdWx0XG4gICAgdmFyIHZpZXc7XG4gICAgdmFyIHN2ZztcbiAgICB2YXIgbGVnZW5kO1xuICAgIHZhciBidWJibGVzVmlld19nO1xuICAgIHZhciBicmVhZGNydW1zO1xuICAgIHZhciBwYWNrO1xuICAgIHZhciBub2RlcztcbiAgICB2YXIgY2lyY2xlO1xuICAgIHZhciBsYWJlbDtcbiAgICB2YXIgcGF0aDtcblxuICAgIHZhciBjdXJyVHJhbnNsYXRlID0gWzAsMF07XG4gICAgdmFyIGN1cnJTY2FsZSA9IDE7XG4gICAgLy8gdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKClcbiAgICAvLyBcdC5zY2FsZUV4dGVudChbMC44LCBJbmZpbml0eV0pXG4gICAgLy8gXHQub24oXCJ6b29tXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyBcdCAgICByZWRyYXcoc3ZnKTtcbiAgICAvLyBcdH0pO1xuICAgIFxuICAgIC8qXG4gICAgICogUmVuZGVyIHZhbGlkIEpTT04gZGF0YVxuICAgICAqL1xuICAgIHZhciByZW5kZXIgPSBmdW5jdGlvbihkaXYpIHtcblx0Y29uZi5kaXZJZCA9IGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKTtcblxuXHQvLyBicmVhZGNydW1zLWxpa2UgbmF2aWdhdGlvblxuXHRicmVhZGNydW1zID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiaWRcIiwgXCJjdHR2X2J1YmJsZXNWaWV3X2JyZWFkY3J1bXNcIilcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsXCI1MFwiKTtcblx0XG5cdHN2ZyA9IGQzLnNlbGVjdChkaXYpXG5cdCAgICAuYXBwZW5kKFwic3ZnXCIpXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGNvbmYuZGlhbWV0ZXIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBjb25mLmRpYW1ldGVyKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZfYnViYmxlc1ZpZXdcIik7XG5cblx0YnViYmxlc1ZpZXdfZyA9IHN2Z1xuXHQgICAgLmFwcGVuZChcImdcIik7XG5cdFxuXHRwYWNrID0gZDMubGF5b3V0LnBhY2soKVxuXHQgICAgLnZhbHVlKGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGRbY29uZi52YWx1ZV07XG5cdCAgICB9KVxuICAgICAgICAgICAgLnNvcnQobnVsbClcbiAgICAgICAgICAgIC5zaXplKFtjb25mLmRpYW1ldGVyLCBjb25mLmRpYW1ldGVyXSlcbiAgICAgICAgICAgIC5wYWRkaW5nKDEuNSk7XG5cblx0aWYgKGNvbmYubWF4VmFsICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGxlZ2VuZCA9IHN2Z1xuXHRcdC5hcHBlbmQoXCJnXCIpXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMjAsIFwiICsgKGNvbmYuZGlhbWV0ZXIgLSAyMCkgKyBcIilcIik7XG5cdCAgICBsZWdlbmRcblx0XHQuYXBwZW5kKFwicmVjdFwiKVxuXHRcdC5hdHRyKFwieFwiLCAwKVxuXHRcdC5hdHRyKFwieVwiLCAwKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgODApXG5cdFx0LmF0dHIoXCJoZWlnaHRcIiwgNSlcblx0XHQuYXR0cihcImZpbGxcIiwgXCIjYzZkY2VjXCIpO1xuXHQgICAgbGVnZW5kXG5cdFx0LmFwcGVuZChcInJlY3RcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIFwiY3R0dl9idWJibGVzVmlld19sZWdlbmRCYXJcIilcblx0XHQuYXR0cihcInhcIiwgMClcblx0XHQuYXR0cihcInlcIiwgMClcblx0XHQuYXR0cihcIndpZHRoXCIsIDApXG5cdFx0LmF0dHIoXCJoZWlnaHRcIiwgNSlcblx0XHQuYXR0cihcImZpbGxcIiwgZDMucmdiKDYyLDEzOSwxNzMpKTtcblx0ICAgIGxlZ2VuZFxuXHRcdC5hcHBlbmQoXCJwb2x5Z29uXCIpXG5cdCAgICBcdC5hdHRyKFwicG9pbnRzXCIsIFwiMCw1IC01LDE1IDUsMTVcIilcblx0ICAgIFx0LmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuXHQgICAgXHQuYXR0cihcInN0cm9rZVwiLCBcImJsYWNrXCIpXG5cdCAgICBcdC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDIpO1xuXG5cdCAgICBsZWdlbmRcblx0ICAgIFx0LmFwcGVuZChcInRleHRcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIFwiY3R0dl9idWJibGVzVmlld19jdXJyZW50TWF4VmFsdWVcIilcblx0ICAgIFx0LmF0dHIoXCJ4XCIsIDApXG5cdCAgICBcdC5hdHRyKFwieVwiLCAtNSlcblx0ICAgIFx0LmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuXHQgICAgXHQudGV4dChcIjBcIik7XG5cblx0ICAgIGxlZ2VuZFxuXHRcdC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdFx0LmF0dHIoXCJ4XCIsIC01KVxuXHRcdC5hdHRyKFwieVwiLCA1KVxuXHRcdC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcblx0XHQudGV4dCgwKTtcblxuXHQgICAgbGVnZW5kXG5cdFx0LmFwcGVuZChcInRleHRcIilcblx0XHQuYXR0cihcInhcIiwgODUpXG5cdFx0LmF0dHIoXCJ5XCIsIDUpXG5cdFx0LmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXG5cdFx0LnRleHQoY29uZi5tYXhWYWwpO1xuXG5cdCAgICBsZWdlbmRcblx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDEwMCwgNSlcIilcblx0XHQuaHRtbChjb25mLmxlZ2VuZFRleHQpO1xuXHQgICAgXG5cdCAgICAvLyBsZWdlbmRcblx0ICAgIC8vIFx0LmFwcGVuZChcImFcIilcblx0ICAgIC8vIFx0LmF0dHIoXCJ4XCIsIDEwMClcblx0ICAgIC8vIFx0LmF0dHIoXCJ5XCIsIDUpXG5cdCAgICAvLyBcdC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJzdGFydFwiKVxuXHQgICAgLy8gXHQuaHRtbChcIjxhIGhyZWY9J3hsaW5rOmhyZWY9XFxcImh0dHA6Ly93d3cuZ29vZ2xlLmNvbVxcXCInPkh1cnJhaCE8L2E+XCIpO1xuXG5cdH1cblx0XG5cdHJlbmRlci51cGRhdGUoKTtcblxuXHR2YXIgZCA9IGNvbmYuZGF0YS5kYXRhKCk7XG5cdHZpZXcgPSBbZC54LCBkLnksIGQucioyXTtcblx0Ly9mb2N1c1RvKFtkLngsIGQueSwgZC5yKjJdKTtcblx0Ly9yZW5kZXIuZm9jdXMgKGNvbmYuZGF0YSk7XG5cblx0cmV0dXJuIHJlbmRlcjtcbiAgICB9O1xuXG4gICAgcmVuZGVyLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcblx0Ly8gU2FmZWx5IHVuZm9jdXMgb24gdXBkYXRlXG5cblx0aWYgKGNvbmYuZGF0YS5jaGlsZHJlbigpKSB7XG5cdCAgICByZW5kZXIuZm9jdXMoY29uZi5kYXRhKTtcblx0fVxuXHRcblx0dmFyIHBhY2tEYXRhID0gcGFjay5ub2Rlcyhjb25mLmRhdGEuZGF0YSgpKTtcblx0XG5cdGNpcmNsZSA9IGJ1YmJsZXNWaWV3X2cuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXG5cdCAgICAuZGF0YShwYWNrRGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0XHQgICAgcmV0dXJuIGRbY29uZi5rZXldO1xuXHRcdH1cblx0XHRyZXR1cm4gZFtjb25mLmtleV0gKyBcIl9cIiArIGQuX3BhcmVudFtjb25mLmtleV07XG5cdCAgICB9KTtcblx0Ly8uZGF0YShwYWNrRGF0YSlcblxuXHQvLyBuZXcgY2lyY2xlc1xuXHRjaXJjbGVcbiAgICAgICAgICAgIC5lbnRlcigpXG5cdCAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIFwiYnViYmxlc1ZpZXdfXCIgKyBkW2NvbmYua2V5XSArIFwiX1wiICsgY29uZi5kaXZJZDtcblx0ICAgIH0pXG5cdCAgICAuY2xhc3NlZChcImJ1YmJsZXNWaWV3Tm9kZVwiLCB0cnVlKVxuXG5cdCAgICAub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKGQzLmV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcblx0XHQgICAgcmV0dXJuO1xuXHRcdH1cblx0XHRkMy5ldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0ICAgIH0pXG5cdCAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkMy5ldmVudC5kZWZhdWx0UHJldmVudGVkKSB7XG5cdFx0ICAgIHJldHVybjtcblx0XHR9XG5cdFx0Y29uZi5vbmNsaWNrLmNhbGwodGhpcywgdHJlZV9ub2RlKGQpKTtcblx0ICAgIH0pO1xuXHRjaXJjbGUuZXhpdCgpLnJlbW92ZSgpO1xuXG5cdC8vIC8vIHRpdGxlc1xuXHQvLyBidWJibGVzVmlld19nLnNlbGVjdEFsbChcInRpdGxlXCIpXG5cdC8vICAgICAuZGF0YShwYWNrRGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0Ly8gXHRyZXR1cm4gZC5faWQ7XG5cdC8vICAgICB9KVxuXHQvLyAgICAgLmVudGVyKClcblx0Ly8gICAgIC5hcHBlbmQoXCJ0aXRsZVwiKVxuICAgICAgICAvLyAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFtjb25mLmtleV0gKyBcIjogXCIgKyBjb25mLmZvcm1hdChkW2NvbmYudmFsdWVdKTsgfSk7XHRcblx0XG4gICAgICAgIC8vbmV3Tm9kZXMuYXBwZW5kIChcImNpcmNsZVwiKTtcblxuICAgICAgICAvL25ld05vZGVzLmFwcGVuZChcInRleHRcIik7XG5cblx0cGF0aCA9IGJ1YmJsZXNWaWV3X2cuc2VsZWN0QWxsKFwicGF0aFwiKVxuXHQgICAgLmRhdGEocGFja0RhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQuX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHJldHVybiBkW2NvbmYua2V5XTtcblx0XHR9XG5cdFx0cmV0dXJuIGRbY29uZi5rZXldICsgXCJfXCIgKyBkLl9wYXJlbnRbY29uZi5rZXldO1xuXHQgICAgfSk7XG5cdC8vIG5ldyBwYXRoc1xuXHRwYXRoXG5cdC8vLmRhdGEocGFja0RhdGEpXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInBhdGhcIilcblx0ICAgIC8vIC5hdHRyIChcImlkXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG5cdCAgICAvLyBcdHJldHVybiBcInNcIiArIGk7XG5cdCAgICAvLyB9KVxuXHQgICAgLmF0dHIoXCJpZFwiLCBmdW5jdGlvbihkLGkpe1xuXHQgICAgXHRpZiAoZC5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0ICAgIFx0ICAgIHJldHVybiBcInNfXCIgKyBkW2NvbmYua2V5XTtcblx0ICAgIFx0fVxuXHQgICAgXHRyZXR1cm4gXCJzX1wiKyBkW2NvbmYua2V5XSArIFwiX1wiICsgZC5fcGFyZW50W2NvbmYua2V5XTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpO1xuXG5cblx0bGFiZWwgPSBidWJibGVzVmlld19nLnNlbGVjdEFsbChcInRleHRcIilcblx0ICAgIC5kYXRhKHBhY2tEYXRhLCBmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICByZXR1cm4gZFtjb25mLmtleV07XG5cdFx0fVxuXHRcdHJldHVybiBkW2NvbmYua2V5XSArIFwiX1wiICsgZC5fcGFyZW50W2NvbmYua2V5XTtcblx0ICAgIH0pO1xuXHQvLy5kYXRhKHBhY2tEYXRhKVxuXG5cdHZhciBuZXdMYWJlbHMgPSBsYWJlbFxuXHQgICAgLmVudGVyKClcblx0ICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQuY2hpbGRyZW4pIHJldHVybiBcInRvcExhYmVsXCI7XG5cdFx0cmV0dXJuIFwibGVhZkxhYmVsXCI7XG5cdCAgICB9KVxuXHQgICAgLnN0eWxlKFwiY3Vyc29yXCIsIFwiZGVmYXVsdFwiKVxuXHQgICAgLmF0dHIoXCJwb2ludGVyLWV2ZW50c1wiLCBmdW5jdGlvbiAoZCkge3JldHVybiBkLmNoaWxkcmVuID8gXCJhdXRvXCIgOiBcIm5vbmVcIjt9KVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGQpIHsgLy8gb25seSBvbiB0aG9zZSB3aXRoIHBvaW50ZXItZXZlbnRzIFwiYXV0b1wiIGllLCBvbiB0aGVyYXBldXRpYyBhcmVhcyBsYWJlbHNcblx0XHRpZiAoZDMuZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xuXHRcdCAgICByZXR1cm47XG5cdFx0fVxuXHRcdGNvbmYub25jbGljay5jYWxsKHRoaXMsIHRyZWVfbm9kZShkKSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIFwibmF2eVwiKVxuXHQgICAgLmF0dHIoXCJmb250LXNpemVcIiwgMTApXG5cdCAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpO1xuXG5cdC8vIENyZWF0ZSBuZXcgbGFiZWxzIG9uIHRoZXJhcGV1dGljIGFyZWFzXG5cdG5ld0xhYmVsc1xuXHQgICAgLmVhY2goZnVuY3Rpb24gKGQsIGkpIHtcblx0XHRpZiAoZC5jaGlsZHJlbikge1xuXHRcdCAgICBkMy5zZWxlY3QodGhpcylcblx0XHRcdC5hcHBlbmQoXCJ0ZXh0UGF0aFwiKVxuXHRcdFx0Ly8gLmF0dHIoXCJ4bGluazpocmVmXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRcdC8vICAgICByZXR1cm4gXCIjc1wiICsgaTtcblx0XHRcdC8vIH0pXG5cdFx0XHQuYXR0cihcInhsaW5rOmhyZWZcIiwgZnVuY3Rpb24gKCkge1xuXHRcdFx0ICAgIGlmIChkLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXR1cm4gXCIjc19cIiArIGRbY29uZi5rZXldO1xuXHRcdFx0ICAgIH1cblx0XHRcdCAgICByZXR1cm4gXCIjc19cIiArIGRbY29uZi5rZXldICsgXCJfXCIgKyBkLl9wYXJlbnRbY29uZi5rZXldO1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwic3RhcnRPZmZzZXRcIiwgXCI1MCVcIilcblx0XHRcdC50ZXh0KGZ1bmN0aW9uICgpIHtcblx0XHRcdCAgICByZXR1cm4gZFtjb25mLmxhYmVsXSA/IGRbY29uZi5sYWJlbF0uc3Vic3RyaW5nKDAsIE1hdGguUEkqZC5yLzgpIDogXCJcIjtcblx0XHRcdH0pO1xuXHRcdH1cblx0ICAgIH0pO1xuXG5cdGxhYmVsLmV4aXQoKS5yZW1vdmUoKTtcblxuXHR2YXIgdXBkYXRlVHJhbnNpdGlvbiA9IGJ1YmJsZXNWaWV3X2cudHJhbnNpdGlvbigpXG5cdCAgICAuZHVyYXRpb24oY29uZi5kdXJhdGlvbik7XG5cblx0dXBkYXRlVHJhbnNpdGlvblxuXHQgICAgLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuXHQgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkLng7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkLnk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQucjtcblx0ICAgIH0pO1xuXG5cdC8vIE1vdmUgbGFiZWxzXG5cdHVwZGF0ZVRyYW5zaXRpb25cblx0ICAgIC5zZWxlY3RBbGwoXCIubGVhZkxhYmVsXCIpXG5cdCAgICAuYXR0cihcImR5XCIsIFwiLjNlbVwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLng7IH0pXG5cdCAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQueTsgfSlcblx0ICAgIC50ZXh0KGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGRbY29uZi5sYWJlbF0uc3Vic3RyaW5nKDAsIGQuciAvIDMpO1xuXHQgICAgfSk7XG5cdFxuXHQvLyBNb3ZlIGxhYmVsc1xuXHQvLyBsYWJlbFxuXHQvLyAgICAgLmVhY2goZnVuY3Rpb24gKGQsIGkpIHtcblx0Ly8gXHRpZiAoIWQuY2hpbGRyZW4pIHtcblx0Ly8gXHQgICAgZDMuc2VsZWN0KHRoaXMpXG5cdC8vIFx0XHQudHJhbnNpdGlvbigpXG5cdC8vIFx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0Ly8gXHRcdC5hdHRyKFwiZHlcIiwgXCIuM2VtXCIpXG5cdC8vIFx0XHQuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQueDsgfSlcblx0Ly8gXHRcdC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC55OyB9KVxuXHQvLyBcdFx0LnRleHQoZnVuY3Rpb24gKGQpIHtcblx0Ly8gXHRcdCAgICByZXR1cm4gZFtjb25mLmxhYmVsXS5zdWJzdHJpbmcoMCwgZC5yIC8gMyk7XG5cdC8vIFx0XHR9KTtcblx0Ly8gXHR9XG5cdC8vICAgICB9KTtcblxuXHR1cGRhdGVUcmFuc2l0aW9uXG5cdCAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxuXHQgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGRlc2NyaWJlQXJjKGQueCwgZC55KzEwLCBkLnIsIDE2MCwgLTE2MCk7XG5cdCAgICB9KTtcblxuXHRcblx0Ly8gTW92aW5nIG5vZGVzXG5cdGNpcmNsZVxuXHQgICAgLy8uYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxuXHQgICAgLmNsYXNzZWQgKFwiYnViYmxlc1ZpZXdMZWFmXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuICFkLmNoaWxkcmVuO1xuXHQgICAgfSlcblx0ICAgIC5jbGFzc2VkIChcImJ1YmJsZXNWaWV3Um9vdFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAhZC5fcGFyZW50O1xuXHQgICAgfSk7XG5cdCAgICAvLyAudHJhbnNpdGlvbigpXG5cdCAgICAvLyAuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0ICAgIC8vIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIC8vIFx0cmV0dXJuIGQueDtcblx0ICAgIC8vIH0pXG5cdCAgICAvLyAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLnk7IH0pXG5cdCAgICAvLyAuYXR0cihcInJcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQucjsgfSk7XG5cblxuXHQvLyAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XG5cdCAgICAvLyBcdHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueCArIFwiLFwiICsgZC55ICsgXCIpXCI7XG5cdCAgICAvLyB9KTtcblxuXHQvL1x0bm9kZXMuc2VsZWN0KFwicGF0aFwiKVx0XHRcdCAgIFxuXG5cdC8vbm9kZXMuc2VsZWN0KFwidGV4dFwiKVxuXHRcbiAgICAgICAgLy8gbm9kZXMuc2VsZWN0KFwiY2lyY2xlXCIpXG5cdC8vICAgICAuYXR0ciAoXCJjbGFzc1wiLCBmdW5jdGlvbiAoZCkge1xuXHQvLyAgICAgXHRyZXR1cm4gXCJidWJibGVzVmlld19cIiArIGRbY29uZi5rZXldICsgXCJfXCIgKyBjb25mLmRpdklkO1xuXHQvLyAgICAgfSlcblx0Ly8gICAgIC50cmFuc2l0aW9uKClcblx0Ly8gICAgIC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuXHQvLyAgICAgLmF0dHIgKFwiclwiLCBmdW5jdGlvbihkKSB7XG5cdC8vIFx0Ly9yZXR1cm4gZC5yIC0gKGQuY2hpbGRyZW4gPyAwIDogY29uZi5sYWJlbE9mZnNldCk7XG5cdC8vIFx0cmV0dXJuIGQucjtcblx0Ly8gICAgIH0pO1xuXHRcblx0Ly9jaXJjbGUgPSBub2Rlcy5zZWxlY3RBbGwoXCJjaXJjbGVcIik7XG5cblx0Ly8gRXhpdGluZyBub2Rlc1xuXHQvLyBub2Rlc1xuXHQvLyAgICAgLmV4aXQoKVxuXHQvLyAgICAgLnJlbW92ZSgpO1xuXG5cdC8vIFNpemUgbGVnZW5kXG5cdHZhciBtYXhDdXJyZW50VmFsID0gMDtcblx0Y29uZi5kYXRhLmFwcGx5KGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICB2YXIgc2NvcmUgPSBub2RlLnByb3BlcnR5KFwiYXNzb2NpYXRpb25fc2NvcmVcIik7XG5cdCAgICBpZiAoc2NvcmUgJiYgc2NvcmUgPiBtYXhDdXJyZW50VmFsKSB7XG5cdFx0bWF4Q3VycmVudFZhbCA9IHNjb3JlO1xuXHQgICAgfVxuXHR9KTtcblxuXHRpZiAoY29uZi5tYXhWYWwgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgdmFyIGxlZ2VuZFNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcblx0XHQucmFuZ2UoWzAsODBdKVxuXHRcdC5kb21haW4oWzAsY29uZi5tYXhWYWxdKTtcblxuXHQgICAgdmFyIHBvcyA9IGxlZ2VuZFNjYWxlKG1heEN1cnJlbnRWYWwpO1xuXHQgICAgbGVnZW5kXG5cdFx0LnNlbGVjdChcIi5jdHR2X2J1YmJsZXNWaWV3X2xlZ2VuZEJhclwiKVxuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0XHQuYXR0cihcIndpZHRoXCIsIHBvcyk7XG5cdCAgICBsZWdlbmRcblx0XHQuc2VsZWN0KFwicG9seWdvblwiKVxuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0ICAgIFx0LmF0dHIoXCJwb2ludHNcIiwgKChwb3MrMCkgKyBcIiw1IFwiICsgKHBvcy01KSArIFwiLDE1IFwiICsgKHBvcys1KSArIFwiLDE1XCIpKTtcblx0ICAgIGxlZ2VuZFxuXHRcdC5zZWxlY3QoXCIuY3R0dl9idWJibGVzVmlld19jdXJyZW50TWF4VmFsdWVcIilcblx0XHQudHJhbnNpdGlvbigpXG5cdFx0LmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG5cdCAgICBcdC5hdHRyKFwieFwiLCBwb3MpXG5cdCAgICBcdC50ZXh0KG1heEN1cnJlbnRWYWwpO1xuXHR9XG4gICAgfTtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIEF1eGlsaWFyIGZ1bmN0aW9ucyAvL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgZnVuY3Rpb24gcG9sYXJUb0NhcnRlc2lhbihjZW50ZXJYLCBjZW50ZXJZLCByYWRpdXMsIGFuZ2xlSW5EZWdyZWVzKSB7XG5cdHZhciBhbmdsZUluUmFkaWFucyA9IChhbmdsZUluRGVncmVlcy05MCkgKiBNYXRoLlBJIC8gMTgwLjA7XG5cdHJldHVybiB7XG5cdCAgICB4OiBjZW50ZXJYICsgKHJhZGl1cyAqIE1hdGguY29zKGFuZ2xlSW5SYWRpYW5zKSksXG5cdCAgICB5OiBjZW50ZXJZICsgKHJhZGl1cyAqIE1hdGguc2luKGFuZ2xlSW5SYWRpYW5zKSlcblx0fTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXNjcmliZUFyYyh4LCB5LCByYWRpdXMsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlKXtcblx0dmFyIHN0YXJ0ID0gcG9sYXJUb0NhcnRlc2lhbih4LCB5LCByYWRpdXMsIGVuZEFuZ2xlKTtcblx0dmFyIGVuZCA9IHBvbGFyVG9DYXJ0ZXNpYW4oeCwgeSwgcmFkaXVzLCBzdGFydEFuZ2xlKTtcblx0dmFyIGFyY1N3ZWVwID0gZW5kQW5nbGUgLSBzdGFydEFuZ2xlIDw9IDE4MCA/IFwiMFwiIDogXCIxXCI7XG5cdHZhciBkID0gW1xuXHQgICAgXCJNXCIsIHN0YXJ0LngsIHN0YXJ0LnksXG5cdCAgICBcIkFcIiwgcmFkaXVzLCByYWRpdXMsIDAsIDEsIDEsIGVuZC54LCBlbmQueVxuXHRdLmpvaW4oXCIgXCIpO1xuXHRyZXR1cm4gZDtcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gcmVkcmF3ICh2aXopIHtcblx0dml6LmF0dHIgKFwidHJhbnNmb3JtXCIsXG5cdFx0ICAgXCJ0cmFuc2xhdGUgKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpIFwiICtcblx0XHQgIFwic2NhbGUgKFwiICsgZDMuZXZlbnQuc2NhbGUgKyBcIilcIik7XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIGZvY3VzVG8gKHYpIHtcblx0dmFyIGsgPSBjb25mLmRpYW1ldGVyIC8gdlsyXTtcblx0dmFyIG9mZnNldCA9IGNvbmYuZGlhbWV0ZXIgLyAyO1xuXHR2aWV3ID0gdjtcblxuXHRjaXJjbGVcblx0ICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gKChkLnggLSB2WzBdKSprKStvZmZzZXQ7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAoKGQueSAtIHZbMV0pKmspK29mZnNldDtcblx0ICAgIH0pXG5cdCAgICAvLyAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XG5cdCAgICAvLyBcdHJldHVybiBcInRyYW5zbGF0ZShcIiArICgoKGQueCAtIHZbMF0pICogaykgKyBvZmZzZXQpICsgXCIsXCIgKyAoKChkLnkgLSB2WzFdKSAqIGspICsgb2Zmc2V0KSArIFwiKVwiO1xuXHQgICAgLy8gfSk7XG5cdCAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24oZCkge1xuXHRcdHJldHVybiBkLnIgKiBrO1xuXHQgICAgfSk7XG5cblx0cGF0aFxuXHQgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGRlc2NyaWJlQXJjKCgoZC54LXZbMF0pKmspK29mZnNldCwgKChkLnktdlsxXSkqaykrMTArb2Zmc2V0LCBkLnIqaywgMTYwLCAtMTYwKTtcblx0ICAgIH0pO1xuXG5cdGxhYmVsXG5cdCAgICAuZWFjaChmdW5jdGlvbiAoZCwgaSkge1xuXHRcdGlmIChkLmNoaWxkcmVuKSB7XG5cdFx0ICAgIGQzLnNlbGVjdCh0aGlzKVxuXHRcdFx0LnNlbGVjdChcIipcIilcblx0XHRcdC5yZW1vdmUoKTtcblx0XHQgICAgZDMuc2VsZWN0KHRoaXMpXG5cdFx0ICAgIFx0LmFwcGVuZChcInRleHRQYXRoXCIpXG5cdFx0XHQvLyAuYXR0cihcInhsaW5rOmhyZWZcIiwgZnVuY3Rpb24gKCkge1xuXHRcdFx0Ly8gICAgIHJldHVybiBcIiNzXCIraTtcblx0XHRcdC8vIH0pXG5cdFx0XHQuYXR0cihcInhsaW5rOmhyZWZcIiwgZnVuY3Rpb24gKCkge1xuXHRcdFx0ICAgIGlmIChkLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXR1cm4gXCIjc19cIiArIGRbY29uZi5rZXldO1xuXHRcdFx0ICAgIH1cblx0XHRcdCAgICByZXR1cm4gXCIjc19cIiArIGRbY29uZi5rZXldICsgXCJfXCIgKyBkLl9wYXJlbnRbY29uZi5rZXldO1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwic3RhcnRPZmZzZXRcIiwgXCI1MCVcIilcblx0XHRcdC50ZXh0KGZ1bmN0aW9uICgpIHtcblx0XHRcdCAgICByZXR1cm4gZFtjb25mLmxhYmVsXSA/IGRbY29uZi5sYWJlbF0uc3Vic3RyaW5nKDAsIE1hdGguUEkqZC5yKmsvOCkgOiBcIlwiO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHQgICAgZDMuc2VsZWN0KHRoaXMpXG5cdFx0ICAgIFx0LmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7IHJldHVybiAoKGQueCAtIHZbMF0pKmspK29mZnNldDsgfSlcblx0XHRcdC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gKChkLnkgLSB2WzFdKSprKStvZmZzZXQ7IH0pXG5cdFx0ICAgIFx0LnRleHQoZnVuY3Rpb24gKGQpIHtcblx0XHRcdCAgICBpZiAoZFtjb25mLmxhYmVsXSkge1xuXHRcdFx0XHRyZXR1cm4gZFtjb25mLmxhYmVsXS5zdWJzdHJpbmcoMCwgZC5yKmsgLyAzKTtcblx0XHRcdCAgICB9XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJmb250LXNpemVcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdCAgICB2YXIgY2lyY2xlTGVuZ3RoID0gZC5yICogayAvIDM7XG5cdFx0XHQgICAgdmFyIGxhYmVsTGVuZ3RoID0gZFtjb25mLmxhYmVsXSA/IGRbY29uZi5sYWJlbF0ubGVuZ3RoIDogMDtcblx0XHRcdCAgICBpZiAoY2lyY2xlTGVuZ3RoIDwgbGFiZWxMZW5ndGgpIHtcblx0XHRcdFx0cmV0dXJuIDEwO1xuXHRcdFx0ICAgIH1cblx0XHRcdCAgICBpZiAoY2lyY2xlTGVuZ3RoICogMC44IDwgbGFiZWxMZW5ndGgpIHtcblx0XHRcdFx0cmV0dXJuIDEyO1xuXHRcdFx0ICAgIH1cblx0XHRcdCAgICBpZiAoY2lyY2xlTGVuZ3RoICogMC42IDwgbGFiZWxMZW5ndGgpIHtcblx0XHRcdFx0cmV0dXJuIDE0O1xuXHRcdFx0ICAgIH1cblx0XHRcdH0pO1xuXHRcdH1cblx0ICAgIH0pO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy9cbiAgICAvLyBBUEkgIC8vXG4gICAgLy8vLy8vLy8vL1xuXG4gICAgcmVuZGVyLm1heFZhbCA9IGZ1bmN0aW9uICh2KSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYubWF4VmFsO1xuXHR9XG5cdGNvbmYubWF4VmFsID0gdjtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5sZWdlbmRUZXh0ID0gZnVuY3Rpb24gKHQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5sZWdlbmRUZXh0O1xuXHR9XG5cdGNvbmYubGVnZW5kVGV4dCA9IHQ7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcmVuZGVyLnNlbGVjdCA9IGZ1bmN0aW9uIChub2Rlcykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBoaWdobGlnaHQ7XG5cdH1cblx0aGlnaGxpZ2h0ID0gbm9kZXM7XG5cblx0Ly8gVW5oaWdobGlnaHQgZXZlcnl0aGluZ1xuXHRkMy5zZWxlY3RBbGwoXCIuaGlnaGxpZ2h0XCIpXG5cdCAgICAuY2xhc3NlZChcImhpZ2hsaWdodFwiLCBmYWxzZSk7XG5cblx0Ly8gTm8gbm9kZSB0byBoaWdobGlnaHRcblx0aWYgKChub2RlcyA9PT0gbnVsbCkgfHwgKG5vZGVzID09PSB1bmRlZmluZWQpIHx8IChub2Rlcy5sZW5ndGggPT09IDApKSB7XG5cdCAgICByZXR1cm4gdGhpcztcblx0fVxuXG5cdGZvciAodmFyIGk9MDsgaTxub2Rlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIG5vZGUgPSBub2Rlc1tpXTtcblx0ICAgIHZhciBjaXJjbGUgPSBkMy5zZWxlY3RBbGwoXCIuYnViYmxlc1ZpZXdfXCIgKyBub2RlLnByb3BlcnR5KGNvbmYua2V5KSArIFwiX1wiICsgY29uZi5kaXZJZCk7XG5cdCAgICBjaXJjbGVcblx0XHQuY2xhc3NlZCAoXCJoaWdobGlnaHRcIiwgdHJ1ZSk7XG5cdH1cblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBcbiAgICByZW5kZXIuZm9jdXMgPSBmdW5jdGlvbiAobm9kZSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBmb2N1cztcblx0fVxuXG5cdC8vIEJyZWFkY3J1bXNcblx0dmFyIHVwID0gW107XG5cdG5vZGUudXBzdHJlYW0gKGZ1bmN0aW9uIChhbmNlc3Rvcikge1xuXHQgICAgaWYgKGFuY2VzdG9yLnBhcmVudCgpID09PSB1bmRlZmluZWQpIHtcblx0XHR1cC5wdXNoKGFuY2VzdG9yLnByb3BlcnR5KGNvbmYubGFiZWwpIHx8IFwiQWxsXCIpO1xuXHQgICAgfSBlbHNlIHtcblx0XHR1cC5wdXNoKG5vZGUucHJvcGVydHkoY29uZi5sYWJlbCkpO1xuXHQgICAgfVxuXHR9KTtcblx0dXAucmV2ZXJzZSgpO1xuXG5cdHZhciBicmVhZExhYmVscyA9IGJyZWFkY3J1bXMuc2VsZWN0QWxsKFwic3BhblwiKVxuXHQgICAgLmRhdGEodXAsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQ7XG5cdCAgICB9KTtcblxuXHRicmVhZExhYmVsc1xuXHQgICAgLmVudGVyKClcblx0ICAgIC5hcHBlbmQoXCJzcGFuXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dl9idWJibGVzVmlld19icmVhZGNydW1MYWJlbFwiKVxuXHQgICAgLnRleHQoZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDtcblx0ICAgIH0pO1xuXHRicmVhZExhYmVsc1xuXHQgICAgLmNsYXNzZWQgKFwiY3R0dl9idWJibGVzVmlld19saW5rXCIsIGZhbHNlKVxuXHQgICAgLm9uIChcImNsaWNrXCIsIG51bGwpO1xuXG5cdGJyZWFkTGFiZWxzLmV4aXQoKS5yZW1vdmUoKTtcblxuXHRicmVhZGNydW1zLnNlbGVjdEFsbChcIjpub3QoOmxhc3QtY2hpbGQpXCIpXG5cdCAgICAuY2xhc3NlZCAoXCJjdHR2X2J1YmJsZXNWaWV3X2xpbmtcIiwgdHJ1ZSlcblx0ICAgIC5vbihcImNsaWNrXCIsIGNvbmYuYnJlYWRjcnVtc0NsaWNrKTtcblxuXHQvLyBGb2N1c1xuXHRmb2N1cyA9IG5vZGU7XG5cdHZhciBmb2N1c0RhdGEgPSBmb2N1cy5kYXRhKCk7XG5cdHZhciB0cmFuc2l0aW9uID0gZDMudHJhbnNpdGlvbigpXG5cdCAgICAuZHVyYXRpb24gKGNvbmYuZHVyYXRpb24pXG5cdCAgICAudHdlZW4gKFwiem9vbVwiLCBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGkgPSBkMy5pbnRlcnBvbGF0ZVpvb20gKHZpZXcsIFtmb2N1c0RhdGEueCwgZm9jdXNEYXRhLnksIGZvY3VzRGF0YS5yKjJdKTtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHQpIHtcblx0XHQgICAgZm9jdXNUbyhpKHQpKTtcblx0XHR9O1xuXHQgICAgfSk7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICByZW5kZXIuYnJlYWRjcnVtc0NsaWNrID0gZnVuY3Rpb24gKGNiKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYuYnJlYWRjcnVtc0NsaWNrO1xuXHR9XG5cdGNvbmYuYnJlYWRjcnVtc0NsaWNrID0gY2I7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcmVuZGVyLmRhdGEgPSBmdW5jdGlvbiAobmV3RGF0YSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25mLmRhdGE7XG5cdH1cblx0Y29uZi5kYXRhID0gbmV3RGF0YTtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5vbmNsaWNrID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5vbmNsaWNrO1xuXHR9XG5cdGNvbmYub25jbGljayA9IGNiYWs7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcmVuZGVyLmtleSA9IGZ1bmN0aW9uIChuKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYua2V5O1xuXHR9XG5cdGNvbmYua2V5ID0gbjtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5sYWJlbCA9IGZ1bmN0aW9uIChuKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYubGFiZWw7XG5cdH1cblx0Y29uZi5sYWJlbCA9IG47XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICByZW5kZXIudmFsdWUgPSBmdW5jdGlvbiAodikge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25mLnZhbHVlO1xuXHR9XG5cdGNvbmYudmFsdWUgPSB2O1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmVuZGVyLmRpYW1ldGVyID0gZnVuY3Rpb24gKGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5kaWFtZXRlcjtcblx0fVxuXHRjb25mLmRpYW1ldGVyID0gZDtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8vIHJlbmRlci5mbGF0ID0gZnVuY3Rpb24gKGJvb2wpIHtcbiAgICAvLyBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIC8vIFx0ICAgIHJldHVybiBjb25mLmZsYXQ7XG4gICAgLy8gXHR9XG4gICAgLy8gXHRjb25mLmZsYXQgPSBib29sO1xuICAgIC8vIFx0cmV0dXJuIHRoaXM7XG4gICAgLy8gfTtcblxuICAgIC8vIHJlbmRlci5ub2RlID0gdHJlZV9ub2RlO1xuICAgIHJldHVybiByZW5kZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJ1YmJsZXNWaWV3O1xuIl19
