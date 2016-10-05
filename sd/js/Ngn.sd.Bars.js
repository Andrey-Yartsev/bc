Ngn.sd.Bars = new Class({
  layersBar: null,
  initialize: function() {
    var pg = window.location.hash.match(/#pg(\d+)/);
    Ngn.sd.ePanel = new Element('div', {'class': 'cont'}).inject($('panel'));
    this.logoElement().inject(Ngn.sd.ePanel);
    Ngn.sd.eFeatureBtns = new Element('div', {
      'class': 'featureBtns'
    }).inject(Ngn.sd.ePanel);
    //new Element('div', {'class': 'clear'}).inject(Ngn.sd.ePanel);
    new Element('div', {
      'class': 'tit'
    }).inject(Ngn.sd.ePanel);
    Ngn.sd.eLayers = new Element('div', {'class': 'cont'}).inject($('layers'));
    Ngn.sd.loadData(pg ? pg[1] : 1, function(data) {
      this.layersBar = this.getLayersBar();
      window.fireEvent('sdDataLoaded');
    }.bind(this));
    this.bindKeys();
    window.fireEvent('sdPanelComplete');
  },
  dispose: function() {
    Ngn.sd.eLayers.dispose();
  },
  logoElement: function() {
    return new Element('a', {
      'class': 'logo',
      href: '/', //target: '_blank',
      title: 'Home'
    });
  },
  getLayersBar: function() {
    return new Ngn.sd.LayersBar();
  },
  bindKeys: function() {
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
      if (e.shift && (e.key == 'p' || e.key == 'з')){//Ngn.sd.previewSwitch(); fix issue BC-88
         } // p
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
  }
});
