const {
    Expr,
    Var,
    App,
    Lam,
    dfs,
} = require('./lambda.js');

module.exports = [
  { title: 'Title 1',
    goal: new Lam('x', new Var('x')),
    input: new Lam('x', new  Var('x')),
  }
];
