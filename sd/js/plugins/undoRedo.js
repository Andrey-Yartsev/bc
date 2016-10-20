window.addEvent('sdPanelComplete', function() {
  Ngn.sd.btnUndo = new Ngn.Btn(Ngn.sd.fbtn(Locale.get('Sd.undo'), 'undo'), function() {
    if (Ngn.sd.openedPropDialog) {
      Ngn.sd.openedPropDialog.dialog.destroy();
    }
    Ngn.Request.Iface.loading(true);
    new Ngn.Request.JSON({
      url: '/pageBlock/' + Ngn.sd.bannerId + '/json_undo',
      onComplete: function(data) {
        Ngn.Request.Iface.loading(false);
        if (!Ngn.sd.btnRedo.enable) {
          Ngn.sd.btnRedo.toggleDisabled(true);
        }
        var act = data.act;
        delete data.act;
        if (act) {
          if (act == 'add' || act == 'update') {
            if (!Ngn.sd.blocks[data.blockId]) {
              throw new Error('There is no block with id ' + data.blockId + ' on ' + act + ' action');
            }
            var obj = Ngn.sd.blocks[data.blockId];
            if (act == 'add') {
              obj.delete();
              delete obj;
            } else {
              obj.update(data);
              Ngn.sd.interface.bars.layersBar.reinit();
            }
          } else if (act == 'order') {
            Ngn.sd.interface.bars.layersBar.reorder(data.orderKeys);
          } else {
            Ngn.sd.init(Ngn.sd.bannerId);
          }
          if (data.lastItem) {
            Ngn.sd.btnUndo.toggleDisabled(false);
          }
        } else {
          Ngn.sd.btnUndo.toggleDisabled(false);
        }
        Ngn.sd.btnRedo.toggleDisabled(true);
      }
    }).post();
  });
  Ngn.sd.btnUndo.toggleDisabled(false);
});

window.addEvent('sdPanelComplete', function() {
  Ngn.sd.btnRedo = new Ngn.Btn(Ngn.sd.fbtn(Locale.get('Sd.redo'), 'redo'), function() {
    if (Ngn.sd.openedPropDialog) {
      Ngn.sd.openedPropDialog.close();
    }
    Ngn.Request.Iface.loading(true);
    new Ngn.Request.JSON({
      url: '/pageBlock/' + Ngn.sd.bannerId + '/json_redo',
      onComplete: function(data) {
        Ngn.Request.Iface.loading(false);
        if (!Ngn.sd.btnUndo.enable) {
          Ngn.sd.btnUndo.toggleDisabled(true);
        }
        var act = data.act;
        delete data.act;
        if (act) {
          var obj = Ngn.sd.blocks[data.id];
          if (act == 'delete') {
            obj.delete();
            delete obj;
          } else if (act == 'update') {
            obj.update(data, false);
            Ngn.sd.interface.bars.layersBar.reinit();
          } else if (act == 'order') {
            Ngn.sd.interface.bars.layersBar.reorder(data.orderKeys);
          } else if (act == 'settings') {
            Ngn.sd.init(Ngn.sd.bannerId);
          } else {
            // act = create
            Ngn.sd.createBlockDefault(data);
          }
          if (data.lastItem) {
            Ngn.sd.btnRedo.toggleDisabled(false);
          }
        } else {
          Ngn.sd.btnRedo.toggleDisabled(false);
        }
      }
    }).post();
  });
  Ngn.sd.btnRedo.toggleDisabled(false);
});

window.addEvent('sdDataLoaded', function() {
  Ngn.sd.btnUndo.toggleDisabled(Ngn.sd.data.undoExists);
  Ngn.sd.btnRedo.toggleDisabled(Ngn.sd.data.redoExists);
});

window.addEvent('sdBlockSaveComplete', function() {
  Ngn.sd.btnUndo.toggleDisabled(true);
  Ngn.sd.btnRedo.toggleDisabled(false);
});

window.addEvent('sdBlockOrderChanged', function() {
  Ngn.sd.btnUndo.toggleDisabled(true);
  Ngn.sd.btnRedo.toggleDisabled(false);
});
