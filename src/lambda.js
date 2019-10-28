const mkId = require('./id');

class Expr {
    constructor() {
    }
}

class Var extends Expr {
    constructor(name) {
        super();
        this.ix = 0;
    }
    toString () {
        return this.ix;
    }
}

class App extends Expr {
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
    }

    toString() {
        return '(' + this.left.toString() + ' ' + this.right.toString() + ')';
    }
}

class Lam extends Expr {
    constructor(expr) {
        super();
        this.expr = expr;
    }
    toString() {
        return '\\.' + this.expr.toString();
    }
}

class Placeholder extends Expr {
    constructor() {
        super();
        this.id = mkId();
    }
    toString() {
        return '(placeholder ' + this.id + ')';
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

        if (expr.name == var_name) {
            return expr_into;
        }

        return expr;
    }

    if (expr instanceof App) {
        return new App(substitution(expr.expr_left, expr_into, var_name), substitution(expr.expr_right, expr_into, var_name));
    }

    if (expr instanceof Lam) {
        return new Lam(substitution(expr.expr, expr_into, var_name + 1));
    }
}

function make_reduction_step(expr) {
    if (expr instanceof Var) {
        return expr;
    }

    if (expr instanceof Lam) {
        return expr;
    }

    if (expr instanceof App) {
        if (expr.expr_left instanceof App) {
            return make_reduction_step(expr.expr_left);
        }
        if (expr.expr_left instanceof Lam) {
            return substitution(expr.expr_left.expr, expr.expr_right, expr.expr_left.name);
        }
    }
}

function dfs(expr) {
    // console.log(expr instanceof App ? "1" : "0")

    if (expr instanceof Var) {
        return expr.name;
    }

    if (expr instanceof App) {
        return "(" + dfs(expr.expr_left) + ")(" + dfs(expr.expr_right) + ")";
    }

    if (expr instanceof Lam) {
        return "\\_." + dfs(expr.expr);
    }

    if (expr instanceof Placeholder) {
        return "(placeholder " + expr.id + ')';
    }
}

module.exports = {
    Expr,
    Var,
    App,
    Lam,
    Placeholder,
    insertIntoPlaceholder,
    dfs,
    make_reduction_step,
}
