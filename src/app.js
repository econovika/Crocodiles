const {
  Expr,
  Var,
  App,
  Lam,
  Placeholder,
  insertIntoPlaceholder,
  deep_copy,
} = require('./lambda.js');

const { h, app } = require('hyperapp');
const L = require('partial.lenses');
// const deepcopy = require('deepcopy'); // do not use it!
const MENU = 'menu';
const MAIN = 'main';
const CHAPTERS = 'chapters';
const SCORE = 'score';
const SETTINGS = 'settings';
const chapters = require('./chapters');

const modeSetter = mode => state => L.set('mode', mode, state);

const deep_copy_state = state => {
  return {
    mode: state.mode,
    chapter: state.chapter,
    chapters: state.chapters,
    swamp: deep_copy(state.swamp),
    goal: deep_copy(state.goal),
    input: deep_copy(state.input),
  }
}

const deleteCrocodile = name => state => {
  const state_ = deep_copy_state(state);
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
            h('span', { class: 'insert-crocodile' }, [
              h('img', {
                src: 'img/crocodiles/green_body.svg',
                class: 'insert-crocodile-img'
              })
            ])
           ),

          h('span', { class: 'insert-egg',
                      onClick: insertEgg(placeholder)
                    },
            [
              h('img', {
                src: 'img/crocodiles/green_egg.svg',
                class: 'insert-egg-img'
              })
            ]
           ),

          h('span', { class: 'insert-placeholders',
                      onClick: insertPlaceholders(placeholder)
                    },
            [ h('div', { class: 'insert-placeholders-preview' }),
            ]
           )

        ]
       );

const renderCrocodile = name =>
      h('div', { class: 'croco-container' }, [
        h('img', { class: 'croco', src: 'img/crocodiles/blue_body.svg' }),
        h('img', { class: 'jaw', src: 'img/crocodiles/blue_jaws.svg' }),
        h(
          'div',
          { class: 'delete', onClick: deleteCrocodile(name) },
          ''
        )
      ]);

const changeEggColor = state => {
  return state;
};

const changeCrocodileColor = state => {
  return state;
};

const copyState = state => {
  const newState = Object.assign({}, state);
  // TODO: replace
  // newState.swamp = deepcopy(state.swamp);
  return newState;
};

const renderTerm = (binders, term) => {

  if (term instanceof Var) {
    return h(
      'div',
      { class: 'egg' }, [
        h('img', { class: 'egg',
                   onClick: changeEggColor,
                   src: 'img/crocodiles/blue_egg.svg' }),
      ]);
  }

  if (term instanceof App) {
    if (term.left instanceof Lam) {
      return h(
        'div',
        { class: 'row' },
        [ renderTerm(binders, term.left),
          renderTerm(binders, term.right)
        ]);
    } else {
      return h(
        'div',
        { class: 'row' }, [
          h(
            'div',
            { class: 'left' },
            renderTerm(binders, term.left)
          ),
          h(
            'div',
            { class: 'right' },
            renderTerm(binders, term.right)
          )
        ]
      );
    }
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

  throw new Error('Not a term');
};

const renderSwamp = state => h('div', { id: 'swamp' }, renderTerm([], state.swamp));

const selectChapter = ix => state => {
  state.chapter = ix;
  console.log(state);
  state.goal = state.chapters[ix].goal;
  state.input = state.chapters[ix].input;
  state.swamp = new Placeholder();
  state.mode = MAIN;
  return Object.assign({}, state);
};

const renderChapters = state => h(
  'div', { class: 'chapters' },
  state.chapters.map(
    ({ title, goal, input }, ix) =>
      h('div', { class: 'chapter-select',
                 onClick: selectChapter(ix)}, title)
  )
);

document.addEventListener('DOMContentLoaded', () => {
  app({
    // Startup state
    init: { mode: MENU,
            chapter: 0,
            chapters: chapters,
            swamp: new Placeholder()
            // new Lam(new App (new Var(0),
            //                         new App (new Var(1),
            //                                  new Placeholder())))
          },

    view: state => {
      console.log(state);
      let mainView = [];

      if (state.mode == MENU) {
        mainView = h(
          'div', { id: 'menu-buttons' },
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
        h(
          'div',
          { id: 'toolbar' },
          [].concat(
            state.mode == MENU ? [] : [
              h('div', {class: 'container-menu', id: 'button-menu', onClick: modeSetter(MENU)})
            ]
          )
         ),
        mainView
      ]);

    },
    node: document.getElementById('app')
  });
});
