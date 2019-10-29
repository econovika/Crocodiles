/* global require setTimeout */

const {
  Expr,
  Var,
  App,
  Lam,
  Placeholder,
  insertIntoPlaceholder,
  changeColorAt,
  reduce,
  copyExpr,
  markRedex,
  replaceWithPlaceholder,
} = require('./lambda.js');

const { h, app } = require('hyperapp');
const { Debounce } = require('hyperapp-fx');
const lens = require('partial.lenses');

const MENU = 'menu';
const MAIN = 'main';
const CHAPTERS = 'chapters';
const chapters = require('./chapters');
const colors = require('./colors');


/* Working with app state. */


/* Deep-copy state object, resetting attributes on the fly.
*/
const copyState = state => {
  const obj = Object.assign({}, state);

  obj.swamp = copyExpr(obj.swamp);
  obj.goal = copyExpr(obj.goal);
  obj.input = copyExpr(obj.input);
  obj.backButtonHidden = false;

  return obj;
};

/* Map `.state` using a given function.

   @param {Function} f - Function to apply to the state
   @param {appstate} appstate - application state
   @returns {appstate}
*/
const overState = f => appstate => {
  return lens.set(
    'history',
    appstate.history.concat(
      [ copyState(appstate.state) ]
    ),
    lens.set('state', f(appstate.state), appstate)
  );
};

/* `overState` variant that does not save the state in history.

   @param {Function} f - Function to apply to the state
   @param {appstate} appstate - application state
   @returns {appstate}
*/
const overStateWithoutHistory = f => appstate => {
  const newState = copyState(appstate.state);
  return lens.set(
    'history',
    appstate.history.concat(
      [ newState ]
    ),
    lens.set('state', f(newState), appstate)
  );
};

/* @param mode - mode tag
   @returns - a new appstate in given mode
*/
const modeSetter = mode =>
      overState(state => lens.set('mode', mode, state));


/* Inserting things into the swamp */

const insertAnything = whatever => placeholder => overState(state => {
  state.swamp = insertIntoPlaceholder(
    placeholder.id,
    state.swamp,
    whatever
  );
  return copyState(state);
});


const insertCrocodile = insertAnything(new Lam(new Placeholder(), 0));
const insertEgg = insertAnything(new Var(0));
const insertPlaceholders = insertAnything(new App (new Placeholder(), new Placeholder()));


/* Modifying swamp contents */

const deleteEntry = id => overState(state => {
  state.swamp = copyExpr(replaceWithPlaceholder(id, state.swamp));
  return Object.assign({}, state);
});

const increment = x => x + 1;
const decrement = x => x - 1;

const changeColor = (id, f = increment) => overState(state => {
  state.swamp = changeColorAt(state.swamp, id, f);
  return state;
});


/* Evalutating */

const forward = overState(state => {
  const newState = copyState(state);
  const new_swamp = reduce(newState.swamp);
  if (new_swamp === null) {
    return state;
  }
  newState.swamp = new_swamp;
  newState.backButtonHidden = false;
  return newState;
});

const previewForward = appstate => {
  const newSwamp = copyExpr(appstate.state.swamp);
  const res = markRedex(newSwamp);
  if (res) {
    appstate.state = Object.assign({}, appstate.state);
    appstate.state.swamp = newSwamp;
    appstate.state.backButtonHidden = true;
  }
  return Object.assign({}, appstate);
};

const debouncedForward = state => {
  return [
    previewForward(state),
    Debounce({
      wait: 1000,
      action: forward
    })
  ];
};

const back = appstate => {
  const last = (appstate.history || []).slice(-1)[0];

  if (typeof last === 'undefined') {
    return appstate;
  } else {
    return {
      state: copyState(last),
      history: appstate.history.slice(0, -1)
    };
  }
};


/* Rendering */

const renderPlaceholder = (placeholder, depth) =>
      h('div', { class: 'placeholder',
               },
        [ h('span', { class: 'insert-crocodile',
                      onClick: insertCrocodile(placeholder)
                    },
            h('span', { class: 'insert-crocodile' }, [
              h('img', {
                src: (
                  'img/crocodiles/' +
                    colors[colors.normalize(depth)] +
                    '_body.svg'
                ),
                class: 'insert-crocodile-img'
              }),
              h('img', {
                src: (
                  'img/crocodiles/' +
                    colors[colors.normalize(depth)] +
                    '_jaws.svg'
                ),
                class: 'insert-crocodile-jaws'
              })
            ])
           ),

          h('span', { class: 'insert-egg',
                      onClick: insertEgg(placeholder)
                    },
            [
              h('img', {
                src: (
                  'img/crocodiles/' +
                    colors[colors.normalize(depth-1)] +
                    '_egg.svg'
                ),
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

const renderTerm = (term, depth = 0) => {

  const mkClassName = cn => {
    // Subfamily that is going to be eaten.
    if (term.eaten) {
      cn += ' eaten';
    }

    // Alligator that is going to eat.
    if (term.attacking && cn != 'crocodile') {
      cn += ' attacking';
    }

    // Eggs that are going to hatch.
    if (term.rotated) {
      cn += ' rotated';
    }

    // Newly hatched subfamilies.
    if (term.fresh) {
      cn += ' fresh';
    }

    return cn;
  };

  /* Render eggs */
  if (term instanceof Var) {
    let color = colors[term.color];

    return h(
      'div',
      { class: mkClassName('egg') }, [
        h('img', { onClick: changeColor(term.id, decrement),
                   class: 'egg-image',
                   src: (
                     'img/crocodiles/' +
                       color + '_' +
                       (term.rotated ? 'egg2' : 'egg') +
                       '.svg'
                   )}),

        h(
          'img',
          { class: 'delete',
            src: 'img/delete_button.svg',
            onClick: deleteEntry(term.id),
          },
        )
      ]);
  }

  /* Render application */
  if (term instanceof App) {
    if (term.left instanceof Lam) {
      return h(
        'div',
        { class: mkClassName('col') },
        [ h(
          'div',
          { },
          renderTerm(term.left, depth),
        ),
          h(
            'div',
            {},
            renderTerm(term.right, depth)
          )
        ]);
    } else {
      const deleter = h(
        'img',
        { class: 'delete',
          onClick: deleteEntry(term.id),
          src: 'img/delete_button.svg',
        },
      );

      return h(
        'div', { class: 'row-container' }, [
          h(
            'table',
            { class: mkClassName('row') }, h('tr', {}, [
              h(
                'td',
                { class: 'left' },
                renderTerm(term.left, depth)
              ),
              h(
                'td',
                { class: 'right' },
                renderTerm(term.right, depth)
              )
            ])
          )].concat(
            (term.left instanceof Placeholder &&
             term.right instanceof Placeholder) ?
              [ deleter ] : []
          ));
    }
  }

  if (term instanceof Lam) {

    const renderCrocodile = (term) => {
      let color = colors[term.color];
      let className = 'croco-container';

      if (term.attacking) {
        className += ' attacking';
      }

      return h(
        'div', { class: className }, [

          h('img', { class: 'croco',
                     onClick: changeColor(term.id),
                     src: 'img/crocodiles/' + color + '_body.svg'
                   }),
          h('img', { class: 'jaw',
                     onClick: changeColor(term.id),
                     src: 'img/crocodiles/' + color + '_jaws.svg'
                   }),
          h(
            'img',
            { class: 'delete',
              src: 'img/delete_button.svg',
              onClick: deleteEntry(term.id),
            },
          )
        ]);
    };

    return h('div', { class: mkClassName('crocodile') }, [
      renderCrocodile(term),
      renderTerm(term.expr, depth + 1)
    ]);
  }

  if (term instanceof Placeholder) {
    return renderPlaceholder(term, depth);
  }

  throw new Error('Not a term');
};


const renderSwamp = state => h('div', { class: 'bg_play', id: 'swamp' },
                               h('div', { id: 'swamp-container' },
                                 renderTerm(state.swamp)));

const selectChapter = ix => overState(state => {
  state.chapter = ix;
  state.swamp = copyExpr(state.chapters[ix].term);
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

/* Initial state */
const initialAppState = {
  state: { mode: MENU,
           chapter: 0,
           chapters: chapters,
           swamp: new Placeholder(),
           backButtonHidden: false,
           input: new Var(0),
           goal: new Var(0),
         },
  history: []
};


// Yes, we really want `window.onload` here.
window.onload = () => {

  const bg = document.querySelector('#alternative-bg');
  bg.style.opacity = 0;
  setTimeout(() => {
    bg.remove();
  }, 4000);

  app({
    // Initial state
    init: initialAppState,

    view: appstate => {
      const state = appstate.state;

      let mainContents = [];

      if (state.mode == MENU) {

        mainContents = h(
          'div', { class: 'bg_menu', id: 'menu-buttons' }, [
            h(
              'div', { class: 'menu-button', id: 'button-container' },
              [ MAIN, CHAPTERS ].map(
                mode => h(
                  'div',
                  { class: 'container-select',
                    id: 'button-' + mode,
                    onClick: modeSetter(mode)
                  }
                )
              )
            ),

            h(
              'div',
              { id: 'description-container' },
              [ 'Inspired by ',
                h(
                  'a', { href: 'http://worrydream.com/AlligatorEggs/',
                         target: '_blank'
                       },
                  'Bret Victor\'s blogpost'),
                '.'
                // TODO: insert authors
              ]
            )
          ]
        );

      } else if (state.mode == MAIN) {
        mainContents = renderSwamp(state);

      } else if (state.mode == CHAPTERS) {
        mainContents = h('div', { class: 'bg_menu' }, [
          h(
            'div', { class: 'chapters' },
            chapters.map(
              (chapter, ix) =>
                h(
                  'div', { class: 'chapter',
                           onClick: selectChapter(ix)
                         }, [
                    h('div', { class: 'chapter-title' }, chapter.title),
                    h('div', { class: 'chapter-description' }, chapter.description),
                  ]
                )
            )
          )
        ]);

      } else {
        mainContents = h('div', { class: 'bg_menu' });
      }

      return h('div', {}, [

        // Add toolbar buttons
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

            state.mode == MAIN && !state.backButtonHidden ? [
              h('div', { class: 'button',
                         id: 'button-back',
                         onClick: back
                       }),
              h('div', { class: 'button',
                         id: 'button-forward',
                         onClick: debouncedForward
                       }),
            ] : []
          )
        ),

        mainContents
      ]);

    },
    node: document.getElementById('app')
  });
};
