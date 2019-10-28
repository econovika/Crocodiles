const mkId = require('./id');

class Expr {
    constructor() {
    }
}

class Var extends Expr {
    constructor(ix) {
        super();
        this.ix = ix;
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
        return '(' + this.left.toString() + ') (' + this.right.toString() + ')';
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

function deep_copy(expr) {
    if (expr instanceof Var) {
        return new Var(expr.ix);
    }

    if (expr instanceof Lam) {
        return new Lam(deep_copy(expr.expr));
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
        return new App(substitution(expr.left, expr_into, var_name), substitution(expr.right, expr_into, var_name));
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
        if (expr.left instanceof App) {
            return make_reduction_step(expr.left);
        }
        if (expr.left instanceof Lam) {
            return substitution(expr.left.expr, expr.right, expr.left.ix);
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
    deep_copy
}
