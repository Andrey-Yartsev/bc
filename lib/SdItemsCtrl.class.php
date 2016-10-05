<?php

trait SdItemsCtrl {
  use ItemsCtrl;

  protected function getParamActionN() {
    return 2;
  }

  function action_json_uploadBg() {
    $items = $this->items();
    $id = $this->req->param(2);
    copy($this->req->files['file']['tmp_name'], Dir::make(UPLOAD_PATH."/{$items->name}/bg")."/$id.jpg");
    $url = '/'.UPLOAD_DIR."/{$items->name}/bg/".$id.'.jpg';
    $form = $this->bgSettingsForm();
    $data = [
      'dateUpdate' => time(),
      'bg'         => $url
    ];
    foreach ($form->fields->fields as $k => $v) if (!empty($v['default'])) $default[$k] = $v['default'];
    if (isset($default)) $data = array_merge($data, [$form->settingsKey => $default]);
    $this->items()->update($id, $data);
    $this->json['url'] = $url;
  }

  protected function bgSettingsForm() {
    return $form = new SdBgSettingsForm($this->items(), $this->req->param(2));
  }

  function action_json_removeBg() {
    $id = $this->req->param(2);
    $this->items()->remove($id, 'bg');
    File::delete(UPLOAD_PATH."/{$this->items()->name}/bg/$id.jpg");
  }

  function action_json_bgSettings() {
    return $this->jsonFormActionUpdate($this->bgSettingsForm());
  }

  function action_json_blockSettings() {
    return $this->jsonFormActionUpdate(SdFormFactory::blockSettings($this->req->param(3), $this->items()));
  }

}