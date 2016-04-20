// from common

if (!Ngn.sd) Ngn.sd = {};

Ngn.blink = function(el, duration) {
  if (!duration) duration = 1000;
  var element = $(el);
  var on = true;
  (function() {
    element.setStyle('visibility', on ? 'hidden' : 'visible');
    on = !on;
  }).periodical(duration);
};

Ngn.sd.positionDiff = function(pos1, pos2, offset) {
  if (!offset) offset = 0;
  return {
    x: pos1.x - pos2.x + offset,
    y: pos1.y - pos2.y + offset
  }
};

Ngn.sd.loadedFonts = {};
Ngn.sd.loadFont = function(font, onLoad) {
  if (!font) return;
  if (Ngn.sd.loadedFonts[font]) {
    onLoad();
    return;
  }
  Asset.javascript((Ngn.sd.baseUrl || '') + '/sd/js/fonts/' + font + '.js', {
    onLoad: function() {
      Ngn.sd.loadedFonts[font] = true;
      onLoad();
    }
  });
};

Ngn.sd.initFullBodyHeight = function() {
  return;
  var isFullHeight = null;
  var fullBodyHeight = function() {
    if (window.getScrollSize().y > window.getSize().y) {
      if (isFullHeight === true || isFullHeight === null) document.getElement('body').setStyle('height', '');
    } else {
      if (isFullHeight === false || isFullHeight === null) document.getElement('body').setStyle('height', '100%');
    }
  };
  window.addEvent('domready', fullBodyHeight);
  window.addEvent('resize', fullBodyHeight);
};

// --

Ngn.sd.setMinHeight = function(parent, offset, min) {
  if (!offset) offset = 0;
  if (!min) min = 0;
  var max = 0;
  parent.getChildren().each(function(el) {
    var y = el.getSize().y + parseInt(el.getStyle('top'));
    if (y > max) max = y + offset;
  });
  if (max) {
    if (max < min) max = min;
    parent.sdSetStyle('min-height', max);
  }
};

Ngn.sd.Font = new Class({

  directChangeFontStyleProps: function() {
    return [];
  },

  _updateFont: function(forceDirectChange) {
    if (!this.data.font) return;
    if (!this.data.font.fontSize) this.data.font.fontSize = '24px';
    var s = ['font-size', 'font-family', 'color'], prop;
    for (var i = 0; i < s.length; i++) this.styleEl().sdSetStyle(s[i], '');
    for (i in this.data.font) {
      prop = i.hyphenate();
      if (forceDirectChange || Ngn.Arr.inn(prop, this.directChangeFontStyleProps())) {
        this.styleEl().setStyle(prop, this.data.font[i]);
      }
      if (Ngn.Arr.inn(prop, s)) this.styleEl().sdSetStyle(prop, this.data.font[i]);
    }
    this.updateBtnFontSettings();
  },

  updateBtnFontSettings: function() {
    if (!this.btnFontSettings) return;
    if (this.data.font.color) this.btnFontSettings.el.setStyle('background-color', this.data.font.color); else {
      if (this.btnFontSettings.el.getStyle('background-color')) {
        this.btnFontSettings.el.setStyle('background-color', '');
      }
    }
  },

  defaultFontColor: function() {
    return this.data.font.color || false;
  },

  linkColor: function() {
    if (!this.data.font) return false;
    return this.data.font.linkColor || this.data.font.color || false;
  },

  linkOverColor: function() {
    if (!this.data.font) return false;
    return this.data.font.linkOverColor || false;
  },

  fontSettingsAction: 'json_fontSettings',

  fontSettingsDialogOptions: function() {
    return {
      width: 420
    };
  },

  initFont: function() {
    if (!this.data.font) this.data.font = {};
    this.initFontBtn();
    this.updateFont();
  },

  _fontSettingsAction: function() {
    if (Ngn.sd.openedPropDialog) Ngn.sd.openedPropDialog.close();
    Ngn.sd.openedPropDialog = new Ngn.sd.FontSettingsDialog(Object.merge({
      onClose: function() {
        Ngn.sd.openedPropDialog = false;
      },
      dialogClass: 'settingsDialog compactFields dialog',
      id: this.finalData().data.type + this.id(),
      baseZIndex: 210,
      force: false,
      url: this.ctrl + '/' + this.fontSettingsAction + '/' + this.id(),
      onSubmitSuccess: function() {
        this.reload();
      }.bind(this),
      onChangeFont: function(fontFamily) {
        this.data.font.fontFamily = fontFamily;
        this._updateFont(true);
      }.bind(this),
      onChangeColor: function(color) {
        this.data.font.color = color;
        this._updateFont(true);
      }.bind(this),
      onChangeSize: function(fontSize) {
        this.data.font.fontSize = fontSize;
        this._updateFont(true);
      }.bind(this)
      //onChangeShadow: function(shadow) {
      //  this.data.font.shadow = shadow;
      //  this._updateFont(true);
      //}.bind(this)
    }, this.fontSettingsDialogOptions()));
  },

  initFontBtn: function() {
    if (!this.eBtns) return;
    this.btnFontSettings = new Ngn.Btn( //
      Ngn.Btn.btn2('Font Settings', 'font').inject(this.eBtns), //
      this._fontSettingsAction.bind(this) //
    );
  },

  styleEl: function() {
    return this.el;
  }

});

Ngn.sd.FontSettingsDialog = new Class({
  Extends: Ngn.Dialog.RequestForm,

  options: {
    useFx: false
  },

  formInit: function() {
    var obj = this;
    var el = this.message.getElement('[name=fontFamily]');
    if (el) {
      el.addEvent('change', function() {
        obj.fireEvent('changeFont', this.get('value'));
      });
    }
    this.message.getElement('[name=fontSize]').addEvent('change', function() {
      obj.fireEvent('changeSize', this.get('value'));
    });
    this.message.getElement('[name=color]').addEvent('change', function() {
      obj.fireEvent('changeColor', this.get('value'));
    });
    //this.message.getElement('[name=shadow]').addEvent('change', function() {
    //  obj.fireEvent('changeShadow', this.get('value'));
    //});
  }

});

Ngn.sd.Items = new Class({

  reload: function() {
    this.loading(true);
    new Ngn.Request.JSON({
      url: this.ctrl + '/json_getItem/' + this.id() + '?ownPageId=' + Ngn.sd.ownPageId,
      onComplete: function(data) {
        this.setData(data);
        this.updateElement();
        this.loading(false);
      }.bind(this)
    }).send();
  },
  id: function() {
    return this.data.id;
  },
  setData: function(data) {
    this.data = data;
  },
  loading: function(flag) {
    Ngn.Request.Iface.loading(flag);
  },
  updateElement: function() {
  }

});

Ngn.sd.ElementMeta = new Class({
  initElement: function(el) {
    this.el = el;
    if (!this.id()) return;
    if (!this.finalData().data.type) throw new Error('this.finalData().data.type');
    this.el.addClass('sdEl').store('obj', this).set('data-id', this.id()).set('data-type', this.finalData().data.type).addClass('type_' + this.finalData().data.type).addClass('id_' + this.id());
  }
});

Ngn.sd.styles = {};

Ngn.sd.buildStyles = function() {
  var r = {};
  for (var selector in Ngn.sd.styles) {
    var styles = Ngn.sd.styles[selector];
    if (!r[selector]) r[selector] = [];
    for (var property in styles) r[selector].push([property.hyphenate(), styles[property]]);
  }
  var css = '';
  for (var selector in r) {
    css += selector + ' {\n';
    for (var i = 0; i < r[selector].length; i++) {
      css += r[selector][i][0] + ': ' + r[selector][i][1] + ';\n';
    }
    css += '}\n';
  }
  return css;
};

Ngn.sd.directChangeStyleProperies = '(width|height|left|top|margin|padding)';
Ngn.sd.directChangeStyleValues = 'rotate';

Element.implement({
  sdSetStyle: function(property, value, subSelector) {
    if (property == 'opacity') {
      this.setOpacity(this, parseFloat(value));
      return this;
    }
    property = (property == 'float' ? floatName : property).camelCase();
    if (typeOf(value) != 'string') {
      //var map = (Element.Styles[property] || '@').split(' ');
      //value = Array.from(value).map(function(val, i) {
      //  if (!map[i]) return '';
      //  return (typeOf(val) == 'number') ? map[i].replace('@', Math.round(val)) : val;
      //}).join(' ');
    } else if (value == String(Number(value))) {
      value = Math.round(value);
    }
    var selector;
    var cls = this.get('class');
    if (cls) cls = cls.replace(/\s*dynamicStyles\s*/, '');

    if (this.hasClass('sdEl')) {
      if (subSelector) throw new Error('U can not use subSelector on .sdEl');
      selector = '.' + cls.replace(/(\s+)/g, '.');
    } else {
      var eParent = this.getParent('.sdEl');
      if (eParent) var pCls = this.getParent('.sdEl').get('class').replace(/\s*dynamicStyles\s*/, '');
      selector = (pCls ? '.' + pCls.replace(/(\s+)/g, '.') : '');
      if (subSelector) {
        selector += (cls ? ' .' + cls : '') + ' ' + subSelector;
      } else {
        selector += ' ' + (cls ? '.' + cls : this.get('tag'));
      }
    }
    if (!value) return;
    if (!subSelector && (property.test(new RegExp(Ngn.sd.directChangeStyleProperies, 'i')) || value.test(new RegExp(Ngn.sd.directChangeStyleValues, 'i')))) {
      if (!this.hasClass('dynamicStyles')) this.addClass('dynamicStyles');
      this.setStyle(property, value);
    }
    Ngn.sd.addStyle(selector, property, value);
  },
  sdSetPosition: function(position) {
    return this.sdSetStyles(this.computePosition(position));
  },
  sdSetStyles: function(styles) {
    for (var style in styles) this.sdSetStyle(style, styles[style]);
  }
});

Ngn.sd.addStyle = function(selector, property, value) {
  if (!Ngn.sd.styles[selector]) Ngn.sd.styles[selector] = {};
  Ngn.sd.styles[selector][property] = value;
  Ngn.sd.updateCommonStyle();
};

Ngn.sd.updateCommonStyle = function() {
  if (Ngn.sd.commonStyleGenId) clearTimeout(Ngn.sd.commonStyleGenId);
  Ngn.sd.commonStyleGenId = (function() {
    if ($('commonStyles')) $('commonStyles').dispose();
    new Element('style', {
      id: 'commonStyles',
      type: 'text/css',
      html: Ngn.sd.buildStyles()
    }).inject($('layout'), 'top');
  }).delay(300);
};

Ngn.sd.BlockAbstract = new Class({
  Implements: [Options, Ngn.sd.ElementMeta, Ngn.sd.Items],
  defaultData: false,
  finalData: function() {
    return this.defaultData ? Object.merge(this.defaultData, this._data) : this._data;
  },
  setData: function(data) {
    if (!data) throw new Error('empty data');
    this._data = this.defaultData ? Object.merge(this.defaultData(), data) : data;
    this.data = data.data;
  },
  id: function() {
    return this._data.id;
  },
  initialize: function(el, data, event, options) {
    this.setData(data);
    this.initElement(el);
    this.addCont(this.el);
    this.event = event;
    this.setOptions(options);
    this.ctrl = '/pageBlock/' + Ngn.sd.bannerId;
    this.init();
  },
  delete: function() {
    this.el.dispose();
  },
  addCont: function(el) {
    new Element('div', {'class': 'cont'}).inject(el);
  },
  updateContainerHeight: function() {
    Ngn.sd.updateContainerHeight(this.container());
  },
  updateFont: function() {
    this._updateFont();
  },
  updateElement: function() {
    this.updateFont();
    this.updateContainerHeight();
    this.el.set('data-id', this.id());
    this.replaceContent();
    this.updateContent();
    this.updateSize();
    Ngn.sd.initLayersPanel();
    window.fireEvent('resize');
  },
  eLastContainer: false,
  _container: function() {
    return this.el.getParent();
  },
  container: function() {
    var eContainer = this._container();
    if (!eContainer && this.eLastContainer) return this.eLastContainer;
    //if (!eContainer.hasClass('container')) throw new Error('Block has no container');
    return this.eLastContainer = eContainer;
  },
  inject: function(eContainer) {
    this.setPosition(Ngn.sd.positionDiff(this.el.getPosition(), eContainer.getPosition(), -1));
    if (!this._container() || this._container() != eContainer) {
      this.el.inject(eContainer);
    }
    return this;
  },
  setPosition: function(position) {
    if (!this.data.position) this.data.position = {};
    this.data.position = Object.merge(this.data.position, position);
    this.el.sdSetPosition(this.data.position);
  },
  getDataForSave: function(create) {
    this.data = Object.merge(this.data, {
      ownPageId: Ngn.sd.ownPageId
    });
    this.loading(true);
    // this._data.data - исходные изменяемые данные
    // this.data - текущие несохраненные данные
    if (create) {
      this._data.data = Object.merge(this._data.data, this.data);
      var p = {data: this._data};
      delete p.data.html;
    } else {
      var p = {
        id: this._data.id,
        content: this._data.content,
        data: this.data
      };
    }
    return p;
  },
  save: function(create) {
    new Ngn.Request.JSON({
      url: this.ctrl + '/json_' + (create ? 'create' : 'update') + '?ownPageId=' + Ngn.sd.ownPageId,
      onComplete: function(data) {
        this.setData(data);
        if (create) {
          Ngn.sd.blocks[this._data.id] = this;
          this.initElement(this.el);
        }
        this.updateElement();
        this.creationEvent();
        this.loading(false);
      }.bind(this)
    }).post(this.getDataForSave(create));
  },
  creationEvent: function() {
    Ngn.sd.initLayersPanel();
  },
  replaceContent: function() {
    if (!this._data.html) return;
    this.el.getElement('.cont').set('html', this._data.html);
    this.el.getElement('.cont').getElements('a').addEvent('click', function(e) {
      e.preventDefault()
    });
  }
});

Ngn.sd.BlockPreview = new Class({
  Extends: Ngn.sd.BlockAbstract,
  options: {
    action: 'create'
  },
  init: function() {
    this.el.addClass('blockPreview');
    new Ngn.sd.BlockDragNew(this);
  },
  updateElement: function() {
    Ngn.sd.block(Ngn.sd.elBlock().inject(this.container()), this._data);
    this.el.destroy();
  }
});

Ngn.sd.TranslateDragEvents = new Class({

  translateDragEvents: function() {
    return {
      onStart: this.onStart.bind(this),
      onDrag: this.onDrag.bind(this),
      onComplete: this.onComplete.bind(this)
    }
  }

});

Ngn.sd.BlockDraggableProgress = {};

Ngn.sd.BlockDraggable = new Class({
  Implements: [Ngn.sd.TranslateDragEvents],

  name: 'default',

  initialize: function(block) {
    this.block = block;
    this.eHandle = this.getHandleEl();
    this.init();
    new Drag(new Element('div'), Object.merge({
      handle: this.eHandle,
      snap: 0,
      stopPropagation: true
    }, this.translateDragEvents()))
  },

  init: function() {
  },

  getHandleEl: function() {
    return Elements.from('<div class="btn' + (this.name.capitalize()) + ' control"></div>')[0].inject(this.block.el, 'top');
  },

  onStart: function(el, e) {
    Ngn.sd.BlockDraggableProgress[this.name] = true;
  },

  onComplete: function() {
    delete Ngn.sd.BlockDraggableProgress[this.name];
    this.block.updateContainerHeight();
    window.fireEvent(this.name);
    this.block.save();
  }

});

Ngn.sd.BlockResize = new Class({
  Extends: Ngn.sd.BlockDraggable,

  name: 'resize',

  onStart: function(el, e) {
    this.parent(el, e);
    this.offset = this.block.el.getPosition();
  },

  onDrag: function(el, e) {
    this.block.resize({
      w: e.event.pageX - this.offset.x,
      h: e.event.pageY - this.offset.y
    });
  }

});

Ngn.sd.BlockRotate = new Class({
  Extends: Ngn.sd.BlockDraggable,

  name: 'rotate',

  init: function() {
    this.block.data.rotate = this.block.data.rotate || 0;
    if (this.block.data.rotate) this.block.rotate(this.block.data.rotate);
  },
  onStart: function(el, e) {
    this.parent(el, e);
    this.startY = e.event.pageY;
    this.startRotate = this.block.data.rotate;
  },
  onDrag: function(el, e) {
    this.block.rotate(this.startRotate - (this.startY - e.event.pageY) * 2);
  }

});

Ngn.sd.blocks = {};
Ngn.sd.BlockB = new Class({
  Extends: Ngn.sd.BlockAbstract,
  Implements: [Ngn.sd.Font],
  options: {
    action: 'update'
  },
  className: function() {
    return 'Ngn.sd.BlockB' + Ngn.String.ucfirst(this.data.type);
  },
  setData: function(data) {
    if (data.html === undefined) throw new Error('undefined data.html');
    this.parent(data);
  },
  styleEl: function() {
    return this.el.getElement('.cont');
  },
  delete: function() {
    this.parent();
    delete Ngn.sd.blocks[this._data.id];
    Ngn.sd.initLayersPanel();
    //this.updateContainerHeight();
  },
  init: function() {
    if (this._data.id) Ngn.sd.blocks[this._data.id] = this;
    this.el.sdSetPosition(this.data.position);
    this.updateOrder();
    this.initControls();
    this.initFont();
    this.replaceContent();
    this.updateContent();
    this.updateSize();
    // Ngn.sd.setMinHeight(eContainer); 
  }, // предназначено для изменения стилей внутренних элементов из данных блока
  setToTheTop: function() {
    var minOrderKey = 1;
    for (var i in Ngn.sd.blocks) {
      if (Ngn.sd.blocks[i]._data.orderKey < minOrderKey) {
        minOrderKey = Ngn.sd.blocks[i]._data.orderKey;
      }
    }
    this.updateOrder(minOrderKey - 1);
    return this;
  },
  updateOrder: function(orderKey) {
    if (orderKey !== undefined) this._data.orderKey = orderKey;
    this.el.setStyle('z-index', -this._data.orderKey + 100);
  },
  updateContent: function() {
  },
  rotate: function(deg) {
    this._rotate(this.el.getElement('.cont'), deg);
  },
  _rotate: function(el, deg) {
    el.sdSetStyle('transform', 'rotate(' + deg + 'deg)');
    el.sdSetStyle('-ms-transform', 'rotate(' + deg + 'deg)');
    el.sdSetStyle('-webkit-transform', 'rotate(' + deg + 'deg)');
    this.data.rotate = deg;
  },
  initCopyCloneBtn: function() {
    if (this.finalData().data.type == 'image') {
      this.initCloneBtn();
    } else {
      this.initCopyBtn();
    }
  },
  initCopyBtn: function() {
    /*
     // temporarily disabled
     new Ngn.Btn(Ngn.Btn.btn2('Клонировать', 'copy').inject(this.eBtns, 'top'), function() {
     var data = Object.clone(this._data);
     data.data.position.x += 50;
     data.data.position.y += 50;
     delete data.id;
     Ngn.sd.block(Ngn.sd.elBlock().inject(this.container()), data).save(true);
     }.bind(this));
     */
  },
  initCloneBtn: function() {
    return;
    new Ngn.Btn(Ngn.Btn.btn2('Клонировать', 'copy').inject(this.eBtns, 'top'), function() {
      var data = {
        data: {
          position: {
            x: this._data.data.position.x + 20,
            y: this._data.data.position.y + 20
          },
          type: 'clone',
          refId: this._data.id,
          size: this._data.data.size
        },
        html: this._data.html
      };
      Ngn.sd.block(Ngn.sd.elBlock().inject(this.container()), data).save(true);
    }.bind(this));
  },
  initBtnsHide: function() {
    this.eBtns.setStyle('display', 'none');
    this.el.addEvent('mouseover', function() {
      if (Object.values(Ngn.sd.BlockDraggableProgress).length) return;
      if (Ngn.sd.isPreview()) return;
      if (Ngn.sd.movingBlock.get()) return;
      this.eBtns.setStyle('display', 'block');
    }.bind(this));
    this.el.addEvent('mouseout', function() {
      if (Object.values(Ngn.sd.BlockDraggableProgress).length) return;
      if (Ngn.sd.movingBlock.get()) return;
      this.eBtns.setStyle('display', 'none');
    }.bind(this));
  },
  deleteAction: function() {
    if (!confirm('Вы уверены?')) return;
    this.loading(true);
    this._deleteAction();
  },
  _deleteAction: function() {
    new Ngn.Request.JSON({
      url: this.ctrl + '/json_delete/' + this.id(),
      onComplete: function() {
        this.loading(false);
        this.delete();
      }.bind(this)
    }).send();
  },
  initDeleteBtn: function() {
    new Ngn.Btn(Ngn.Btn.btn2('Delete', 'delete').inject(this.eBtns, 'top'), function() {
      this.deleteAction();
    }.bind(this));
  },
  initBlockScopeBtn: function() {
    return;
    Ngn.Btn.flag2(this.global(), {
      title: 'Блок глобальный. Нажмите, что бы сделать локальным',
      cls: 'global',
      url: '/pageBlock/ajax_updateGlobal/' + this._data.id + '/0'
    }, {
      title: 'Блок локальный. Нажмите, что бы сделать глобальным',
      cls: 'local',
      url: '/pageBlock/ajax_updateGlobal/' + this._data.id + '/1'
    }).inject(this.eBtns, 'top');
  },
  initTextScopeBtn: function() {
    if (Ngn.sd.getBlockType(this.finalData().data.type).separateContent) {
      Ngn.Btn.flag2(this.data.separateContent, {
        title: 'Блок имеет отдельный текст для каждого раздела. Сделать общий текст для всех разделов',
        cls: 'dynamic',
        url: '/pageBlock/ajax_updateSeparateContent/' + this._data.id + '/0',
        confirm: 'Тексты для всех, кроме самого первого раздела будут удалены. Вы уверены?'
      }, {
        title: 'Блок имеет общий текст для всех разделов. Сделать отдельный текст для каждого раздела',
        cls: 'static',
        url: '/pageBlock/ajax_updateSeparateContent/' + this._data.id + '/1'
      }).inject(this.eBtns, 'top');
    }
  },
  initEditBtn: function() {
    if (this.finalData().data.type != 'image') {
      new Ngn.Btn(Ngn.Btn.btn2('Редактировать', 'edit').inject(this.eBtns, 'top'), this.editAction.bind(this));
    }
  },
  initBtns: function() {
    this.eBtns = new Element('div', {'class': 'btnSet'}).inject(this.el, 'top');
    this.initDeleteBtn();
    this.initEditBtn();
    this.initCopyCloneBtn();
    this.initBlockScopeBtn();
    this.initTextScopeBtn();
  },
  global: function() {
    if (this.data.global !== undefined) return this.data.global;
    return Ngn.sd.blockContainers[this.data.containerId].data.global;
  },
  editAction: function() {
    //Ngn.sd.previewSwitch(true);
    var cls = this.editDialogClass();
    var options = Object.merge(Object.merge({
      url: this.ctrl + '/json_edit/' + this._data.id + '?ownPageId=' + Ngn.sd.ownPageId,
      dialogClass: 'settingsDialog dialog',
      title: 'Edit Content',
      width: 500,
      id: this.data.type,
      savePosition: true, // force: false,
      onClose: function() {
        //Ngn.sd.previewSwitch(false);
      },
      onSubmitSuccess: function() {
        this.reload();
      }.bind(this)
    }, Ngn.sd.getBlockType(this.data.type).editDialogOptions || {}), this.editDialogOptions());
    new cls(options);
  },
  editDialogClass: function() {
    return Ngn.Dialog.RequestForm;
  },
  editDialogOptions: function() {
    return {};
  },
  initControls: function() {
    //this.initBtns();
    //this.initBtnsHide();
    this.initDrag();
    new Ngn.sd.BlockResize(this);
  },
  initDrag: function() {
    //this.eDrag = Elements.from('<a class="btn control drag dragBox2" data-move="1" title="Передвинуть блок"></a>')[0].inject(this.eBtns, 'top');
    this.drag = new Ngn.sd.BlockDrag(this);
//    return; 
  },
  updateSize: function() {
    if (!this.finalData().data.size) return;
    this.resizeEl(this.finalData().data.size);
  },
  resize: function(size) {
    this.resizeEl(size);
    this.data = Object.merge(this.data, {size: size});
  },
  resizeEl: function(size) {
    this.resizeBlockEl(size);
    this.resizeContentEl(size);
  },
  resizeBlockEl: function(size) {
    this._resizeEl(this.el, size);
  },
  resizeContentEl: function(size) {
    this._resizeEl(this.el.getElement('.cont'), size);
  },
  _resizeEl: function(el, size) {
    if (size.w) el.sdSetStyle('width', size.w + 'px');
    if (size.h) el.sdSetStyle('height', size.h + 'px');
  },
  move: function(d) {
    var r = {
      up: ['y', -1],
      down: ['y', 1],
      left: ['x', -1],
      right: ['x', 1]
    };
    var p = {};
    p[r[d][0]] = this.data.position[r[d][0]] + r[d][1];
    this.setPosition(p);
    clearTimeout(this.timeoutId);
    this.timeoutId = this.save.bind(this).delay(1000);
  },
  resetData: function() {
    this.data = this._data.data;
  },
  hasAnimation: function() {
    return false;
  },
  framesCount: function() {
    return 0;
  }
});

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

Ngn.sd.BlockBGallery = new Class({
  Extends: Ngn.sd.BlockB,

  init: function() {
    this.parent();
    var carousel = new Ngn.Carousel(this.el.getElement('.cont'));
    $('prev').addEvent('click', function() {
      carousel.toPrevious();
    });
    $('next').addEvent('click', function() {
      carousel.toNext();
    });
  }

});

Ngn.sd.BlockBFont = new Class({
  Extends: Ngn.sd.BlockB,
  fontSettingsAction: 'json_cufonSettings',
  fontSettingsDialogOptions: function() {
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
    }.bind(this));
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
  init: function() {
    this.parent();
    if (this.data.font.blink) Ngn.blink(this.el.getElement('.cont'), 500);
  },
  hasAnimation: function() {
    return this.data.font.blink ? true : false;
  },
  framesCount: function() {
    return 2;
  }
});

Ngn.sd.BlockBFont.html = {};

Ngn.sd.BlockBClone = new Class({
  Extends: Ngn.sd.BlockB,
  finalData: function() {
    return Ngn.sd.blocks[this._data.data.refId]._data;
  },
  initCopyCloneBtn: function() {
  },
  initResize: function() {
  },
  getDataForSave: function(create) {
    var p = this.parent(create);
    if (p.data.data && p.data.data.size) delete p.data.data.size;
    return p;
  }
});

Ngn.sd.BlockBBlog = new Class({
  Extends: Ngn.sd.BlockB,

  initBtns: function() {
    this.parent();
    new Ngn.Btn(Ngn.Btn.btn2('Настройки блога', 'settings').inject(this.eBtns, 'top'), function() {
      new Ngn.Dialog.RequestForm({
        url: '/blogSettings',
        dialogClass: 'settingsDialog compactFields dialog',
        width: 400
      });
    });
  },
  _resize: function(size) {
    delete size.h;
    this.parent(size);
  },
  replaceContent: function() {
    this.parent();
    this.el.getElements('.pNums a').each(function(el) {
      el.addEvent('click', function(e) {
        new Event(e).stop();
        new Ngn.Request({
          url: el.get('href').replace(/^\/(\w+)\//g, '/blog/'),
          onComplete: function() {
          }
        }).send();
      });
    });
  },
  editAction: function() {
  }

});

Ngn.sd.BlockBButton = new Class({
  Extends: Ngn.sd.BlockB,

  defaultData: function() {
    return {
      size: {
        w: 150,
        h: 40
      }
    };
  },

  _resize: function(size) {
    this.el.getElement('.btn').sdSetStyles({
      width: size.w + 'px',
      height: size.h + 'px'
    });
    var eSpan = this.el.getElement('.btn span');
    eSpan.sdSetStyle('margin-top', (Math.floor(size.h / 2 - (eSpan.getSize().y / 2)) - 1) + 'px');
    this.parent(size);
  }

});

// factory
Ngn.sd.block = function(el, data) {
  var cls = 'Ngn.sd.BlockB' + Ngn.String.ucfirst(data.data.type);
  var o = eval(cls);
  cls = o || Ngn.sd.BlockB;
  return new cls(el, data);
};

Ngn.sd.BlockDragAbstract = new Class({
  initialize: function(block) {
    this.block = block;
    this.drag = new Drag.Move(this.block.el, this.getDragOptions());
    this.startPos = {};
    this.init();
  },
  init: function() {
  },
  create: false,
  getDragOptions: function() {
    return {
      onDrop: function(eBlock, eContainer, event) {
        this.drop(eBlock);
      }.bind(this)
    };
  },
  drop: function(eBlock) {
    window.fireEvent('resize');
    this.block.setPosition({
      x: eBlock.getStyle('left').toInt(),
      y: eBlock.getStyle('top').toInt()
    });
    this.block.updateContainerHeight();
    this.block.save(this.create);
  }
});

Ngn.sd.BlockDragNew = new Class({
  Extends: Ngn.sd.BlockDragAbstract,
  create: true,
  init: function() {
    this.drag.start(this.block.event);
  },
  cancel: function() {
    this.block.delete();
  }
});

Ngn.sd.blockDraggin = false;

Ngn.sd.BlockDrag = new Class({
  Extends: Ngn.sd.BlockDragAbstract,
  initialize: function(block) {
    this.block = block;
    if (this.block.eDrag) {
      this.block.eDrag.addEvent('click', function() {
        if (this.dragging) return;
        Ngn.sd.movingBlock.toggle(block);
      }.bind(this));
    }
    this.drag = new Drag.Move(this.block.el, this.getDragOptions());
    this.startPos = {};
    this.init();
  },
  dragging: false,
  start: function(eBlock) {
    this.dragging = true;
    Ngn.sd.blockDraggin = true;
    this.startPos = eBlock.getPosition(this.block.container());
    Ngn.sd.movingBlock.cancel();
  },
  drop: function(eBlock, eContainer) {
    (function() {
      this.dragging = false;
      Ngn.sd.blockDraggin = false;
    }.bind(this)).delay(10);
    var eCurContainer = this.block.container();
    this.parent(eBlock, eContainer);
    if (eCurContainer != eContainer) Ngn.sd.updateContainerHeight(eCurContainer);
  },
  cancel: function() {
    this.dragging = false;
    this.block.el.sdSetPosition(this.startPos);
  }
});

Ngn.sd.elBlock = function() {
  return new Element('div', {'class': 'block'});
};

// data: id
Ngn.sd.ContainerAbstract = new Class({
  Implements: [Options, Ngn.sd.ElementMeta, Ngn.sd.Font, Ngn.sd.Items],
  type: null,
  options: {
    disableFont: false
  },
  finalData: function() {
    return {data: this.data};
  },
  initialize: function(data, options) {
    this.setOptions(options);
    this.data = data;
    this.afterData();
    this.ctrl = '/' + this.type;
    this.data.type = this.type;
    this.initElement(this.getEl());
    this.el.store('data', data);
    if (!this.data.position) this.data.position = {
      x: 0,
      y: 0
    };
    this.setPosition(this.data.position);
    this.initControls();
    if (!this.options.disableFont) this.initFont();
  },
  afterData: function() {
  },
  btns: {},
  initControls: function() {
    this.eBtns = new Element('div', {'class': 'btnSet'}).inject(this.el);
    new Element('div', {
      'class': 'ctrlTitle',
      html: this.id() + ':'
    }).inject(this.eBtns);
    this.initDrag();
    this.btns.deleteBg = new Ngn.Btn(Ngn.Btn.btn2('Удалить фон', 'delete').inject(this.eBtns), function() {
      if (!Ngn.confirm()) return;
      this.loading(true);
      new Ngn.Request.JSON({
        url: this.ctrl + '/json_removeBg/' + this.id(),
        onComplete: function() {
          this.loading(false);
          this.setBg(false);
        }.bind(this)
      }).send();
    }.bind(this));
    new Ngn.Btn(Ngn.Btn.btn2('Настройки фона', 'bgSettings').inject(this.eBtns), function() {
      new Ngn.Dialog.RequestForm({
        dialogClass: 'settingsDialog compactFields dialog',
        width: 450,
        url: this.ctrl + '/json_bgSettings/' + this.id(),
        onSubmitSuccess: function() {
          this.reload();
        }.bind(this)
      });
    }.bind(this));
    new Ngn.Btn(Ngn.Btn.btn2('Задать фон', 'image').inject(this.eBtns), null, {
      fileUpload: {
        url: this.ctrl + '/json_uploadBg/' + this.id(),
        onRequest: function() {
          this.loading(true);
        }.bind(this),
        onComplete: function(r) {
          this.loading(false);
          this.setBg(r.url + '?' + Math.random(1000));
        }.bind(this)
      }
    });
    this.setBg(this.data.bg || false);
  },
  toggleBtns: function() {
    this.btns.deleteBg.toggleDisabled(!!this.data.bg);
  },
  initDrag: function() {
    var eDrag = Elements.from('<div class="drag dragBox" title="Передвинуть фон"></div>')[0].inject(this.eBtns);
    var startCursorPos;
    new Drag(eDrag, {
      snap: 0,
      onStart: function(el, e) {
        startCursorPos = [e.event.clientX, e.event.clientY];
      },
      onDrag: function(el, e) {
        this.curPosition = {
          x: this.data.position.x + startCursorPos[0] - e.event.clientX,
          y: this.data.position.y + startCursorPos[1] - e.event.clientY
        };
        this.setPosition(this.curPosition);
      }.bind(this),
      onComplete: function(el) {
        this.data.position = this.curPosition;
        this.save();
      }.bind(this)
    });
  },
  setBg: function(url) {
    if (url) this.data.bg = url; else delete this.data.bg;
    this.refreshBg();
  },
  refreshBg: function() {
    var s = ['color'];
    for (var i = 0; i < s.length; i++) this.styleEl().sdSetStyle('background-' + s[i], '');
    if (this.data.bgSettings) for (var i in this.data.bgSettings) this.styleEl().sdSetStyle('background-' + i, this.data.bgSettings[i]);
    this.el.sdSetStyle('background-image', this.data.bg ? 'url(' + this.data.bg + '?' + this.data.dateUpdate + ')' : 'none');
    this.toggleBtns();
  },
  save: function(create) {
    var data = this.data;
    if (data.bg) delete data.bg;
    this.loading(true);
    new Ngn.Request.JSON({
      url: this.ctrl + '/json_' + (create ? 'create' : 'update'),
      onComplete: function() {
        this.loading(false);
      }.bind(this)
    }).post({data: data});
  },
  updateElement: function() {
    this.refreshBg();
    this._updateFont();
  },
  updateFont: function() {
    this._updateFont();
  },
  setPosition: function(position) {
    if (!position.x && !position.y) {
      this.el.sdSetStyle('background-position', '');
      return;
    }
    this.el.sdSetStyle('background-position', (-position.x) + 'px ' + (-position.y) + 'px');
  },
  loading: function(flag) {
    Ngn.Request.Iface.loading(flag);
  }
});

Ngn.sd.BlockContainer = new Class({
  Extends: Ngn.sd.ContainerAbstract,
  type: 'blockContainer',
  getEl: function() {
    var eParent = $('layout2').getElement('.lCont');
    var eContainer = new Element('div', {'class': 'container'});
    if (this.data.wrapper) {
      if ($(this.data.wrapper)) eParent = $(this.data.wrapper); else {
        eParent = new Element('div', {
          id: this.data.wrapper,
          'class': this.data.wrapper
        }).inject(eParent);
        new Element('div', {'class': 'clear clear_' + this.data.wrapper}).inject(eParent);
      }
      eContainer.inject(eParent.getElement('.clear_' + this.data.wrapper), 'before');
    } else {
      eContainer.inject(eParent);
    }
    return eContainer;
  },
  initControls: function() {
  }
});

Ngn.sd.Layout = new Class({
  Extends: Ngn.sd.ContainerAbstract,
  type: 'layout',
  options: {
    disableFont: true,
    cls: false
  },
  initControls: function() {
  },
  getEl: function() {
    if (!this.data.parent) throw new Error('parent not defined in ' + this.id() + ' layout');
    if (!$(this.data.parent)) throw new Error(this.data.parent + ' not found');
    var el = new Element('div', {
      id: this.id(),
      'class': 'layout' + (this.options.cls ? ' ' + this.options.cls : '')
    }).inject($(this.data.parent));
    return el;
  }
});

Ngn.sd.LayoutContent = new Class({
  Extends: Ngn.sd.ContainerAbstract,
  type: 'layoutContent',
  getEl: function() {
    return new Element('div', {
      'class': 'lCont'
    }).inject($('layout2'));
  },
  defaultFontColor: function() {
    return '#000';
  },
  initControls: function() {
  }
});

if (!Ngn.sd.blockTypes) Ngn.sd.blockTypes = [];

Ngn.sd.getBlockType = function(type) {
  for (var i = 0; i < Ngn.sd.blockTypes.length; i++) {
    if (Ngn.sd.blockTypes[i].data.type == type) return Ngn.sd.blockTypes[i];
  }
  for (var i = 0; i < Ngn.sd.blockUserTypes.length; i++) {
    if (Ngn.sd.blockUserTypes[i].data.type == type) return Ngn.sd.blockUserTypes[i];
  }
  return false;
};

Ngn.sd.exportLayout = function() {
  var eLayout = $('layout').clone();
  eLayout.getElements('.btnSet').dispose();
  eLayout.getElements('.btnResize').dispose();
  eLayout.getElements('.block.type_font').each(function(eBlock) {
    eBlock.getElement('.cont').set('html', Ngn.sd.BlockBFont.html[eBlock.get('data-id')]);
  });
  eLayout.getElements('.dynamicStyles').removeProperty('style').removeClass('dynamicStyles');
  // replace dynamic blocks content
  eLayout.getElements('.block').each(function(eBlock) {
    // разобраться в этом куске
    if (!Ngn.sd.blocks[eBlock.get('data-id')]) return;
    var type = Ngn.sd.blocks[eBlock.get('data-id')].finalData().data.type;
    if (Ngn.sd.getBlockType(type).dynamic) {
      var eStyle = eBlock.getElement('style');
      eStyle.inject(eBlock.getElement('.cont').set('html', '{tplBlock:' + eBlock.get('data-id') + '}'), 'top');
    }
  });
  new Element('style', {
    type: 'text/css',
    html: Ngn.sd.buildStyles()
  }).inject(eLayout, 'top');
  return eLayout.get('html');
};

Ngn.sd.ownPageId = 0;
Ngn.sd.blockUserTypes = [];

Ngn.sd.initUserTypes = function(types) {
  if (!types.length) return;
  new Ngn.sd.UserPanel(types);
  Ngn.sd.blockUserTypes = types;
};

Ngn.sd.initPageTitle = document.getElement('head title').get('text');

Ngn.getParam = function(val) {
  var result = "Not found",
    tmp = [];
  location.search
    //.replace ( "?", "" )
    // this is better, there might be a question mark inside
    .substr(1)
    .split("&")
    .forEach(function (item) {
      tmp = item.split("=");
      if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
    });
  return result;
};

Ngn.sd.loadData = function(ownPageId, onComplete) {
  onComplete = onComplete || function() {
  };
  //if () $('layout1').dispose();
  $('layout1').set('html', '');
  Ngn.sd.ownPageId = ownPageId;
  Ngn.Request.Iface.loading(true);
  Ngn.sd.blockContainers = {};
  if (Ngn.sd.pagesSet) Ngn.sd.pagesSet.setActive(ownPageId);
  new Ngn.Request.JSON({
    url: '/cpanel/' + Ngn.sd.bannerId + '/json_get/?renderKey=' + Ngn.getParam('renderKey'),
    onComplete: function(data) {
      var v, i;
      document.getElement('head title').set('html', data.pageTitle + ' - ' + Ngn.sd.initPageTitle);
      if (data.blockUserTypes) Ngn.sd.initUserTypes(data.blockUserTypes);
      //for (i = 0; i < data.items.layout.length; i++) {
      //  new Ngn.sd.Layout(data.items.layout[i], {
      //    cls: i == 0 ? data.layout : ''
      //  });
      //}
      //for (i = 0; i < data.items.layoutContent.length; i++) {
      //  Ngn.sd.layoutContent = new Ngn.sd.LayoutContent(data.items.layoutContent[i]);
      //}
      //for (i = 0; i < data.items.blockContainer.length; i++) {
      //  v = data.items.blockContainer[i];
      //  Ngn.sd.blockContainers[v.id] = new Ngn.sd.BlockContainer(v);
      //}

      Ngn.sd.eLayoutContent = new Element('div', {
        'class': 'lCont sdEl'
      }).inject('layout1');
      Ngn.sd.blocks = {};
      for (i = data.items.pageBlock.length - 1; i >= 0; i--) {
        v = data.items.pageBlock[i];
        Ngn.sd.blocks[v.id] = Ngn.sd.block(Ngn.sd.elBlock().inject(Ngn.sd.eLayoutContent), v);
      }

      Ngn.sd.eContentOverlayBorder = new Element('div', {'class': 'contentOverlayBorder'}).inject(Ngn.sd.eLayoutContent, 'top');
      new Element('div', {'class': 'contentOverlay contentOverlayLeft'}). //
        inject(Ngn.sd.eLayoutContent, 'top');
      new Element('div', {'class': 'contentOverlay contentOverlayTop'}). //
        inject(Ngn.sd.eLayoutContent, 'top');
      Ngn.sd.eContentOverlayRight = new Element('div', {'class': 'contentOverlay contentOverlayRight'}). //
        inject(Ngn.sd.eLayoutContent, 'top');
      Ngn.sd.eContentOverlayBottom = new Element('div', {'class': 'contentOverlay contentOverlayBottom'}). //
        inject(Ngn.sd.eLayoutContent, 'top');

      Ngn.sd.data = data;
      Ngn.sd.setBannerSize(data.bannerSettings.size);
      Ngn.sd.updateLayoutContentHeight();
      Ngn.sd.updateOrderBar(data.items.pageBlock);
      Ngn.sd.setPageTitle(ownPageId);
      // window.location = window.location.href.replace(/#pg\d+/, '') + '#pg' + ownPageId;
      Ngn.Request.Iface.loading(false);
      window.fireEvent('resize');
      onComplete(data);
    }
  }).send();
};

Ngn.sd.PageBlocksShift = new Class({
  back: function(id) {
    var ePrev = Ngn.sd.blocks[id].el.getPrevious('.block');
    if (ePrev) {
      Ngn.sd.blocks[id].el.inject(ePrev, 'before');
      this.updateOrder(id);
    }
  },
  forward: function(id) {
    var eNext = Ngn.sd.blocks[id].el.getNext('.block');
    if (eNext) {
      Ngn.sd.blocks[id].el.inject(eNext, 'after');
      this.updateOrder(id);
    }
  },
  updateOrder: function(id) {
    var esBlocks = Ngn.sd.blocks[id].el.getParent('.layout').getElements('.block');
    var ids = [];
    for (var i = 0; i < esBlocks.length; i++) {
      ids.push(esBlocks[i].get('data-id'));
    }
    new Ngn.Request.JSON({
      url: '/pageBlock/' + Ngn.sd.bannerId + '/json_updateOrder'
    }).post({
        ids: ids
      });
  }
});

Ngn.sd.PagesSet = new Class({
  Extends: Ngn.FieldSet,
  initRows: function() {
    this.parent();
    for (var i = 0; i < this.esRows.length; i++) {
      this.createRowButton(this.esRows[i], {
        caption: 'Перейти к редактированию раздела',
        cls: 'edit'
      }, function() {
        Ngn.sd.loadData(this.options.n);
      }, {
        n: this.esRows[i].retrieve('n')
      });
    }
  },
  setActive: function(n) {
    for (var i = 0; i < this.esRows.length; i++) {
      this.esRows[i].removeClass('active');
    }
    this.esRows[n - 1].addClass('active');
  }

});

Ngn.sd.pages = {};

Ngn.sd.setPageTitle = function(n) {
  if (Ngn.sd.pages[n]) $('pageTitle').set('html', Ngn.sd.pages[n]);
};

Ngn.sd.UserPanel = new Class({
  initialize: function(blockUserTypes) {
    var eBlocksPanel = new Element('div', {
      'class': 'dropRightMenu extraBlocks'
    }).inject(Ngn.sd.ePanel, 'after');
    new Element('div', {
      'class': 'tit',
      html: 'Ещё'
    }).inject(eBlocksPanel);
    Ngn.sd.buildBlockBtns(blockUserTypes, eBlocksPanel);
    new Ngn.HidebleBar.V(eBlocksPanel);
  }
});

Ngn.sd.OrderBarItem = new Class({

  initialize: function(id) {
    this.id = id;
    this.el = new Element('div', {
      'class': 'item',
      html: Ngn.sd.blocks[id]._data.data.type + ' ' + Ngn.sd.blocks[id]._data.id
    }).inject($('orderBar'));
    this.el.addEvent('mouseover', function() {
      Ngn.sd.blocks[id].el.addClass('highlight');
    });
    this.el.addEvent('mouseout', function() {
      Ngn.sd.blocks[id].el.removeClass('highlight');
    });
  }

});

Ngn.sd.updateOrderBar = function(orderedBlocks) {
  $('orderBar').set('html', '');
  for (var i = 0; i < orderedBlocks.length; i++) {
    if (Ngn.sd.blocks[orderedBlocks[i].id]) new Ngn.sd.OrderBarItem(orderedBlocks[i].id);
  }
};

Ngn.sd.animation = {};
Ngn.sd.animation.exists = function() {
  for (var i in Ngn.sd.blocks) {
    if (Ngn.sd.blocks[i].hasAnimation()) return true;
  }
  return false;
};
Ngn.sd.setBannerSize = function(size) {
  document.title = size.w + 'x' + size.h;
  Ngn.sd.bannerSize = size;
  Ngn.sd.eLayoutContent.setStyle('width', size.w + 'px');
  Ngn.sd.eContentOverlayBottom.setStyle('width', size.w + 'px');
  Ngn.sd.eContentOverlayBottom.setStyle('top', size.h + 'px');
  Ngn.sd.eContentOverlayRight.setStyle('left', size.w + 'px');
  Ngn.sd.eLayoutContent.setStyle('min-height', 'auto');
  Ngn.sd.eLayoutContent.setStyle('height', size.h + 'px');
  Ngn.sd.eContentOverlayBorder.setStyle('height', size.h + 'px');
};
Ngn.sd.animation.framesCount = function() {
  var count = 0;
  for (var i in Ngn.sd.blocks) {
    if (Ngn.sd.blocks[i].framesCount() > count) {
      count = Ngn.sd.blocks[i].framesCount();
    }
  }
  return count;
};

Ngn.sd.sortBySubKey = function(obj, key1, key2) {
  var r = [];
  for (var key in obj) r.push(obj[key]);
  r.sort(function(a, b) {
    return a[key1][key2] < b[key1][key2] ? -1 : a[key1][key2] > b[key1][key2] ? 1 : 0
  });
  return r;
};

Ngn.sd.initLayersPanel = function() {
  Ngn.sd.eLayers.set('html', '');
  var title;
  var item;
  var sortedBlocks = Ngn.sd.sortBySubKey(Ngn.sd.blocks, '_data', 'orderKey');
  new Element('div', {
    html: 'Layers',
    'class': 'lTitle'
  }).inject(Ngn.sd.eLayers);
  var eLayers = new Element('div', {
    'class': 'layers'
  }).inject(Ngn.sd.eLayers);
  for (var i = 0; i < sortedBlocks.length; i++) {
    item = sortedBlocks[i]._data;
    if (item.data.type == 'image' || item.data.type == 'background' || item.data.type == 'button') {
      title = '<span class="ico">' + //
      item.html + '</span>' + //
        // item.id + ' ' + //
      Ngn.String.ucfirst(item.data.type);
    } else if (item.data.type == 'font') {
      var text = item.html.replace(/<br \/>/g, " ").substring(0, 10);
      title = '<span class="ico">' + //
      '<img src="/sd/img/font.png?v3"></span>' + //
        // item.id + ' ' + //
      (text ? text : 'empty')
    } else {
      throw new Error('Unsupported layer type "' + item.data.type + '"');
    }
    var eItem = new Element('div', {
      'class': 'item ' + 'item_' + item.data.type,
      'data-id': item.id,
      'data-type': item.data.type
    });
    new Element('div', {
      'class': 'title',
      html: title
    }).inject(eItem);
    var eBtns = new Element('div', {
      'class': 'btns'
    }).inject(eItem);
    if (Ngn.sd.blocks[item.id].finalData().data.type == 'font') {
      new Ngn.Btn( //
        Ngn.Btn.btn2('Edit', 'edit').inject(eBtns), //
        Ngn.sd.blocks[item.id]._fontSettingsAction.bind(Ngn.sd.blocks[item.id]) //
      );
    } else {
      new Element('a', {
        'class': 'smIcons dummy'
      }).inject(eBtns);
    }
    new Ngn.Btn( //
      Ngn.Btn.btn2('Delete', 'delete').inject(eBtns), //
      Ngn.sd.blocks[item.id].deleteAction.bind(Ngn.sd.blocks[item.id]) //
    );
    eItem.inject(eLayers);
  }
  new Sortables(eLayers, {
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
      for (var i = 0; i < ids.length; i++) {
        Ngn.sd.blocks[ids[i]].updateOrder(i);
      }
      new Ngn.Request({
        url: '/pageBlock/' + Ngn.sd.bannerId + '/json_updateOrder'
      }).post({
          ids: ids
        });
    }
  });
};

Ngn.sd.changeBannerBackground = function(backgroundUrl) {
  new Ngn.Request.JSON({
    url: '/cpanel/' + Ngn.sd.bannerId + '/json_createBackgroundBlock?backgroundUrl=' + backgroundUrl,
    onComplete: function() {
      Ngn.sd.reinit();
    }
  }).send();
};

Ngn.sd.buildPanel = function() {
  var pg = window.location.hash.match(/#pg(\d+)/);
  Ngn.sd.ePanel = new Element('div', {'class': 'cont'}).inject($('panel'));
  new Element('a', {
    'class': 'logo',
    href: '#', //target: '_blank',
    title: '...'
  }).inject(Ngn.sd.ePanel);
  Ngn.sd.eFeatureBtns = new Element('div', {
    'class': 'featureBtns'
  }).inject(Ngn.sd.ePanel);
  //new Element('div', {'class': 'clear'}).inject(Ngn.sd.ePanel);


  new Element('div', {
    'class': 'tit'
  }).inject(Ngn.sd.ePanel);

  //===================
  document.getElement('.profileBar').inject(Ngn.sd.ePanel);
  //===================

  // -- layers control
  Ngn.sd.eLayers = new Element('div', {'class': 'cont'}).inject($('layers'));
  Ngn.sd.loadData(pg ? pg[1] : 1, function(data) {
    Ngn.sd.initLayersPanel();
  });
  Ngn.sd.bindKeys();


  window.fireEvent('sdPanelComplete');
};

Ngn.sd.fbtn = function(title, cls) {
  var btn = new Element('a', {
    'class': 'panelBtn ' + cls,
    html: '<i></i><div>' + title + '</div>'
  });
  new Element('div', {'class': 'featureBtnWrapper'}).grab(btn).inject(Ngn.sd.eFeatureBtns);
  return btn;
};

Ngn.sd.movingBlock = {
  get: function() {
    return this.block;
  },
  set: function(block) {
    this.block = block;
    block.eDrag.addClass('pushed');
  },
  toggle: function(block) {
    if (this.block) {
      var enother = this.block != block;
      this.block.eDrag.removeClass('pushed');
      this.block = false;
      if (enother) this.set(block);
    } else {
      this.set(block);
    }
  },
  cancel: function() {
    if (!this.block) return;
    this.block.eDrag.removeClass('pushed');
    this.block = false;
  }
};

Ngn.sd.minContainerHeight = 100;

Ngn.sd.bindKeys = function() {
  var moveMap = {
    119: 'up',
    87: 'up',
    1094: 'up',
    1062: 'up',
    1092: 'left',
    1060: 'left',
    97: 'left',
    65: 'left',
    1099: 'down',
    1067: 'down',
    83: 'down',
    115: 'down',
    100: 'right',
    68: 'right',
    1074: 'right',
    1042: 'right'
  };
  var shiftMap = {
    'q': 'back',
    'Q': 'back',
    'й': 'back',
    'Й': 'back',
    'e': 'forward',
    'E': 'forward',
    'у': 'forward',
    'У': 'forward'
  };
  document.addEvent('keypress', function(e) {
    if (e.shift && (e.key == 'p' || e.key == 'з')) Ngn.sd.previewSwitch(); // p
    else if (moveMap[e.code]) {
      var movingBlock = Ngn.sd.movingBlock.get();
      if (movingBlock) movingBlock.move(moveMap[e.code]);
    } else if (shiftMap[e.key]) {
      var movingBlock = Ngn.sd.movingBlock.get();
      if (movingBlock) {
        (new Ngn.sd.PageBlocksShift)[shiftMap[e.key]](movingBlock._data.id);
      }
    }
  });
};

Ngn.sd.isPreview = function() {
  return $('layout').hasClass('preview');
};

Ngn.sd.previewSwitch = function(flag) {
  flag = typeof(flag) == 'undefined' ? Ngn.sd.isPreview() : !flag;
  if (flag) {
    document.getElement('.body').removeClass('preview');
    if (Ngn.sd.btnPreview) Ngn.sd.btnPreview.togglePushed(false);
  } else {
    document.getElement('.body').addClass('preview');
    if (Ngn.sd.btnPreview) Ngn.sd.btnPreview.togglePushed(true);
  }
};

Ngn.sd.updateLayoutContentHeight = function() {
  return;
  var y = 0;
  for (var i in Ngn.sd.blockContainers) y += Ngn.sd.blockContainers[i].el.getSize().y;
  $('layout').getElement('.lCont').sdSetStyle('min-height', (y + 6) + 'px');
};

Ngn.sd.SelectDialog = new Class({
  Extends: Ngn.ElSelectDialog,
  options: {
    selectedName: false,
    footer: false,
    width: 580,
    height: 300,
    savePosition: true,
    onChangeFont: function() {
    }
  },
  setOptions: function(opts) {
    this.parent(Object.merge(opts || {}, {id: this.name + 'Select'}));
  },
  init: function() {
    var eSelected;
    var obj = this;
    this.message.getElements('div.item').each(function(el) {
      if (obj.options.selectedName && el.get('data-name') == obj.options.selectedName) {
        eSelected = el.addClass('selected');
      }
      el.addEvent('click', function() {
        if (eSelected) eSelected.removeClass('selected');
        el.addClass('selected');
        eSelected = this;
        obj.fireEvent('changeValue', el.get('data-name'));
      });
    });
    if (eSelected) (function() {
      new Fx.Scroll(obj.message).toElement(eSelected)
    }).delay(500);
  }
});

Ngn.sd.FontSelectDialog = new Class({
  Extends: Ngn.sd.SelectDialog,
  name: 'font',
  options: {
    width: 600,
    message: Ngn.tpls.fontSelect,
    title: 'Choose Font...'
  },
  init: function() {
    this.parent();
    this.message.addClass('hLoader');
    var els = this.message.getElements('div.item');
    var loaded = 0;
    els.each(function(el) {
      Ngn.sd.loadFont(el.get('data-name'), function() {
        loaded++;
        Cufon.set('fontFamily', el.get('data-name')).replace(el.getElement('.font'));
        if (loaded == els.length) this.message.removeClass('hLoader');
      }.bind(this));
    }.bind(this));
  }
});

Ngn.Form.El.DialogSelect.Sd = new Class({
  Extends: Ngn.Form.El.DialogSelect,

  getSelectDialogEl: function() {
    var eSelectDialog = new Element('div', {
      'class': 'dialogSelect' + (this.options.selectClass ? ' ' + this.options.selectClass : ''),
      title: this.options.selectTitle
    }).inject(this.eInitField, 'after');
    new Element('div', {'class': 'rightFading'}).inject(eSelectDialog);
    return eSelectDialog;
  }

});

Ngn.Form.El.FontFamilyCufon = new Class({
  Extends: Ngn.Form.El.DialogSelect.Sd,
  baseName: 'font',
  options: {
    selectClass: 'font'
  },
  init: function() {
    this.parent();
    this.value ? Ngn.sd.loadFont(this.value, this.initControl.bind(this)) : this.initControl();
  },
  initControlDefault: function() {
  },
  setValue: function(font) {
    this.parent(font);
    Cufon.set('fontFamily', font).replace(this.eSelectDialog);
  },
  getDialogClass: function() {
    return Ngn.sd.FontSelectDialog;
  }
});

Ngn.sd.itemTpl = function(k, v) {
  var el = Elements.from(Ngn.tpls[k])[0].getElement('div.item[data-name=' + v + ']');
  if (!el) throw new Error('Element "' + v + '" not found');
  return el.get('html');
};

Ngn.sd.exportPageR = function(n) {
  console.debug('Загружаю данные');
  var onLoaded = function(n) {
    var onComplete;
    if (Ngn.sd.pages[n + 1]) {
      onComplete = function() {
        Ngn.sd.exportPageR(n + 1);
      }
    } else {
      onComplete = function() {
        new Ngn.Dialog.Link({
          title: 'Результат',
          width: 150,
          link: '/index.html?' + Math.random()
        });
      }
    }
    console.debug('Экспортирую ' + (n == 1 ? 'индекс' : n));
    Ngn.sd.exportRequest(n == 1 ? 'index' : 'page' + n, onComplete);
  };
  Ngn.sd.loadData(n, onLoaded);
};

Ngn.sd.init = function(bannerId) {
  Ngn.sd.bannerId = bannerId;
  Ngn.sd.buildPanel();
  if (window.location.hash == '#preview') {
    Ngn.sd.previewSwitch();
  }
};

Ngn.sd.reinit = function() {
  Ngn.sd.init(Ngn.sd.bannerId);
};

Ngn.sd.updateContainerHeight = function(eContainer) {
  return;
  Ngn.sd.setMinHeight(eContainer, 0, Ngn.sd.minContainerHeight);
  Ngn.sd.updateLayoutContentHeight();
};

Ngn.sd.initFullBodyHeight();
