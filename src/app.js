const {
    Expr,
    Var,
    App,
    Lam,
    dfs,
} = require('./lambda.js');

const { h, app } = require('hyperapp');
const L = require('partial.lenses');

const MENU = 'menu';
const MAIN = 'main';
const CHAPTERS = 'chapters';
const SCORE = 'score';
const SETTINGS = 'settings';
const chapters = require('./chapters');

const modeSetter = mode => state => L.set('mode', mode, state);

const renderCrocodile = name =>
      h('div', { class: 'croco' }, 'crocodile');

const renderTerm = (binders, term) => {
  if (term instanceof Var) {
    return h('div', { class: 'egg' }, '(egg)');
  }

  if (term instanceof App) {
    // Check if a redex. 'row' = yes
    return h('div', { class: term.expr_left instanceof Lam ? 'row' : 'col' },
             [ renderTerm(binders, term.expr_left),
               renderTerm(binders, term.expr_right)
             ]);
  }

  if (term instanceof Lam) {
    return h('div', { class: 'bind' }, [
      renderCrocodile(term.name),
      renderTerm(binders.concat([term.name]), term.expr)
    ]);
  }
};

const renderSwamp = state => h('div', { id: 'swamp' }, renderTerm([], state.swamp));

document.addEventListener('DOMContentLoaded', () => {
  app({
    init: { mode: MENU,
            chapter: 0,
            swamp: new Lam('x', new App (new Var('x'), new Var('x')))
          },
    view: state => {
      console.log(state);
      if (state.mode == MENU) {
        return h(
          'div', {},
          [ MAIN, CHAPTERS, SCORE, SETTINGS ].map(
            mode => h(
              'div',
              { class: 'container-select',
                id: 'button-' + mode,
                onClick: modeSetter(mode)
              }
            )
          )
        );
      }

      if (state.mode == MAIN) {
        return renderSwamp(state);
      }

      return h('div', {}, ':(');
    },
    node: document.getElementById("app")
  });
});
