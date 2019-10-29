const {
  Expr,
  Var,
  App,
  Lam,
  Placeholder,
  insertIntoPlaceholder,
  changeColorAt,
  make_reduction_step,
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
const colors = require('./colors');

const overState = f => appstate =>
      L.set(
        'history',
        appstate.history.concat(
          [ deep_copy_state(appstate.state) ]
        ),
        L.set('state', f(appstate.state), appstate)
      );

const modeSetter = mode => overState(state => L.set('mode', mode, state));

const deep_copy_state = state => {

  const obj = {
    mode: state.mode,
    chapter: state.chapter,
    chapters: state.chapters,
    swamp: deep_copy(state.swamp),
    goal: deep_copy(state.goal),
    input: deep_copy(state.input),
  };

  return obj;
};

const deleteCrocodile = name => overState(state => {
  return deep_copy_state(state);
});

const insertCrocodile = placeholder => overState(state => {
  state.swamp = insertIntoPlaceholder(
    placeholder.id,
    state.swamp,
    new Lam(new Placeholder())
  );
  return deep_copy_state(state);
});

const insertEgg = placeholder => overState(state => {
  const newState = deep_copy_state(state);
  newState.swamp = insertIntoPlaceholder(
    placeholder.id,
    state.swamp,
    new Var(0)
  );
  return newState;
});

// split in two
const insertPlaceholders = placeholder => overState(state => {
  state.swamp = insertIntoPlaceholder(
    placeholder.id,
    state.swamp,
    new App (new Placeholder(), new Placeholder())
  );

  return deep_copy_state(state);
});

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

const renderCrocodile = (term) => {
  let color = colors[term.color];
  return h(
    'div', { class: 'croco-container' }, [

      h('img', { class: 'croco',
                 onClick: changeColor(term.id),
                 src: 'img/crocodiles/' + color + '_body.svg'
               }),
      h('img', { class: 'jaw',
                 onClick: changeColor(term.id),
                 src: 'img/crocodiles/' + color + '_jaws.svg'
               }),
        h(
          'div',
          { class: 'delete' },
          ''
        )
      ]);
};

const changeColor = id => overState(state => {
  state.swamp = changeColorAt(state.swamp, id);
  return state;
});

const forward = overState(state => {
  const newState = deep_copy_state(state);
  const new_swamp = make_reduction_step(newState.swamp);
  if (new_swamp === null) {
    return state;
  }
  newState.swamp = new_swamp;
  return newState;
});

const back = appstate => {
  const last = (appstate.history || []).slice(-1)[0];

  if (typeof last === 'undefined') {
    return appstate;
  } else {
    return {
      state: deep_copy_state(last),
      history: appstate.history.slice(0, -1)
    };
  }
};

const renderTerm = (binders, term) => {

  if (term instanceof Var) {
    let color = colors[term.color];
    return h(
      'div',
      { class: 'egg' }, [
        h('img', { class: 'egg',
                   onClick: changeColor(term.id),
                   src: 'img/crocodiles/' + color + '_egg.svg' }),
      ]);
  }

  if (term instanceof App) {
    if (term.left instanceof Lam) {
      return h(
        'div',
        { class: 'col' },
        [ h(
          'div',
          { },
          renderTerm(binders, term.left),
        ),
          h(
            'div',
            {},
            renderTerm(binders, term.right)
          )
        ]);
    } else {
      return h(
        'table',
        { class: 'row' }, h('tr', {}, [
          h(
            'td',
            { class: 'left' },
            renderTerm(binders, term.left)
          ),
          h(
            'td',
            { class: 'right' },
            renderTerm(binders, term.right)
          )
        ])
      );
    }
  }

  if (term instanceof Lam) {
    return h('div', { class: 'crocodile' }, [
      renderCrocodile(term),
      renderTerm(binders.concat([term.name]), term.expr) // wtf is name?
    ]);
  }

  if (term instanceof Placeholder) {
    return renderPlaceholder(term);
  }

  throw new Error('Not a term');
};

const renderSwamp = state => h('div', { class: 'bg_play', id: 'swamp' }, renderTerm([], state.swamp));

const renderScore = state => {
  return h('div', { class: 'bg_play', id: 'swamp' }, []); // <--- SCORE
};

const selectChapter = ix => overState(state => {
  state.chapter = ix;
  state.goal = state.chapters[ix].goal;
  state.input = state.chapters[ix].input;
  state.swamp = new Placeholder();
  state.mode = MAIN;
  return Object.assign({}, state);
});

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
    init: { state: { mode: MENU,
                     chapter: 0,
                     chapters: chapters,
                     swamp: new Placeholder(),
                     input: new Var(0),
                     goal: new Var(0),
                   },
            history: []
          },

    view: appstate => {
      const state = appstate.state;

      let mainView = [];

      if (state.mode == MENU) {

        mainView = h(
          'div', { class: 'bg_menu', id: 'menu-buttons' },
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

      else if (state.mode == MAIN) {
        mainView = renderSwamp(state);
      }
      else {
        mainView = h( 'div', {class: 'bg_menu'})
      }

      if (state.mode == SCORE) {
        mainView = renderScore(state)
      }

      return h('div', {}, [
        h(
          'div',
          { id: 'toolbar'},
          [].concat(
            state.mode == MENU ? [] : [
              h('div', { class: 'container-menu',
                         id: 'button-menu',
                         onClick: modeSetter(MENU)
                       }
               )
            ]
          ).concat(
            state.mode == MAIN ? [
              h('div', { class: 'button',
                         id: 'button-back',
                         onClick: back
                       }),
              h('div', { class: 'button',
                         id: 'button-forward',
                         onClick: forward
                       }),
            ] : []
          )
         ),
        mainView
      ]);

    },
    node: document.getElementById('app')
  });
});
