const {
    Expr,
    Var,
    App,
    Lam,
    dfs,
    make_reduction_step
} = require('./lambda.js');



function test_1() {
    x = new App(new Lam("x", new Var("x")), new Var("2"));

    console.log(dfs(x));

    x = make_reduction_step(x);

    console.log(dfs(x));
}

function test_2() {
    x = new App(new Lam("x", new Lam("y", new Var("x"))), new Var("2"));

    console.log(dfs(x));

    x = make_reduction_step(x);

    console.log(dfs(x));
}

function test_3() {
    x = new App(new Lam("x", new Lam("y", new Var("y"))), new Var("2"));

    console.log(dfs(x));

    x = make_reduction_step(x);

    console.log(dfs(x));
}

function test_4() {
    x = new App(new Lam("x", new Lam("y", new Var("y"))), new Var("2"));

    console.log(dfs(x));

    x = make_reduction_step(x);

    console.log(dfs(x));
}

test_1();
test_2();
test_3();
test_4();
