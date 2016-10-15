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

    $r = db()->selectRow('SELECT * FROM bcBlocks WHERE id=?d', $blockId);
    $r['blockId'] = $r['id'];
    $r['act'] = 'add';
    unset($r['id']);
    db()->insert('bcBlocks_undo_stack', $r);

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

  protected $undoId;

  function update($id, array $data) {
    if (empty($data['images']) and !$this->dataHasChanged($id, $data)) return;
    $r = $this->getItem($id);
    $r2 = $r->r;
    $r2['data'] = serialize($r2['data']);
    $r2['act'] = 'update';
    $r2['blockId'] = $r2['id'];
    unset($r2['id']);
    LogWriter::v('undo', "add undo to stack $id");

    $this->undoId = db()->insert('bcBlocks_undo_stack', $r2);
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
    $r = db()->selectRow('SELECT * FROM bcBlocks WHERE id=?d', $id);
    $r['blockId'] = $r['id'];
    $r['act'] = 'delete';
    unset($r['id']);
    $undoId = db()->insert('bcBlocks_undo_stack', $r);
    if (file_exists($this->imagesFolder($id))) {
      Dir::move($this->imagesFolder($id), $this->undoImagesFolder($undoId));
    }
    $this->db->query("DELETE FROM bcBlocks_redo_stack WHERE bannerId=?", $id);
    parent::delete($id);
  }

  function undo() {
    $lastUndoItem = $this->db->selectRow('SELECT * FROM bcBlocks_undo_stack WHERE bannerId=? ORDER BY id DESC LIMIT 1', $this->bannerId);
    if (!$lastUndoItem) return false;
    // ============================================
    if ($lastUndoItem['act'] == 'order') {
      $r['act'] = 'order';
      $this->db->insert('bcBlocks_redo_stack', [
        'bannerId' => $this->bannerId,
        'act'      => 'order',
        'data'     => serialize($this->getCurrentOrderState())
      ]);
    }
    elseif ($lastUndoItem['act'] != 'delete') {
      // for all actions excepting "delete" create redo item from existing block
      $r = $this->db->selectRow('SELECT * FROM bcBlocks WHERE id=?d', $lastUndoItem['blockId']);
      unset($r['id']);
      $r['act'] = $lastUndoItem['act'];
      $r['blockId'] = $lastUndoItem['blockId'];
      $redoId = $this->db->insert('bcBlocks_redo_stack', $r);
    }
    else {
      // for "delete" act create empty item
      $this->db->insert('bcBlocks_redo_stack', [
        'act'      => 'delete',
        'blockId'  => $lastUndoItem['blockId'],
        'bannerId' => $this->bannerId
      ]);
      $undoFolder = $this->undoImagesFolder($lastUndoItem['id']);
      if (file_exists($undoFolder)) {
        Dir::move($undoFolder, $this->imagesFolder($lastUndoItem['blockId']));
      }
    }
    // ============================================
    $this->db->query('DELETE FROM bcBlocks_undo_stack WHERE id=?', $lastUndoItem['id']);
    // ============================================
    if ($lastUndoItem['act'] == 'order') {
      $orderKeys = unserialize($lastUndoItem['data']);
      $r['orderKeys'] = $orderKeys;
      $this->_updateOrder($orderKeys);
    }
    elseif ($lastUndoItem['act'] == 'add') {
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
        // act = update
        $r = $lastUndoItem;
        unset($r['act']);
        unset($r['id']);
        unset($r['blockId']);
        $this->db->update('bcBlocks', $lastUndoItem['blockId'], $r);
        // images
        $undoData = unserialize($lastUndoItem['data']);
        if (empty($undoData['images'])) {
          Dir::remove($this->imagesFolder($lastUndoItem['blockId']));
        }
        else {
          $undoFolder = $this->undoImagesFolder($lastUndoItem['id']);
          if (file_exists($undoFolder)) {
            Dir::copy($this->imagesFolder($blockId), $this->redoImagesFolder($redoId));
            Dir::copy($this->undoImagesFolder($lastUndoItem['id']), $this->imagesFolder($blockId));
          }
        }
      }
      $r = $this->getItemF($blockId);
      $r['act'] = $lastUndoItem['act'];
      $r['blockId'] = $blockId;
    }
    $r['lastItem'] = !(bool)$this->db->selectCell('SELECT COUNT(*) FROM bcBlocks_undo_stack WHERE bannerId=?', $this->bannerId);
    return $r;
  }

  function redo() {
    $lastRedoItem = $this->db->selectRow('SELECT * FROM bcBlocks_redo_stack WHERE bannerId=? ORDER BY id DESC LIMIT 1', $this->bannerId);
    if (!count($lastRedoItem)) return false;
    $lastRedoItemId = $lastRedoItem['id'];
    if ($lastRedoItem['act'] == 'add' or $lastRedoItem['act'] == 'order') {
      unset($lastRedoItem['id']);
      $this->db->insert('bcBlocks_undo_stack', $lastRedoItem);
    }
    else {
      $r = db()->selectRow('SELECT * FROM bcBlocks WHERE id=?d', $lastRedoItem['blockId']);
      $r['blockId'] = $r['id'];
      $r['act'] = $lastRedoItem['act'];
      unset($r['id']);
      $undoId = db()->insert('bcBlocks_undo_stack', $r);
    }
    if ($lastRedoItem['act'] == 'delete') {
      $r = [];
      $r['id'] = $lastRedoItem['blockId'];
      $r['act'] = $lastRedoItem['act'];
      $this->db->query('DELETE FROM bcBlocks WHERE id=?d', $lastRedoItem['blockId']);
      if (file_exists($this->imagesFolder($lastRedoItem['blockId']))) {
        Dir::move($this->imagesFolder($lastRedoItem['blockId']), $this->undoImagesFolder($undoId));
      }
    }
    elseif ($lastRedoItem['act'] == 'order') {
      $orderKeys = unserialize($lastRedoItem['data']);
      $this->_updateOrder($orderKeys);
      $r = [];
      $r['act'] = 'order';
      $r['orderKeys'] = $orderKeys;
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
        $lastRedoBlockId = $lastRedoItem['blockId'];
        unset($lastRedoItem['id']);
        unset($lastRedoItem['blockId']);
        unset($lastRedoItem['act']);
        $this->db->update('bcBlocks', $lastRedoBlockId, $lastRedoItem);
        // redo images
        $data = unserialize($lastRedoItem['data']);
        if (!empty($data['images'])) {
          if (file_exists($this->redoImagesFolder($lastRedoItemId))) {
            // copy current images to undo folder
            Dir::copy($this->imagesFolder($blockId), $this->undoImagesFolder($undoId));
            Dir::copy($this->redoImagesFolder($lastRedoItemId), $this->imagesFolder($blockId));
          }
        }
      }
      $r = $this->getItemF($blockId);
      $r['act'] = $act;
    }
    $this->db->query('DELETE FROM bcBlocks_redo_stack WHERE id=?', $lastRedoItemId);
    $r['lastItem'] = !(bool)$this->db->selectCell('SELECT COUNT(*) FROM bcBlocks_redo_stack WHERE bannerId=?', $this->bannerId);
    return $r;
  }

  protected function getCurrentOrderState() {
    return db()->selectCol("SELECT id AS ARRAY_KEY, orderKey FROM bcBlocks WHERE bannerId=?d", $this->bannerId);
  }

  function updateOrder(array $blockIdToOrderKey) {
    db()->insert('bcBlocks_undo_stack', [
      'act'      => 'order',
      'data'     => serialize($this->getCurrentOrderState()),
      'bannerId' => $this->bannerId
    ]);
    $this->_updateOrder($blockIdToOrderKey);
  }

  protected function _updateOrder(array $blockIdToOrderKey) {
    foreach ($blockIdToOrderKey as $blockId => $orderKey) {
      db()->query("UPDATE bcBlocks SET orderKey=?d WHERE id=?d", $orderKey, $blockId);
    }
  }

  function updateMultiImages($blockId, $imageN, $uploadedFile) {
    $block = $this->getItem($blockId);
    // .......................
    $images = empty($block['data']['images']) ? [] : $block['data']['images'];
    $images[$imageN] = '/'.UPLOAD_DIR."/{$this->name}/multi".'/'.$blockId.'/'.$imageN.'.jpg';
    output($images[$imageN]);
    $this->update($blockId, [
      'images' => $images
    ], true);
    // .......................
    if (!empty($block['data']['images'])) {
//      die2([
//        filesize('C:/www/refactor/ngn-env/bc/lib/test.png'),
//        filesize(WEBROOT_PATH.$block['data']['images'][0])
//      ]);
      $this->addUndoImages($this->undoId, $block['data']['images']);
    }
    // -----------------------
    $file = Dir::make($this->imagesFolder($blockId)).'/'.$imageN.'.jpg';
    copy($uploadedFile, $file);
    // ..
    return $images;
  }

  function imagesFolder($blockId) {
    return UPLOAD_PATH."/{$this->name}/multi".'/'.$blockId;
  }

  function undoImagesFolder($undoId) {
    Misc::checkEmpty($undoId);
    return DATA_PATH.'/sdUndo/'.$this->bannerId.'/'.$undoId;
  }

  function redoImagesFolder($redoId) {
    Misc::checkEmpty($redoId);
    return DATA_PATH.'/sdRedo/'.$this->bannerId.'/'.$redoId;
  }

  protected function addUndoImages($undoId, $images) {
    $currentUndoItemFolder = Dir::make($this->undoImagesFolder($undoId));
    foreach ($images as $path) {
      $newFile = $currentUndoItemFolder.'/'.basename($path);
//      filesize(WEBROOT_PATH.$path),
//      filesize(WEBROOT_PATH.$path)
      copy(WEBROOT_PATH.$path, $newFile);
    }
  }


  protected function redoImages($blockId, $undoId) {
    $undoFolder = $this->undoImagesFolder($undoId);
    if (file_exists($undoFolder)) {
      Dir::copy($this->undoImagesFolder($undoId), $this->imagesFolder($blockId));
    }
  }

}
