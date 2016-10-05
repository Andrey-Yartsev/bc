<?php

class CtrlSdCpanel extends CtrlBase {
  use SdPersonalCtrl;

  protected function getParamActionN() {
    return 2;
  }

  protected function init() {
    if (!Auth::get('id') and $this->req['adminKey'] != Config::getVar('adminKey')) {
      $this->redirect('/');
      return;
    }
    $this->setPageTitle('Editor');
  }

  protected $banner;

  protected function afterInit() {
    $this->d['bannerId'] = Misc::checkEmpty($this->req->param(1));
    $this->banner = db()->getRow('bcBanners', $this->d['bannerId']);
    if ($this->banner['userId'] != Auth::get('id') and $this->req['adminKey'] != Config::getVar('adminKey')) throw new AccessDenied;
    Sflm::frontend('css')->addLib('sdEdit');
    Sflm::frontend('js')->addLib('sdEdit');
    Sflm::frontend('js')->addClass('Ngn.Dialog.RequestForm');
    Sflm::frontend('js')->addPath('sd/js/Ngn.sd.js');
  }

  function action_default() {
    $this->d['tpl'] = 'inner';
  }

  function action_json_get() {
    $this->json['items'] = [
      'blockContainer' => [
        [
          'id'     => 'content',
          'blocks' => true,
          'global' => false
        ]
      ],
      'layout'         => [
        [
          'id'         => 'layout1',
          'parent'     => 'layout',
          'bgSettings' => [
            'repeat' => 'no-repeat'
          ]
        ],
        [
          'id'     => 'layout2',
          'parent' => 'layout1'
        ]
      ],
      'layoutContent'  => [
        [
          'id'   => 'layout',
          'type' => 'layoutContent',
          'font' => ['fontSize' => '24px']
        ]
      ]
    ];
    $this->json['items']['pageBlock'] = (new RouterManager([ //
      'req' => new Req([ //
        'uri' => "/pageBlock/{$this->d['bannerId']}/json_getItems" //
      ]) //
    ]))->router()->dispatch()->controller->json;
    if (!empty($this->json['items']['pageBlock']['error'])) {
      $this->json['error'] = $this->json['items']['pageBlock']['error'];
      return;
    }
    $this->json['bannerSizes'] = self::getSizes();
    $this->json['project'] = ['title' => 'dummy'];
    $this->json['pageTitle'] = $this->editPageTitle();
    $this->json['layout'] = SdCore::getLayout($this->req['ownPageId']);
    $this->json['bannerSettings']['size'] = BcCore::getSize($this->d['bannerId']);
    $this->json['undoExists'] = (bool)db()->selectCell("SELECT COUNT(*) FROM bcBlocks_undo_stack WHERE bannerId=?", $this->d['bannerId']);
    $this->json['redoExists'] = (bool)db()->selectCell("SELECT COUNT(*) FROM bcBlocks_redo_stack WHERE bannerId=?", $this->d['bannerId']);
  }

  protected function editPageTitle() {
    return implode('x', BcCore::getSize($this->d['bannerId']));
  }

  static $sizes;

  static function getSizes() {
    $r = [];
    foreach (self::$sizes as $v) {
      $r[] = $v[0].' x '.$v[1];
    }
    return $r;
  }

  static function getSizeOptions() {
    $options = [];
    foreach (self::$sizes as $v) {
      $options[$v[0].' x '.$v[1]] = $v[0].' x '.$v[1];
    }
    return $options;
  }

  function action_json_settings() {
    $form = new BannerSettingsEditForm($this->d['bannerId']);
    if ($form->update()) {
      list($this->json['w'], $this->json['h']) = explode(' x ', $form->getData()['size']);
      return null;
    }
    $this->json['title'] = 'Banner Settings';
    return $form;
  }

  protected function getUserTypes($package) {
    $r = [
      [
        'title'         => 'Авторизация',
        'dynamic'       => true,
        'data'          => [
          'type' => 'auth'
        ],
        'dialogOptions' => [
          'dialogClass' => 'settingsDialog compactFields dialog'
        ],
        'packages'      => [312]
      ],
      /*
      [
        'title'    => 'Блог',
        'data'     => [
          'type' => 'blog'
        ],
        'packages' => [312]
      ],
      */
      [
        'title'    => 'Галерея',
        'data'     => [
          'type' => 'gallery'
        ],
        'packages' => [312]
      ],
      [
        'title'         => 'Произвольный шаблон',
        'data'          => [
          'type' => 'tpl'
        ],
        'dialogOptions' => [
          'width'       => '220',
          'dialogClass' => 'dialog fieldFullWidth'
        ],
        'packages'      => [312]
      ],
      [
        'title'    => 'Аудио',
        'data'     => [
          'type' => 'audio'
        ],
        'packages' => [315]
      ]
    ];
    return array_values(array_filter($r, function ($v) use ($package) {
      return in_array($package, $v['packages']);
    }));
  }

  protected function createImageBlock($type) {
    $data = CtrlSdPageBlock::protoData($type);
    $data['data']['subType'] = 'image';
    $data['data']['imageUrl'] = $this->req->rq('url');
    if (Misc::hasPrefix('/u/', $data['data']['imageUrl'])) {
      $file = WEBROOT_PATH.$data['data']['imageUrl'];
    }
    elseif (Misc::hasPrefix('/m/', $data['data']['imageUrl'])) {
      $file = WEBROOT_PATH.$data['data']['imageUrl'];
    }
    else {
      $file = $data['data']['imageUrl'];
    }
    list($imageSize['w'], $imageSize['h']) = getimagesize($file);
    $bannerSize = BcCore::getSize($this->d['bannerId']);
    $data['data']['size'] = $imageSize;
    $data['data']['position'] = [
      'x' => $bannerSize['w'] - $imageSize['w'] - 10,
      'y' => $bannerSize['h'] - $imageSize['h'] - 10
    ];
    (new SdPageBlockItems($this->d['bannerId']))->create($data);
  }

  function action_json_createButtonBlock() {
    $this->createImageBlock('button');
  }

  function action_json_createClipartBlock() {
    $this->createImageBlock('clipart');
  }

}

CtrlSdCpanel::$sizes = Config::getVar('sd/sizes', false, false);