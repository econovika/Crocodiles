const mkId = require('./id');

class Expr {
    constructor() {
        this.id = mkId();
    }
}

class Var extends Expr {
    constructor(ix, color) {
        super();
        this.ix = ix;
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
    constructor(expr, color) {
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
        return new Var(expr.ix, expr.color);
    }

    if (expr instanceof Lam) {
        return new Lam(deep_copy(expr.expr, expr.color));
    }

    if (expr instanceof App) {
        return new App(deep_copy(expr.left), deep_copy(expr.right));
    }

    if (expr instanceof Placeholder) {
        return new Placeholder(expr.id);
    }
}

function insertIntoPlaceholder (placeholderId, expr, newExpr) {
    if (expr instanceof Var) {
        return expr;
    }

    if (expr instanceof App) {
        expr.left = insertIntoPlaceholder(
            placeholderId,
            expr.left,
            newExpr
        );
        expr.right = insertIntoPlaceholder(
            placeholderId,
            expr.right,
            newExpr
        );
        return expr;
    }

    if (expr instanceof Lam) {
        expr.expr = insertIntoPlaceholder(
            placeholderId, expr.expr, newExpr
        );
        return expr;
    }

    if (expr instanceof Placeholder) {
        if (placeholderId == expr.id)
            return newExpr;
        else
            return expr;
    }
    throw new Error("Incorrect term");
}

function substitution(expr, expr_into, var_name) {
    if (expr instanceof Var) {

        if (expr.ix == var_name) {
            return expr_into;
        }

        return expr;
    }

    if (expr instanceof App) {
      return new App(
        substitution(expr.left, expr_into, var_name),
        substitution(expr.right, expr_into, var_name)
      );
    }

    if (expr instanceof Lam) {
        return new Lam(substitution(expr.expr, expr_into, var_name + 1));
    }
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
      return new Lam(t);
    }
  }

  if (expr instanceof App) {
    if (expr.left instanceof Lam) {
      return substitution(
        expr.left,
        expr.right,
        expr.left.ix
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
};

function get_list_variables(expr, placeholder_in_expr, list) {
    if (expr instanceof Var) {
        return null;
    }

    if (expr instanceof Lam) {
        list.push(expr.id);
        return get_list_variables(expr.expr, placeholder_in_expr, list)
    }

    if (expr instanceof App) {
        res = get_list_variables(expr.left, placeholder_in_expr, list);
        if (res !== null)
            return res;
        
        res = get_list_variables(expr.right, placeholder_in_expr, list);
        if (res !== null)
            return res;

        return null;
    }

    if (expr instanceof Placeholder) {
        if (expr.id == placeholder_in_expr.id) {
            return list;
        }
    }
}

module.exports = {
    Expr,
    Var,
    App,
    Lam,
    Placeholder,
    insertIntoPlaceholder,
    make_reduction_step,
    deep_copy,
    get_list_variables,
    substitution
}
