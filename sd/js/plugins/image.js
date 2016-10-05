window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Add image', 'image'), null, {
    fileUpload: {
      url: '/pageBlock/' + Ngn.sd.bannerId + '/json_createImage',
      onRequest: function() {
        Ngn.Request.Iface.loading(true);
      }.bind(this),
      onComplete: function(v) {
        Ngn.sd.block(Ngn.sd.elBlock().inject(Ngn.sd.eLayoutContent), v);
        Ngn.Request.Iface.loading(false);
      }.bind(this)
    }
  });
});