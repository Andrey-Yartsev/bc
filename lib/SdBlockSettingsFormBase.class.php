<?php

abstract class SdBlockSettingsFormBase extends Form {

  protected $items, $id, $block;

  function __construct($id, SdContainerItems $items) {
    $this->items = $items;
    $this->id = $id;
    $this->block = $this->items->getItem($this->id);
    if (!empty($this->block['data']['font'])) {
      $this->defaultData = $this->block['data']['font'];
    }
    $this->options['title'] = Locale::get('layerSettings', 'sd');
    $this->options['filterEmpties'] = true;
    parent::__construct($this->getInitFields());
  }

  abstract protected function getInitFields();

  protected function cleanUndoRedo() {
    db()->query(<<<SQL
INSERT INTO bcBlocks_undo_stack
SELECT NULL, dateCreate, dateUpdate, orderKey, content, data, bannerId, userId,
  "update" AS act,
  id AS blockId
FROM bcBlocks WHERE bcBlocks.id=?
SQL
      , $this->id);
    db()->query('DELETE FROM bcBlocks_redo_stack WHERE bannerId=?', $this->id);
  }

  protected function _update(array $data) {
    $this->items->update($this->id, ['font' => $data]);


  }

}