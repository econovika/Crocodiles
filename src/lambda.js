
class Expr {
    constructor() {

    }
}

class Var extends Expr {
    constructor(name) {
        super();
        this.name = name;
    }
}

class App extends Expr {
    //Expr expr1, expr2;
    constructor(expr_left, expr_right) {
        super();
        this.expr_left = expr_left;
        this.expr_right = expr_right;
    }
}

class Lam extends Expr {
    constructor(name, expr) {
        super();
        this.name = name;
        this.expr = expr;
    }
}

//data Expr = Var Symb
// | Expr :@ Expr
// | Lam Symb Expr

// beta-reduction

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
        return new Lam(expr.name, substitution(expr.expr, expr_into, var_name));
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
            return reduction_step(expr.expr_left);
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
        return "\\" + expr.name + "." + dfs(expr.expr);
    }
}


module.exports = {
    Expr,
    Var,
    App,
    Lam,
    dfs,
    make_reduction_step,
}
