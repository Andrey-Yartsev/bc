Ngn.sd.blockTypes.push({
  title: 'Font',
  data: {
    type: 'text'
  }
});

Ngn.sd.BlockBText = new Class({
  Extends: Ngn.sd.BlockBFont
});

window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn(Locale.get('Sd.addText'), 'text'), function() {
    var data = Ngn.sd.getBlockType('text');
    data.data.position = {
      x: 0,
      y: 0
    };
    Ngn.sd.block(Ngn.sd.elBlock().inject(Ngn.sd.eLayoutContent), {
      data: data.data,
      html: ''
    }).setToTheTop().save(true);
  });
});