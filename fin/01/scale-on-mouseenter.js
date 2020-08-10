AFRAME.registerComponent('scale-on-mouseenter', {
  schema: {
    to: {default: '2.5 2.5 2.5'},
    leave: {default: '1 1 1'}
  },
  init: function () {
    var data = this.data;
    this.el.addEventListener('mouseenter', function () {
      this.setAttribute('scale', data.to);
    });
    this.el.addEventListener('mouseleave', function () {
      this.setAttribute('scale', data.leave);
    });
  }
});