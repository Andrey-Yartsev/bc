Ngn.sd.LayersBar = new Class({
  initialize: function() {
    //console.trace('initializing layers bar');
    this.init();
    Ngn.sd.layersBar = this;
  },
  items: {},
  init: function() {
    Ngn.sd.eLayers.set('html', '');
    var eTitle = new Element('div', {
      html: Locale.get('Sd.layers'),
      'class': 'lTitle'
    }).inject(Ngn.sd.eLayers);
    this.eLayers = new Element('div', {
      'class': 'layers'
    }).inject(Ngn.sd.eLayers);
    new Tips(new Element('span', {
      html: '?',
      title: Locale.get('Sd.layersQuestionMark'),
      'class': 'questionMark'
    }).inject(eTitle));
    this.buildItems();
    if (this.currentActiveId) {
      this.setActive(this.currentActiveId);
    }
    this.initSortables();
  },
  initSortables: function() {
    var obj = this;
    new Sortables(this.eLayers, {
      onStart: function(eMovingLayer) {
        eMovingLayer.addClass('drag');
      },
      onComplete: function(eMovingLayer) {
        eMovingLayer.removeClass('drag');
        var ePrevLayer;
        var id = eMovingLayer.get('data-id');
        ePrevLayer = eMovingLayer.getPrevious();
        if (ePrevLayer) {
          Ngn.sd.blocks[id].el.inject( //
            Ngn.sd.blocks[ePrevLayer.get('data-id')].el, 'before');
        } else {
          ePrevLayer = eMovingLayer.getNext();
          if (ePrevLayer) {
            Ngn.sd.blocks[id].el.inject( //
              Ngn.sd.blocks[ePrevLayer.get('data-id')].el, 'after');
          }
        }
        // request
        var ids = this.serialize(0, function(element) {
          return element.get('data-id');
        });
        Ngn.sd.blocks[id].updateOrderOnDrag(obj.flip(ids));
        new Ngn.Request({
          url: '/pageBlock/' + Ngn.sd.bannerId + '/json_updateOrder'
        }).post({
            ids: ids
          });
      }
    });
  },
  flip: function(trans) {
    var key, arr = {};
    for (key in trans) {
      if (trans.hasOwnProperty(key)) {
        arr[trans[key]] = key;
      }
    }
    return arr;
  },
  buildItems: function() {
    Ngn.sd.sortBySubKey(Ngn.sd.blocks, '_data', 'orderKey').each(function(item) {
      this.items[item._data.id] = new Ngn.sd.LayersBar.Item(this, item);
    }.bind(this));
  },
  getTitle: function(item) {
    if (item.data.subType == 'image') {
      return '<span class="ico 1">' + item._data.html + '</span>' + Ngn.String.ucfirst(item.data.type);
    } else if (item.data.type == 'text') {
      return '<span class="ico 2">' + '<img src="/sd/img/font.png"></span>' + //
      '<span class="text">' + (item._data.html ? item._data.html : 'empty') + '</span>'
    } else {
      return '<span class="ico"></span>unsupported';
    }
  },
  canEdit: function(item) {
    return Ngn.sd.blocks[item._data.id].canEdit();
  },
  setActive: function(blockId) {
    if (this.currentActiveId && blockId != this.currentActiveId) {
      this.items[this.currentActiveId].setActive(false);
    }
    this.items[blockId].setActive(true);
    this.currentActiveId = blockId;
  },
  reorder: function(blockIds) {
    this.updateOrder(blockIds);
    //this.outputOrder();
    this.eLayers.set('html', '');
    this.buildItems();
    this.initSortables();
  },
  reinit: function() {
    this.eLayers.set('html', '');
    this.buildItems();
    this.initSortables();
  },
  updateOrder: function(blockIds) {
    if (!blockIds) throw new Error('blockIds is fucking up');
    console.debug(blockIds);
    this.outputOrder();
    for (var id in blockIds) {
      if (!Ngn.sd.blocks[id]) throw new Error('block id=' + id + ' does not exists');
      Ngn.sd.blocks[id].updateOrder(blockIds[id]);
    }
  },
  outputOrder: function() {
    var s = '';
    for (var i in Ngn.sd.blocks) {
      s += i + ': ' + Ngn.sd.blocks[i]._data.orderKey + '; ';
    }
    console.log(s);
  }
});

Ngn.sd.LayersBar.Item = new Class({
  initialize: function(layersBar, item) {
    this.eItem = new Element('div', {
      'class': 'item ' + 'item_' + (item.data.subType || item.data.type),
      'data-id': item._data.id,
      'data-type': item.data.type,
      events: {
        click: function() {
          Ngn.sd.blocks[item._data.id]._settingsAction(Ngn.sd.blocks[item._data.id]);
        }.bind(this)
      }
    });
    new Element('div', {
      'class': 'title',
      html: layersBar.getTitle(item)
    }).inject(this.eItem);
    var eBtns = new Element('div', {
      'class': 'btns'
    }).inject(this.eItem);
    if (layersBar.canEdit(item)) {
      new Ngn.Btn( //
        Ngn.Btn.btn2('Edit', 'edit').inject(eBtns), //
        Ngn.sd.blocks[item._data.id]._settingsAction.bind(Ngn.sd.blocks[item._data.id]) //
      );
    } else {
      new Element('a', {
        'class': 'smIcons dummy'
      }).inject(eBtns);
    }
    new Ngn.Btn( //
      Ngn.Btn.btn2('Delete', 'delete').inject(eBtns), //
      Ngn.sd.blocks[item._data.id].deleteAction.bind(Ngn.sd.blocks[item._data.id]) //
    );
    this.eItem.inject(layersBar.eLayers);
  },
  setActive: function(isActive) {
    if (isActive) {
      this.eItem.addClass('active');
    } else {
      this.eItem.removeClass('active');
    }
  }
});
