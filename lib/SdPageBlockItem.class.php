<?php

class SdPageBlockItem extends ArrayAccesseble {

  /**
   * @param array $item
   * @param $bannerId
   * @return SdPageBlockItem
   */
  static function factory(array $item, $bannerId) {
    $class = ucfirst('SdPageBlockItem'.ucfirst($item['data']['type']));
    $class = class_exists($class) ? $class : 'SdPageBlockItem';
    if (gettype($item['content']) == 'string') $item['content'] = [];
    return new $class($item, $bannerId);
  }

  protected $bannerId;

  function __construct(array $item, $bannerId) {
    Arr::checkEmpty($item, 'data');
    Arr::checkEmpty($item['data'], 'type');
    $this->bannerId = $bannerId;
    $this->r = $item;
  }

  function prepareHtml($ownPageId) {
    if ($this->r['data']['type'] == 'clone') {
      $this->r['html'] = (new SdPageBlockItems($this->r['data']['ownPageId']))->getItemF($this->r['data']['refId'])['html'];
      return $this;
    }
    $content = empty($this->r['content']) ? [] : $this->r['content'];
    if ($this->hasSeparateContent()) {
      if (empty($content[$ownPageId])) {
        $this->r['html'] = '';
        return $this;
      }
      else {
        $tplData = $content[$ownPageId];
      }
    } else {
      $tplData = $content;
    }
    $tplData = array_merge($tplData, ['ownPageId' => $ownPageId]);
    $this->r['html'] = $this->html($tplData);
    return $this;
  }

  protected function html(array $tplData) {
    $tplData['id'] = $this->r['id'];
    $tplData['data'] = $this->r['data'];
    $tplData['bannerId'] = $this->bannerId;
    return Tt()->getTpl("pb/{$this->r['data']['type']}", $tplData);
  }

  function editContent($ownPageId) {
    $item = $this->r;
    $ownPageId = empty($item['data']['separateContent']) ? $item['data']['ownPageId'] : $ownPageId;
    if ($this->hasSeparateContent()) $item['content'] = isset($item['content'][$ownPageId]) ? $item['content'][$ownPageId] : [];
    return $item;
  }

  function hasSeparateContent() {
    return !empty($this->r['data']['separateContent']);
  }

  function isShow($ownPageId) {
    if ($this->r['data']['ownPageId'] == $ownPageId) return true;
    if ($this->hasSeparateContent()) return true;
    return $this->isGlobal();
  }

  function isGlobal() {
    return true;
  }

  function hasAnimation() {
    return !empty($this->r['data']['font']['blink']);
  }

}
