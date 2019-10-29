const colors = ['aqua', 'blue', 'green', 'orange', 'red', 'violet', 'yellow' ];

colors.normalize = n => {
  if (n < 0) {
    n = colors.length - 1;
  }
  n = n % colors.length;
  return n;
};

module.exports = colors;
