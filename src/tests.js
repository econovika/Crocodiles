const {
    Expr,
    Var,
    App,
    Lam,
    Placeholder,
    insertIntoPlaceholder,
    make_reduction_step,
    deep_copy,
    get_colors_for_placeholder,
    make_substitution,
    get_all_colors,
} = require('./lambda.js');

const {
    get_free_color,
} = require('./colors.js');



function test_1() {
    console.log('test 1:');


    x = new App(new Lam(new Var(0)), new Var("222"));

    console.log(x.toString());

    x = make_reduction_step(x);

    console.log(x.toString());

    console.log('');
}

function test_2() {
    console.log('test 2:');

    x = new App(new Lam(new Lam(new Var(1))), new Var("2"));

    console.log(x.toString());

    x = make_reduction_step(x);

    console.log(x.toString());

    console.log('');
}

function test_3() {
    console.log('test 3:');

    x = new App(new Lam(new Lam(new Var(0))), new Var("2"));

    console.log(x.toString());

    x = make_reduction_step(x);

    console.log(x.toString());

    console.log('');
}

function test_4() {
    console.log('test 4:');

    x = new App(new Lam(new Lam(new Var(1))), new Var("2"));

    console.log(x.toString());

    x = make_reduction_step(x);

    console.log(x.toString());

  console.log('4.z');
  const z = new App(new Lam(new Var(0)),
                    new Lam(new Var(0)));
  console.log(z);
  console.log('MUST BE LAMBDA', make_reduction_step(z));
  console.log(make_reduction_step(new Var(0)));

  console.log('4.z.2');
  const a = new Var(0);
  const b = new Lam(new Var(0));
  console.log('a:', a, 'b:', b);
  console.log('a [0:=b]', make_substitution(a, b, 0));
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

function test_deepcopy() {
    console.log('test_deepcopy:');

    x = new App(new Lam(new Lam(new Var(0))), new Var("2"));

    y = deep_copy(x);

    x.right.ix = 123;

    console.log(x.toString());
    console.log(y.toString());

    console.log('');
}

function test_equals() {
    console.log('test_equals:');

    x = new App(new Lam(new Lam(new Var(0))), new Var("2"));

    y = deep_copy(x);

    console.log(x.equals(x));
    console.log(x.equals(y));
    y.left = new Placeholder();
    console.log(x.equals(y));

    console.log('');
}

function test_colors() {
    console.log('test_list:');

    const ph = new Placeholder();

    expr =
        new App(
            new Lam(
                new Var('_'),
                'NO'
            ),
            new Lam(
                new App(
                    new Lam(
                        new Placeholder(),
                        'NO'
                    ),
                    new Lam(
                        ph,
                        '2222'
                    )
                ),
                    '1111'
            )
        );

    console.log(ph.id);

    console.log(get_colors_for_placeholder(expr, ph, []));

    console.log(expr.toString());

    console.log( new Set(get_all_colors(expr)));

    console.log('');
}

// test_1();
// test_2();
// test_3();
// test_4();
// test_5();
// test_insertIntoPlaceholder();
// test_deepcopy();
// test_equals();
test_colors();


