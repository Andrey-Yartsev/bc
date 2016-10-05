<?php

class SdFormFactory {

  /**
   * @param $id
   * @param SdPageBlockItems $items
   * @return SdPageBlockEditFormAbstract
   */
  static function edit($id, SdPageBlockItems $items) {
    $class = 'SdPageBlockEdit'.($items->getItemE($id)['data']['type'] == 'menu' ? 'Prop' : 'Content').'Form';
    return new $class($id, $items);
  }

  /**
   * @param $id
   * @param SdContainerItems $items
   * @return SdBlockSettingsFormBase
   */
  static function blockSettings($id, SdContainerItems $items) {
    $item = $items->getItemD($id);
    if (isset($item['type'])) {
      $type = $item['type'];
      $class = 'SdBlockSettingsForm'.ucfirst($type);
      $class = class_exists($class) ? $class : 'SdBlockSettingsFormBase';
    } else {
      $class = 'SdBlockSettingsFormBase';
    }
    return new $class($id, $items);
  }

  static function contentAndFontSettings($id, SdContainerItems $items) {
    $contentForm = self::edit($id, $items);
    $fontSettingsForm = self::blockSettings($id, $items);
    $form = new Form(array_merge($fontSettingsForm->fields, $contentForm->fields));
    return $form;
  }

}