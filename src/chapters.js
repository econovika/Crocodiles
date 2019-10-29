const {
  Expr,
  Var,
  App,
  Lam,
  Placeholder,
  deep_copy,
} = require('./lambda.js');

const S = new Lam(new Lam(new Lam(
  new App(
    new App (new Var(0), new Var(2)),
    new App (new Var(1), new Var(2))
  ), 2 /* x */), 1 /* g */), 0 /* f */);

const K = new Lam(new Lam(new Var(4), 6), 4);

const plus =
      new Lam(
        new Lam(
          new Lam(
            new Lam(
              new App(
                new App(new Var(1), new Var(2)),
                new App(
                  new App(
                    new Var(0),
                    new Var(2)
                  ),
                  new Var(3)
                )
              ),
              3),
            2),
          1),
        0);

module.exports = [
  { title: 'Empty',
    description: 'Create a new term',
    term: new Placeholder()
  },

  { title: '(\\x.xx)(\\x.xx)',
    description: 'Reduces to itself',
    term: new App(
      new Lam(new App(new Var(0), new Var(0)), 0),
      new Lam(new App(new Var(3), new Var(3)), 3)
    )
  },


  { title: '0 + 0 = 0',
    description: '',
    term:
      new App(
        new App(
          deep_copy(plus),
          deep_copy(K)
        ),
        deep_copy(K)
      )
  },

  { title: 'SKK',
    description: 'Show that SKK = I',
    term: new App(new App(deep_copy(S), deep_copy(K)), deep_copy(K))
  }

];
