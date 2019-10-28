const colors = ['red', 'blue', 'green', 'orange', 'violet', 'yellow', 'greeen']

free_colors = []

const get_free_color = () => {
    if (free_colors.length == 0) {
        throw new Error()
    }

    return free_colors.pop();
};

const free_color = (color) => {
    if (free_colors.find((clr) => clr == color) === null) {
        free_colors.push(color);
    }
};

const free_all_colors = () => {
    free_colors = []
    for (let i = 0; i < colors.length; ++i) {
        free_colors.push(colors[i])
    }
};


// init
free_all_colors();



module.exports = {
    get_free_color,
    free_color,
}