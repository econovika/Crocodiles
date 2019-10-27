const {
    Expr,
    Var,
    App,
    Lam,
    dfs,
    test
} = require('./lambda.js');


alert("Hello, world!");



function f(n) {
    if (n == 0 || n == 1) {
        return 1;
    }

    return f(n-1) + f(n-2);
}


for (i = 0; i < 10; ++i) {
    console.log(f(i));
}

console.log(new Expr());

test();