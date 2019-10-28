const {
    Expr,
    Var,
    App,
    Lam,
    Placeholder,
    insertIntoPlaceholder,
    dfs,
    make_reduction_step
} = require('./lambda.js');


function test_1() {
    console.log('test 1:');


    x = new App(new Lam(new Var(0)), new Var("222"));

    console.log(dfs(x));
    console.log(x.toString());


    x = make_reduction_step(x);

    console.log(dfs(x));

    console.log('');
}

function test_2() {
    console.log('test 2:');

    x = new App(new Lam(new Lam(new Var(1))), new Var("2"));

    console.log(dfs(x));
    //console.log(x.toString());

    x = make_reduction_step(x);

    console.log(dfs(x));

    console.log('');
}

function test_3() {
    console.log('test 3:');

    x = new App(new Lam(new Lam(new Var(0))), new Var("2"));

    console.log(dfs(x));
    //console.log(x.toString());

    x = make_reduction_step(x);

    console.log(dfs(x));

    console.log('');
}

function test_4() {
    console.log('test 4:');

    x = new App(new Lam(new Lam(new Var(1))), new Var("2"));

    console.log(dfs(x));
    //console.log(x.toString());

    x = make_reduction_step(x);

    console.log(dfs(x));

    console.log('');
}

function test_5() {
    console.log('test 5:');

    x = new App(new Placeholder(), new Placeholder());

    console.log(x.toString());

    console.log('');
}

function test_insertIntoPlaceholder () {
    console.log('test insertIntoPlaceholder:');

    const ph = new Placeholder();
    const x = new App(new Lam(new Lam(ph)), new Placeholder());

    console.log(x.toString());
    const y = insertIntoPlaceholder(ph.id, x, new Var(3));

    console.log(y.toString());


    console.log('');
}

test_1();
test_2();
test_3();
test_4();
test_5();
test_insertIntoPlaceholder();
