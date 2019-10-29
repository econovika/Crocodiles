const mkId = require('./id');
const colors = require('./colors');

class Expr {
  constructor() {
    this.id = mkId();
  }
}

class Var extends Expr {
  constructor(color = 0) {
    super();
    this.color = color;
  }

  toString () {
    return this.ix;
  }

  equals (expr) {
    if (!(expr instanceof Var))
      return false;

    return this.ix == expr.ix;
  }
}

class App extends Expr {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }

  toString() {
    return '(' + this.left.toString() + ') (' + this.right.toString() + ')';
  }

  equals (expr) {
    if (!(expr instanceof App))
      return false;
    return this.left.equals(expr.left) && this.right.equals(expr.right);
  }
}

class Lam extends Expr {
  constructor(expr, color = 0) {
    super();
    this.expr = expr;
    this.color = color;
  }

  toString() {
    return '\\.(' + this.id + ') ' + this.expr.toString();
  }

  equals (expr) {
    if (!(expr instanceof Lam))
      return false;
    return this.expr.equals(expr.expr);
  }
}

class Placeholder extends Expr {
  constructor() {
    super();
  }

  toString() {
    return '(placeholder ' + this.id + ')';
  }

  equals (expr) {
    if (!(expr instanceof Placeholder))
      return false;
    return true;
  }
}

function deep_copy(expr) {

  if (expr instanceof Var) {
    return new Var(expr.color);
  }

  if (expr instanceof Lam) {
    return new Lam(deep_copy(expr.expr), expr.color);
  }

  if (expr instanceof App) {
    return new App(deep_copy(expr.left), deep_copy(expr.right));
  }

  if (expr instanceof Placeholder) {
    return new Placeholder(expr.id);
  }

  throw new Error("deep_copy: no match");
}

function changeColorAt (expr, id) {
  if (expr instanceof Var) {
    if (expr.id == id) {
      expr.color = (expr.color + 1) % colors.length;
    }
    return expr;
  }
  if (expr instanceof App) {
    return new App(
      changeColorAt(expr.left, id),
      changeColorAt(expr.right, id)
    );
  }

  if (expr instanceof Lam) {
    if (expr.id == id) {
      expr.color = (expr.color + 1) % colors.length;
      return expr;
    } else {
      return new Lam(changeColorAt(expr.expr, id), expr.color);
    }
  }

  return expr;
}

function mapAt (id, expr, f) {

  function go(expr, depth) {
    if (expr.id == id) {
      return f(expr, depth);
    }

    if (expr instanceof Var) {
      return expr;
    }

    if (expr instanceof App) {
      expr.left = go(expr.left, depth);
      expr.right = go(expr.right, depth);
      return expr;
    }

    if (expr instanceof Lam) {
      expr.expr = go(expr.expr, depth + 1);
      return expr;
    }

    if (expr instanceof Placeholder) {
      return expr;
    }

    throw "mapAt: no match";
  };

  return go(expr, 0);
}

const replaceWithPlaceholder = (id, expr) => {
  return mapAt(id, expr, (old, depth) => {
    console.log('replacing');
    return new Placeholder();
  });
};

const insertIntoPlaceholder = (id, expr, target) => {
  return mapAt(id, expr, (ph, depth) => {
    const newExpr = deep_copy(target);
    newExpr.color = depth - 1;
    if (newExpr.color < 0) {
      newExpr.color = 0;
    }
    return newExpr;
  });
};


// replace vars of color 'color' with 'what' in 'expr';
function make_substitution(expr, what, color) {

  let success = false;

  function substitution(expr) {
    if (expr instanceof Var) {
      if (expr.color == color) {
        success = true;
        return deep_copy(what);
      }
      return expr;
    }

    if (expr instanceof App) {
      return new App(
        substitution(expr.left),
        substitution(expr.right)
      );
    }

    if (expr instanceof Lam) {
      if (expr.color == color) {
        return deep_copy(expr);
      } else {
        return new Lam(substitution(expr.expr), expr.color);
      }
    }

    throw new Error("substitution: no match");
  }


  return substitution(expr);
}

function markRedex(expr) {
  if (expr instanceof Var) {
    return null;
  }

  if (expr instanceof Lam) {
    return markRedex(expr.expr);
  }

  if (expr instanceof App) {
    if (expr.left instanceof Lam) {
      expr.left = deep_copy(expr.left);
      expr.left.marked = true;
      expr.right = deep_copy(expr.right);
      expr.right.eaten = true;
      console.log('marked');
      return true;
    } else {
      return markRedex(expr.left) || markRedex(expr.right);
    }
  }

  if (expr instanceof Placeholder) {
    return null;
  }

  throw new Error("findRedex: no match");
}

function make_reduction_step(expr) {
  if (expr instanceof Var) {
    return null;
  }

  if (expr instanceof Lam) {
    const t = make_reduction_step(expr.expr);
    if (t === null) {
      return null;
    } else {
      return new Lam(t, expr.color);
    }
  }

  if (expr instanceof App) {
    if (expr.left instanceof Lam) {
      return make_substitution(
        expr.left.expr,
        expr.right,
        expr.left.color
      );

    } else {
      const t_l = make_reduction_step(expr.left);
      if (t_l === null) {
        const t_r = make_reduction_step(expr.right);
        if (t_r === null) {
          return null;
        } else {
          return new App(expr.left, t_r);
        }
      } else {
        return new App(t_l, expr.right);
      }
    }
  }

  throw new Error("make_reduction_step: no match");
}

function get_all_colors(expr) {
  if (expr instanceof Var) {
    return [expr.color]; //new Set([1,2,3,1]);
  }

  if (expr instanceof Lam) {
    return [expr.color].concat(get_all_colors(expr.expr));
  }

  if (expr instanceof App) {
    return get_all_colors(expr.left).concat(get_all_colors(expr.right));
  }

  if (expr instanceof Placeholder) {
    return [];
  }

  throw new Error("get_all_colors: no match");
}

function get_colors_for_placeholder(expr, placeholder_in_expr) {
  let list = [];
  let found_placeholder = false;

  function colors(expr, placeholder_in_expr) {
    if (expr instanceof Var) {
      return;
    }

    if (expr instanceof Lam) {
      colors(expr.expr, placeholder_in_expr, list);

      if (found_placeholder) {
        list.push(expr.color);
      }

      return;
    }

    if (expr instanceof App) {
      colors(expr.left, placeholder_in_expr, list);

      if (found_placeholder)
        return;

      colors(expr.right, placeholder_in_expr, list);

      return;
    }

    if (expr instanceof Placeholder) {
      if (expr.id == placeholder_in_expr.id) {
        // placeholder is here!
        found_placeholder = true;
      }

      return;
    }
  }

  colors(expr, placeholder_in_expr);

  return list;
}

module.exports = {
  Expr,
  Var,
  App,
  Lam,
  Placeholder,
  insertIntoPlaceholder,
  changeColorAt,
  make_reduction_step,
  deep_copy,
  get_colors_for_placeholder,
  make_substitution,
  get_all_colors,
  markRedex,
  replaceWithPlaceholder,
}
