const {
  Expr,
  Var,
  App,
  Lam,
  Placeholder,
  insertIntoPlaceholder,
  dfs,
} = require('./lambda.js');

const { h, app } = require('hyperapp');
const L = require('partial.lenses');
const deepcopy = require('deepcopy');
const MENU = 'menu';
const MAIN = 'main';
const CHAPTERS = 'chapters';
const SCORE = 'score';
const SETTINGS = 'settings';
const chapters = require('./chapters');

const modeSetter = mode => state => L.set('mode', mode, state);

const deleteCrocodile = name => state => {
  const state_ = deepcopy(state);
  return state_;
};

const insertCrocodile = placeholder => state => {
  state.swamp = insertIntoPlaceholder(
    placeholder.id,
    state.swamp,
    new Lam(new Placeholder())
  );
  return Object.assign({}, state);
};

const insertEgg = placeholder => state => {
  state.swamp = insertIntoPlaceholder(
    placeholder.id,
    state.swamp,
    new Var()
  );
  return Object.assign({}, state);
};

// split in two
const insertPlaceholders = placeholder => state => {
  state.swamp = insertIntoPlaceholder(
    placeholder.id,
    state.swamp,
    new App (new Placeholder(), new Placeholder())
  );

  return Object.assign({}, state);
};

const renderPlaceholder = placeholder =>
      h('div', { class: 'placeholder',
               },
        [ h('span', { class: 'insert-crocodile',
                      onClick: insertCrocodile(placeholder)
                    },
            '+cro'
           ),

          h('span', { class: 'insert-egg',
                      onClick: insertEgg(placeholder)
                    },
            '+egg'
           ),

          h('span', { class: 'insert-placeholders',
                      onClick: insertPlaceholders(placeholder)
                    },
            '+2'
           )

        ]
       );

const renderCrocodile = name =>
      h('div', { class: 'croco-container' }, [
        h('img', { class: 'croco', src: 'img/crocodiles/blue_body.svg' }),
        h('img', { class: 'jaw', src: 'img/crocodiles/blue_jaws.svg' }),
        h('div', { class: 'delete', onClick: deleteCrocodile(name) }, 'del')
      ]);

const renderTerm = (binders, term) => {
  if (term instanceof Var) {
    return h('img', { class: 'egg', src: 'img/crocodiles/blue_egg.svg' }, '(egg)');
  }

  if (term instanceof App) {
    // Check if a redex. 'row' = yes
    return h('div', { class: term.left instanceof Lam ? 'row' : 'col' },
             [ renderTerm(binders, term.left),
               renderTerm(binders, term.right)
             ]);
  }

  if (term instanceof Lam) {
    return h('div', { class: 'crocodile' }, [
      renderCrocodile(term),
      renderTerm(binders.concat([term.name]), term.expr)
    ]);
  }

  if (term instanceof Placeholder) {
    return renderPlaceholder(term);
  }

  throw new Error("Not a term");
};

const renderSwamp = state => h('div', { id: 'swamp' }, renderTerm([], state.swamp));

document.addEventListener('DOMContentLoaded', () => {
  app({
    // Startup state
    init: { mode: MENU,
            chapter: 0,
            swamp: new Lam(new App(new Placeholder(), new Var(2)))
            // new Lam(new App (new Var(0),
            //                         new App (new Var(1),
            //                                  new Placeholder())))
          },

    view: state => {
      console.log(state);
      let mainView = [];

      if (state.mode == MENU) {
        mainView = h(
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
        mainView = renderSwamp(state);
      }
      return h('div', {}, [
        h('div', { id: 'toolbar' }, [].concat(
        state.mode == MENU ? [] : [h('div', {class: 'container-select', id: 'button-menu', onClick: modeSetter(MENU)})]
        )
      ),
        mainView
      ]);
    },
    node: document.getElementById("app")
  });
});
