const {
    get_free_color,
    free_color,
} = require('./colors.js');


function test_1() {
    x1 = get_free_color()
    x2 = get_free_color()
    x3 = get_free_color()


    free_color(x1)
    get_free_color()

    // console.log(y1)
    console.log(x1)
    console.log(x2)
    console.log(x3)
}


test_1();
