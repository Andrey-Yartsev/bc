Ngn.sd.BlockBMenu = new Class({
  Extends: Ngn.sd.BlockB,
  init: function() {
    this.parent();
  },
  editDialogOptions: function() {
    var obj = this;
    return {
      width: 250,
      id: 'menu', //footer: false,
      onFormResponse: function() {
        this.form.addEvent('elHDistanceChange', function(value) {
          obj.data.prop.hDistance = value;
          obj.updateContent();
        });
        this.form.addEvent('elHDistanceChanged', function() {
          obj.save();
        });
        this.form.addEvent('elHPaddingChange', function(value) {
          obj.data.prop.hPadding = value;
          obj.updateContent();
        });
        this.form.addEvent('elHPaddingChanged', function() {
          obj.save();
        });
        this.form.addEvent('elVPaddingChange', function(value) {
          obj.data.prop.vPadding = value;
          obj.updateContent();
        });
        this.form.addEvent('elVPaddingChanged', function() {
          obj.save();
        });
        this.form.eForm.getElement('[name=activeBgColor]').addEvent('change', function(color) {
          obj.data.prop.activeBgColor = color.hex;
          obj.updateContent();
          //obj.save();
        });
      }
    };
  },
  updateContent: function() {
    if (!this.data.prop) this.data.prop = {};
    if (this.data.prop.activeBgColor)
      this.el.getElement('.cont').getElement('a.sel').sdSetStyle('background-color', this.data.prop.activeBgColor);
    if (this.data.prop.overBgColor)
      this.el.getElement('.cont').sdSetStyle('background-color', this.data.prop.overBgColor, 'a:hover');
    this.el.getElement('.cont').sdSetStyle('margin-right', this.data.prop.hDistance + 'px', 'a');
    this.el.getElement('.cont').sdSetStyle('padding-left', this.data.prop.hPadding + 'px', 'a');
    this.el.getElement('.cont').sdSetStyle('padding-right', this.data.prop.hPadding + 'px', 'a');
    this.el.getElement('.cont').sdSetStyle('padding-top', this.data.prop.vPadding + 'px', 'a');
    this.el.getElement('.cont').sdSetStyle('padding-bottom', this.data.prop.vPadding + 'px', 'a');
  },
  _updateFont: function() {
    this.parent();
    this.updateLinkSelectedColor();
  },
  updateLinkSelectedColor: function() {
    if (!this.data.font || !this.data.font.linkSelectedColor) return;
    this.styleEl().sdSetStyle('color', this.data.font.linkSelectedColor, 'a.sel');
  }
});
