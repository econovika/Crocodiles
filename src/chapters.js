const {
    Expr,
    Var,
    App,
    Lam,
    dfs,
} = require('./lambda.js');

module.exports = [
  { title: 'Title 1',
    goal: new Lam(new Var(0)),
    input: new Lam(new  Var(0)),
  }
];
