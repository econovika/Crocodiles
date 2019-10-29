const {
  Expr,
  Var,
  App,
  Lam,
  Placeholder,
} = require('./lambda.js');

module.exports = [
  { title: 'Empty',
    description: 'Create a new term',
    term: new Placeholder()
  },

  { title: '(\\x.xx)(\\x.xx)',
    description: 'Reduces to itself',
    term: new App(
      new Lam(new App(new Var(0), new Var(0)), 0),
      new Lam(new App(new Var(1), new Var(1)), 1)
    )
  }
];
