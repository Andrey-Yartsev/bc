<?php

class CtrlSdPageBlock extends CtrlCommon {
use SdItemsCtrl;

  protected function updateReqId() {
    return $this->req['id'];
  }

  protected function getCurrentOwnPageId() {
    return $this->req['ownPageId'] ? : SdCore::defaultOwnPageId;
  }

  protected function items() {
    return new SdPageBlockItems($this->req->param(1));
  }

  static function boolValue($v) {
    if (is_string($v) and (bool)$v != $v) {
      // значит это слово 'false' / 'true'
      return (bool)$v;
    } else {
      return (bool)$v;
    }
  }

  function action_json_update() {
    $items = $this->items();
    $data = $this->req['data'];
    if (isset($this->req['data']['font']['shadow'])) {

      $data['font']['shadow'] = self::boolValue($this->req['font']['shadow']);
      //die2($this->req['font']);
    }
    if (isset($this->req['data']['font']['blink'])) {
      $data['font']['blink'] = self::boolValue($this->req['font']['blink']);
    }
    $items->update($this->updateReqId(), $data);
    $this->json = $items->getItemF($this->updateReqId());
  }

  function action_json_edit() {
    return $this->jsonFormActionUpdate(SdFormFactory::edit($this->req->param(3), $this->items()));
  }

  static function protoData($type) {
    return ['data' => [
      'type'        => $type,
      'ownPageId'   => SdCore::defaultOwnPageId,
      'dateUpdate'  => time(),
      'position'    => [
        'x' => 0,
        'y' => 0
      ]
    ]];
  }

  function uploadCreate($type) {
    $items = $this->items();
    $name = $items->name;
    $size = getimagesize($this->req->files['file']['tmp_name']);
    $maxWidth = BcCore::getSize($this->req->param(1))['w'] * 2;
    if ($size[0] > $maxWidth) {
      $w = $maxWidth;
      $a = $size[0] / $size[1];
      $h = $w / $a;
      (new Image)->resizeAndSave($this->req->files['file']['tmp_name'], $this->req->files['file']['tmp_name'], $w, $h);
      $size[0] = $maxWidth;
      $size[1] = $h;
    }
    $d = [
      'data' => [
        'type'        => 'image',
        'ownPageId'   => $this->getCurrentOwnPageId(),
        'dateUpdate'  => time(),
        'position'    => [
          'x' => 0,
          'y' => 0
        ],
        'size'        => [
          'w' => $size[0],
          'h' => $size[1]
        ]
      ]
    ];
    $id = $items->create($d);
    $file = Dir::make(UPLOAD_PATH."/$name/$type")."/$id.jpg";
    copy($this->req->files['file']['tmp_name'], $file);
    $this->json = $items->getItemF($id);
  }

  function uploadUpdate($type) {
    $items = $this->items();
    $id = $this->req->param(2);
    $size = getimagesize($this->req->files[$this->req['fn']]['tmp_name']);
    $items->update($id, [
      'dateUpdate' => time(),
      'size' => [
        'w' => $size[0],
        'h' => $size[1]
      ]
    ]);
    $file = Dir::make(UPLOAD_PATH."/{$items->name}/$type").'/'.$id.'.jpg';
    copy($this->req->files[$this->req['fn']]['tmp_name'], $file);
    $this->json = $items->getItemF($id);
  }

  function action_json_createImage() {
    $this->uploadCreate('image');
  }

  function action_json_updateImage() {
    $this->uploadUpdate('image');
  }

  function action_json_updateImages() {
    $items = $this->items();
    $id = $this->req->param(2);
    $n = 0;
    foreach ($this->req->files['images'] as $v) {
      $file = Dir::make(UPLOAD_PATH."/{$items->name}/images/$id").'/'.$n.'.jpg';
      copy($v['tmp_name'], $file);
      $n++;
    }
    $items->updateContent($id, ['n' => $n]);
  }

  function action_ajax_updateGlobal() {
    $this->items()->updateGlobal($this->req->param(2), $this->req->params[3]);
  }

  function action_ajax_updateSeparateContent() {
    $this->items()->updateSeparateContent($this->req->param(2), $this->req->params[3]);
  }

  function action_json_updateOrder() {
    foreach (array_flip($this->req['ids']) as $blockId => $orderKey) {
      db()->query("UPDATE bcBlocks SET orderKey=?d WHERE id=?d", $orderKey, $blockId);
    }
  }

}
