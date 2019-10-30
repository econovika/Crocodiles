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

function copyExpr(expr) {

  if (expr instanceof Var) {
    return new Var(expr.color);
  }

  if (expr instanceof Lam) {
    return new Lam(copyExpr(expr.expr), expr.color);
  }

  if (expr instanceof App) {
    return new App(copyExpr(expr.left), copyExpr(expr.right));
  }

  if (expr instanceof Placeholder) {
    // No need to move `.fresh` here
    return new Placeholder(expr.id);
  }

  throw new Error("copyExpr: no match");
}

function changeColorAt (expr, id, f) {
  if (expr instanceof Var) {
    if (expr.id == id) {
      expr.color = colors.normalize(f(expr.color));
    }
    return expr;
  }
  if (expr instanceof App) {
    return new App(
      changeColorAt(expr.left, id, f),
      changeColorAt(expr.right, id, f)
    );
  }

  if (expr instanceof Lam) {
    if (expr.id == id) {
      expr.color = colors.normalize(expr.color + 1);
      return expr;
    } else {
      return new Lam(changeColorAt(expr.expr, id, f), expr.color);
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
    return new Placeholder();
  });
};

const insertIntoPlaceholder = (id, expr, target) => {
  return mapAt(id, expr, (ph, depth) => {
    const newExpr = copyExpr(target);

    if (newExpr instanceof Lam) {
      newExpr.color = colors.normalize(depth);
    } else if (newExpr instanceof Var) {
      newExpr.color = colors.normalize(depth - 1);
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
        const res = copyExpr(what);
        res.fresh = true;
        return res;
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
        return copyExpr(expr);
      } else {
        return new Lam(substitution(expr.expr), expr.color);
      }
    }

    if (expr instanceof Placeholder) {
      return expr;
    }

    throw new Error("substitution: no match");
  }


  return substitution(expr);
}

function rotateEggs(expr, colorId) {
  if (expr instanceof Var) {
    if (expr.color == colorId) {
      expr.rotated = true;
    }
  }

  if (expr instanceof Lam) {
    if (expr.color != colorId) {
      rotateEggs(expr.expr, colorId);
    }
  }

  if (expr instanceof App) {
    rotateEggs(expr.left, colorId);
    rotateEggs(expr.right, colorId);
  }
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
      expr.left = copyExpr(expr.left);
      rotateEggs(expr.left.expr, expr.left.color);
      expr.left.attacking = true;
      expr.right = copyExpr(expr.right);
      expr.right.eaten = true;
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

function reduce(expr) {
  if (expr instanceof Var) {
    return null;
  }

  if (expr instanceof Lam) {
    const t = reduce(expr.expr);
    if (t === null) {
      return null;
    } else {
      return new Lam(t, expr.color);
    }
  }

  if (expr instanceof App) {
    if (expr.left instanceof Lam) {
      return make_substitution(
        // TODO: maybe we need another `copyExpr` call here?
        expr.left.expr,
        expr.right,
        expr.left.color
      );

    } else {
      const t_l = reduce(expr.left);
      if (t_l === null) {
        const t_r = reduce(expr.right);
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

  if (expr instanceof Placeholder) {
    return null;
  }

  throw new Error("reduce: no match");
}

// Unused
// TODO: consider removing
function get_all_colors(expr) {
  if (expr instanceof Var) {
    return [ expr.color ];
  }

  if (expr instanceof Lam) {
    return [ expr.color ].concat(get_all_colors(expr.expr));
  }

  if (expr instanceof App) {
    return get_all_colors(expr.left).concat(get_all_colors(expr.right));
  }

  if (expr instanceof Placeholder) {
    return [];
  }

  throw new Error("get_all_colors: no match");
}

// Unused
// TODO: consider removing
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
  reduce,
  copyExpr,
  get_colors_for_placeholder,
  make_substitution,
  get_all_colors,
  markRedex,
  replaceWithPlaceholder,
}
