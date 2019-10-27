
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
    constructor(expr1, expr2) {
        super();
        this.expr1 = expr1;
        this.expr2 = expr2;
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


function dfs(expr) {
    // console.log(expr instanceof App ? "1" : "0")

    if (expr instanceof Var) {
        return expr.name;
    }

    if (expr instanceof App) {
        return "(" + dfs(expr.expr1) + ")(" + dfs(expr.expr2) + ")";
    }

    if (expr instanceof Lam) {
        return "\\" + expr.name + "." + dfs(expr.expr);
    }
}

function test() {
    console.log(dfs(new App(new Lam("x", new Var("x")), new Var("2"))));

}

module.exports = {
    Expr,
    Var,
    App,
    Lam,
    dfs,
    test
}
