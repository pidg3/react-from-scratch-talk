const SQUARES_TO_RENDER = 2000;

class GraphiteComponent {
  constructor(props) {
    this.props = props;
  }
}

class SquaresDemo extends GraphiteComponent {
  render() {
    let squares = [];
    for (let i = 0; i < SQUARES_TO_RENDER; i++) {
      if (i % 2 == 0) {
        squares.push(createGraphiteElement(ColorSquare, { className: "red-square", key: i }));
      } else {
        squares.push(createGraphiteElement(ColorSquare, { className: "blue-square", key: i }));
      }
    }
    return createGraphiteElement(
      "div",
      null,
      createGraphiteElement(Counter, { count: superSimpleState.count }),
      createGraphiteElement(
        "div",
        { "class": "container" },
        squares
      )
    );
  }
}

class ColorSquare extends GraphiteComponent {
  render() {
    var list = this.props.list;
    return createGraphiteElement("div", { id: "test-square", "class": this.props.className });
  }
}

class Counter extends GraphiteComponent {
  render() {
    return createGraphiteElement(
      "div",
      { "class": "counter-box" },
      createGraphiteElement(
        "span",
        null,
        this.props.count
      )
    );
  }
}

let superSimpleState = {
  count: 0
};

setInterval(() => {
  superSimpleState.count++;
  tick();
}, 10);

// The element we want to render into
var target = document.getElementById('mount');

// The function that re-renders the whole app
function tick() {
  renderToDOM(createGraphiteElement(SquaresDemo, { onOffState: superSimpleState.onOff }), target);
}

// First load
tick();

// ==== Naive React Implementation ====

/*
  Create our element tree
*/
function createGraphiteElement(type, props = {}) {
  // If we are rendering a function/class (i.e. a React component),
  // ... call render on this
  if (typeof type === 'function') {
    const element = new type(props);
    return element.render(props);
  }
  // Get the children from props
  const children = [].concat.apply([], Array.prototype.slice.call(arguments).slice(2));
  // Iterate through multiple children if needed
  if (children.length > 1) {
    for (var i in children) {
      var child = children[i];
      // Render text only base nodes
      if (child && typeof child != 'object') {
        children[i] = createGraphiteElement('span', null, child.toString());
      }
    }
  }
  return { type: type, props: props, children: children };
}

function prepare(tree, depth) {
  depth = depth || [0];
  if (Array.isArray(tree)) {
    // recursively prepare arrays of elements (children)
    for (var i in tree) {
      tree[i] = prepare(tree[i] || ' ', depth.concat(parseInt(i)));
    }
  } else {
    // 'tree' is a single element object

    // calculate depth/unique path to element
    // for tracking purposes
    tree._depth = depth;

    // prepare children
    if (tree.children) {
      tree.children = prepare(tree.children, depth);
    }
  }
  return tree;
}

function renderNodes(nodes, target) {
  if (Array.isArray(nodes)) {
    for (var i in nodes) {
      renderNodes(nodes[i], target);
    }
  } else {
    // actually just a single node
    var node = nodes;

    if (node === null) {
      // whitespace between elements
      target.appendChild(document.createTextNode(' '));
    } else if (typeof node === 'string' || typeof node === 'number') {
      // at the bottom of the tree we have plain
      // text nodes, they are guaranteed to be single
      // children, so just set inner html of the container
      if (target.innerHTML !== node) {
        target.innerHTML = node;
      }
    } else {
      var el;

      // find existing node first if possible
      var dataId = 'ui.' + node._depth.join('.');
      var existing = target.querySelector(node.type + '[data-ui-id="' + dataId + '"]');

      // the relative depth of this node in its container
      var relativeDepth = node._depth[node._depth.length - 1];
      // the node at the same location in the existing DOM
      // if there is one
      var nodeAtSameLocation = target.children[relativeDepth];

      // if there's no existing node, or the node at the correct
      // place is not the *same* node, then we need a new one
      // to replace it with
      if (!existing || nodeAtSameLocation && !nodeAtSameLocation.isSameNode(existing)) {
        el = document.createElement(node.type);
        el.dataset.uiId = dataId;
      } else {
        el = existing;
      }

      // various annoying attribute handling
      // IRL there would be a lot more stuff here
      if (node.props) {
        var mapping = { className: 'class' };
        var special = ['onChange', 'onClick', 'value'];
        for (var i in node.props) {
          if (special.indexOf(i) != -1) {
            continue;
          }
          el.setAttribute(mapping[i] || i, node.props[i]);
        }
        if (node.props.onChange) {
          el.onkeyup = node.props.onChange;
        }
        if (node.props.onClick) {
          el.onclick = node.props.onClick;
        }
        if (node.props.onSubmit) {
          el.onsubmit = node.props.onSubmit;
        }
        if (node.props.value) {
          el.value = node.props.value;
        }
      }

      // recursively render the children of this node
      if (node.children) {
        renderNodes(node.children, el);

        // after rendering children at this depth
        // we need to clean up extra old nodes
        // because otherwise they will get left around
        // untouched (we aren't 'diffing' just brute-forcing)
        if (el.children.length > node.children.length) {
          var stop = node.children.length;
          for (var i = el.children.length; i > stop; i--) {
            el.removeChild(el.children[i - 1]);
          }
        }
      }

      // if we have no existing node, we just need
      // to append the new one
      if (!existing) {
        target.appendChild(el);
      }
      // otherwise drop in the new node, which might be a no-op
      else {
          target.replaceChild(existing, el);
        }
    }
  }
}

function renderToDOM(tree, container) {
  return renderNodes(prepare(tree), container);
}

