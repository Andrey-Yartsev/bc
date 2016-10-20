<?php

class BannerSettingsEditForm extends BannerSettingsForm {

  protected $bannerId, $banner;

  function __construct($bannerId) {
    $this->bannerId = $bannerId;
    $this->banner = $this->defaultData  = db()->getRow('bcBanners', $this->bannerId);
    parent::__construct();
  }

  protected function defineOptions() {
    return array_merge(parent::defineOptions(), [
      'title'       => 'Edit banner',
      'submitTitle' => 'Save'
    ]);
  }

  protected function _update(array $data) {
    if ($this->banner['size'] != $data['size']) {
      db()->insert('bcBlocks_undo_stack', [
        'act'      => 'settings',
        'data'     => serialize(['size' => $this->banner['size']]),
        'bannerId' => $this->bannerId,
      ]);
    }
    db()->update('bcBanners', $this->bannerId, $data);
  }

}