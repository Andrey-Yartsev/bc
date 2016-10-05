Ngn.sd.BlockBFont = new Class({
  Extends: Ngn.sd.BlockB,
  settingsDialogOptions: function() {
    return {
      width: 350,
      onChangeFont: function(font) {
        if (!this.data.font) this.data.font = {};
        this.data.font.fontFamily = font;
        this.updateCufon();
      }.bind(this),
      onChangeSize: function(size) {
        if (!this.data.font) this.data.font = {};
        this.data.font.fontSize = size;
        this.updateCufon();
      }.bind(this),
      onChangeColor: function(color) {
        if (!this.data.font) this.data.font = {};
        this.data.font.color = color;
        this.updateCufon();
      }.bind(this),
      onCancelClose: function() {
        if (this.data.font) {
          this.resetData();
          this.updateCufon();
        } else {
          this.styleEl().set('html', this.data.html);
        }
      }.bind(this)
    };
  },
  directChangeFontStyleProps: function() {
    return ['font-size', 'font-family', 'color'];
  },
  updateFont: function() {
  },
  updateCufon: function() {
    this._updateFont();
    Ngn.sd.BlockBFont.html[this.id()] = this.data.html;
    this.loadFont(function() {
      Cufon.set('fontFamily', this.data.font.fontFamily); // Так-то куфон подхватывает шрифт из стилей, но где-то в другом месте (в диалоге, например) он может быть определен через set(). Так что нужно переопределять и тут
      var cufonProps = {};
      if (this.data.font.shadow) {
        cufonProps = {
          textShadow: '1px 1px rgba(0, 0, 0, 0.8)'
        };
      }
      Cufon.replace(this.styleEl(), cufonProps);
      Ngn.Request.Iface.loading(false);
      this.phantomCufonLoaded();
    }.bind(this));
  },
  phantomCufonLoaded: function() {
    //console.debug('callPhantom: cufonLoaded');
    if (typeof window.callPhantom === 'function') {
      window.callPhantom({
        action: 'cufonLoaded'
      });
    }
  },
  loadFont: function(onLoad) {
    if (!this.data.font || !this.data.font.fontFamily) return;
    Ngn.Request.Iface.loading(true);
    Ngn.sd.loadFont(this.data.font.fontFamily, onLoad);
  },
  replaceContent: function() {
    this.parent();
    this.updateCufon();
  },
  initControls: function() {
    this.parent();
    new Ngn.sd.BlockRotate(this);
  },
  framesCount: function() {
    return 2;
  }
});

Ngn.sd.BlockBFont.html = {};
