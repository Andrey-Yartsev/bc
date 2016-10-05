<?php

class SdPageBlockItems extends SdContainerItems {

  public $name;

  protected $ownPageId = 1, $bannerId;

  function __construct($bannerId) {
    Misc::checkEmpty($bannerId);
    $this->bannerId = $bannerId;
    $this->name = 'sd/pageBlocks/'.$bannerId;
    parent::__construct('bcBlocks');
    $this->cond->addF('bannerId', $this->bannerId);
  }

  function create(array $data) {
    $items = $this->getItems();
    if (!empty($data['data']['single'])) {
      foreach ($items as $v) {
        if ($v['data']['type'] == $data['data']['type']) {
          $this->delete($v['id']);
        }
      }
    }
    if (!empty($data['data']['bottom'])) {
      // Делаем orderKey максимальным чтобы блок встал сверху
      $orderKey = 0;
      foreach ($items as $v) {
        if ($v['orderKey'] >= $orderKey) $orderKey++;
      }
    }
    else {
      // Делаем orderKey минимальным чтобы блок встал сверху
      $orderKey = 0;
      foreach ($this->getItems() as $v) {
        if ($v['orderKey'] <= $orderKey) $orderKey--;
      }
    }
    $data['userId'] = Auth::get('id');
    $data['bannerId'] = $this->bannerId;
    $data['orderKey'] = $orderKey;
    $blockId = parent::create($data);
    $this->db->query(<<<SQL
INSERT INTO bcBlocks_undo_stack
SELECT NULL, dateCreate, dateUpdate, orderKey, content, data, bannerId, userId,
  "add" AS act,
  id AS blockId
FROM bcBlocks WHERE bcBlocks.id=$blockId
SQL
    );
    $this->db->query('DELETE FROM bcBlocks_redo_stack WHERE bannerId=?', $this->bannerId);
    return $blockId;
  }

  function fixTopOrder() {
    $items = $this->getItems();
    $orderKey = 0;
    foreach ($items as $v) {
      if ($v['orderKey'] >= $orderKey) $orderKey--;
    }
    foreach ($items as $v) {
      if (!empty($v['data']['top'])) {
        db()->update('bcBlocks', $v['id'], ['orderKey' => $orderKey]);
      }
    }
  }

  protected function dataHasChanged($id, $data) {
    if (!$currentData = db()->selectCell("SELECT data FROM bcBlocks WHERE bcBlocks.id=?", $id)) {
      return false;
    }
    $currentData = unserialize($currentData);
    foreach ($data as $k => $v) {
      if (!isset($currentData[$k])) return true;
      if ($currentData[$k] != $v) return true;
    }
    return false;
  }

  function update($id, array $data) {
    if (!$this->dataHasChanged($id, $data)) return;
    db()->query(<<<SQL
INSERT INTO bcBlocks_undo_stack
SELECT NULL, dateCreate, dateUpdate, orderKey, content, data, bannerId, userId,
  "update" AS act,
  id AS blockId
FROM bcBlocks WHERE bcBlocks.id=?
SQL
      , $id);
    db()->query('DELETE FROM bcBlocks_redo_stack WHERE bannerId=?', $this->bannerId);
    $this->_update($id, $data);
  }

  function _update($id, array $data) {
    $item = $this->getItem($id);
    $item['data'] = array_merge($item['data'], $data);
    parent::update($id, $item->r);
    db()->query('UPDATE bcBanners SET dateUpdate=? WHERE id=?', Date::db(), $this->bannerId);
  }

  function updateContent($id, $content, $replace = false) {
    $item = $this->getItem($id);
    $_content = $item['content'];
    if ($item->hasSeparateContent()) {
      if ($replace) $_content = [];
      $_content[111] = $content;
    }
    else {
      $_content = $content;
    }
    $this->itemSubKey = false;
    parent::update($id, ['content' => $_content], true);
  }

  function updateSeparateContent($id, $separateContent) {
    $separateContent = (bool)$separateContent;
    $item = $this->getItem($id);
    if ($separateContent) {
      if (!empty($item['data']['separateContent'])) return;
      $this->update($id, ['separateContent' => true]);
      $this->updateContent($id, $item['content'], true);
    }
    else {
      if (empty($item['data']['separateContent'])) return;
      $this->remove($id, 'separateContent', 'data');
      $this->updateContent($id, Arr::first($item['content']));
    }
  }

  protected $itemSubKey = false;

  protected function mergeItem(&$item, $data) {
    if (!$this->itemSubKey) parent::mergeItem($item, $data);
    $item[$this->itemSubKey] = isset($item[$this->itemSubKey]) ? array_merge($item[$this->itemSubKey], $data) : $data;
  }

  function updateGlobal($id, $global) {
    $global = (bool)$global;
    if ($this->getItem($id)->getContainer()['global'] == $global) {
      $this->remove($id, 'global', 'data');
    }
    else {
      $this->update($id, ['global' => $global]);
    }
  }

  function getItemF($id) {
    return $this->getItem($id)->prepareHtml($this->ownPageId)->r;
  }

  function getItemE($id) {
    return $this->getItem($id)->editContent($this->ownPageId);
  }

  function getItem($id) {
    if (($item = parent::getItem($id)) === false) throw new EmptyException("id=$id");
    if (!isset($item['data']['type'])) throw new Exception("no type in block $id");
    return SdPageBlockItem::factory($item, $this->bannerId);
  }

  function getItemD($id) {
    return $this->getItem($id)['data'];
  }

  function getItemsF() {
    $r = [];
    foreach (parent::getItems() as $v) {
      $item = SdPageBlockItem::factory($v, $this->bannerId)->prepareHtml($this->ownPageId);
      $r[] = $item->r;
    }
    return $r;
  }

  function getItemsFF() {
    return array_filter(parent::getItems(), function ($v) {
      return $this->ownPageId == $v['data']['ownPageId'];
    });
  }

  function hasAnimation() {
    foreach (parent::getItems() as $v) {
      if (SdPageBlockItem::factory($v, $this->bannerId)->hasAnimation()) {
        return true;
      }
    }
    return false;
  }

  function maxFramesNumber() {
    $maxFramesNumber = 1;
    foreach (parent::getItems() as $v) {
      $framesNumber = SdPageBlockItem::factory($v, $this->bannerId)->framesNumber();
      if ($framesNumber > $maxFramesNumber) {
        $maxFramesNumber = $framesNumber;
      }
    }
    return $maxFramesNumber;
  }

  function cufonBlocksNumber() {
    $n = 0;
    foreach (parent::getItems() as $v) {
      if (SdPageBlockItem::factory($v, $this->bannerId)->hasCufon()) {
        $n++;
      }
    }
    return $n;
  }

  function delete($id) {
    db()->query(<<<SQL
INSERT INTO bcBlocks_undo_stack
SELECT NULL, dateCreate, dateUpdate, orderKey, content, data, bannerId, userId,
  "delete" AS act,
  id AS blockId
FROM bcBlocks WHERE bcBlocks.id=?
SQL
      , $id);
    $this->db->query("DELETE FROM bcBlocks_redo_stack WHERE bannerId=?", $id);
    parent::delete($id);
    Dir::remove(UPLOAD_PATH.'/'.$this->name.'/multi/'.$id);
  }

  function undo() {
    $lastUndoItem = $this->db->selectRow('SELECT * FROM bcBlocks_undo_stack WHERE bannerId=? ORDER BY id DESC LIMIT 1', $this->bannerId);
    if (!$lastUndoItem) return false;
    // ============================================
    if ($lastUndoItem['act'] != 'delete') {
      // for all actions excepting "delete" create redo item from existing block
      $r = $this->db->selectRow('SELECT * FROM bcBlocks WHERE id=?d', $lastUndoItem['blockId']);
      unset($r['id']);
      $r['act'] = $lastUndoItem['act'];
      $r['blockId'] = $lastUndoItem['blockId'];
      $this->db->insert('bcBlocks_redo_stack', $r);
    } else {
      // for "delete" create empty item
      $this->db->insert('bcBlocks_redo_stack', [
        'act' => 'delete',
        'blockId' => $lastUndoItem['blockId'],
        'bannerId' => $this->bannerId
      ]);
    }
    // ============================================
    $this->db->query('DELETE FROM bcBlocks_undo_stack WHERE id=?', $lastUndoItem['id']);
    if ($lastUndoItem['act'] == 'add') {
      $this->db->query('DELETE FROM bcBlocks WHERE id=?', $lastUndoItem['blockId']);
    }
    else {
      $blockId = $lastUndoItem['blockId'];
      if ($lastUndoItem['act'] == 'delete') {
        $record = $lastUndoItem;
        $record['id'] = $lastUndoItem['blockId'];
        unset($record['blockId']);
        unset($record['act']);
        $this->db->query('INSERT INTO bcBlocks SET ?a', $record);
      }
      else {
        // act=update
        $this->db->query('UPDATE bcBlocks SET orderKey=?, content=?, data=?, dateUpdate=? WHERE id=?', //
          $lastUndoItem['orderKey'], $lastUndoItem['content'], $lastUndoItem['data'], $lastUndoItem['dateUpdate'], $lastUndoItem['blockId']);
      }
      //die2('-');
      $r = $this->getItemF($blockId);
      $r['act'] = $lastUndoItem['act'];
    }
    $r['lastItem'] = !(bool)$this->db->selectCell('SELECT COUNT(*) FROM bcBlocks_undo_stack WHERE bannerId=?', $this->bannerId);
    return $r;
  }

  function redo() {
    $lastRedoItem = $this->db->selectRow('SELECT * FROM bcBlocks_redo_stack WHERE bannerId=? ORDER BY id DESC LIMIT 1', $this->bannerId);
    if (!count($lastRedoItem)) return false;
    $lastRedoItemId = $lastRedoItem['id'];
    if ($lastRedoItem['act'] == 'add') {
      unset($lastRedoItem['id']);
      $this->db->insert('bcBlocks_undo_stack', $lastRedoItem);
    } else {
      $this->db->query(<<<SQL
INSERT INTO bcBlocks_undo_stack
SELECT NULL, dateCreate, dateUpdate, orderKey, content, data, bannerId, userId,
  "{$lastRedoItem['act']}" AS act,
  id AS blockId
FROM bcBlocks WHERE id=?d
SQL
        , $lastRedoItem['blockId']);

    }

    if ($lastRedoItem['act'] == 'delete') {
      $r = [];
      $r['id'] = $lastRedoItem['blockId'];
      $r['act'] = $lastRedoItem['act'];

      $this->db->query('DELETE FROM bcBlocks WHERE id=?d', $lastRedoItem['blockId']);
    }
    else {
      $blockId = $lastRedoItem['blockId'];
      $act = $lastRedoItem['act'];
      if ($lastRedoItem['act'] == 'add') {
        $lastRedoItem['id'] = $lastRedoItem['blockId'];
        unset($lastRedoItem['blockId']);
        unset($lastRedoItem['act']);
        $this->db->query('INSERT INTO bcBlocks SET ?a', Arr::serialize($lastRedoItem));
      }
      else {
        // act = update
        $this->db->query('UPDATE bcBlocks SET orderKey=?, content=?, data=?, dateUpdate=?', //
          $lastRedoItem['orderKey'], $lastRedoItem['content'], $lastRedoItem['data'], $lastRedoItem['dateUpdate'], $lastRedoItem['blockId']);
      }
      $r = $this->getItemF($blockId);
      $r['act'] = $act;
    }
    $this->db->query('DELETE FROM bcBlocks_redo_stack WHERE id=?', $lastRedoItemId);
    $r['lastItem'] = !(bool)$this->db->selectCell('SELECT COUNT(*) FROM bcBlocks_redo_stack WHERE bannerId=?', $this->bannerId);
    return $r;
  }

}