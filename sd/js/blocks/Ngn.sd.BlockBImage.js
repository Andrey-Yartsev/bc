Ngn.sd.BlockBImage = new Class({
  Extends: Ngn.sd.BlockB,
  replaceContent: function() {
    this.parent();
    var eImg = this.el.getElement('img');
    eImg.set('src', eImg.get('src') /*+ '?' + Math.random(1000)*/);
  },
  initControls: function() {
    this.parent();
    new Ngn.sd.BlockRotate(this);
  },
  resizeContentEl: function(size) {
    this._resizeEl(this.el.getElement('img'), size);
    this.parent(size);
  },
  initFont: function() {
  }
});
