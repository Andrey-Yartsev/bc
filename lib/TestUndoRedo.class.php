<?php

class TestUndoRedo extends ProjectTestCase {

  protected $bannerId;

  /**
   * @var SdPageBlockItems
   */
  protected $blocks;

  const TEST_USER_ID = 1;

  protected function assertAct($blockId, $type, $act) {
    $r = db()->selectRow('SELECT * FROM bcBlocks_'.$type.'_stack WHERE blockId=?d ORDER BY id DESC LIMIT 1', $blockId);
    $this->assertTrue($r['act'] === $act, "$type: act={$r['act']}, expecting $act");
  }

  protected function setUp() {
    Auth::$auth = DbModelCore::get('users', TestUndoRedo::TEST_USER_ID);
    $this->bannerId = BcCore::createBanner('125 x 125', 'test', TestUndoRedo::TEST_USER_ID);
    $this->blocks = new SdPageBlockItems($this->bannerId);
  }

  protected function tearDown() {
    db()->query("DELETE FROM bcBanners WHERE id={$this->bannerId}");
    db()->query("DELETE FROM bcBlocks WHERE bannerId={$this->bannerId}");
    db()->query("DELETE FROM bcBlocks_redo_stack WHERE bannerId={$this->bannerId}");
    db()->query("DELETE FROM bcBlocks_undo_stack WHERE bannerId={$this->bannerId}");
  }

  protected function create() {
    return $this->blocks->create([
      'data' => [
        'type'     => 'animatedText',
        'position' => [
          'x' => 0,
          'y' => 0
        ],
      ]
    ]);
  }

//  function testCreateUndo() {
//    $id = $this->create();
//    $this->assertAct($id, 'undo', 'add');
//    $this->blocks->undo();
//    $this->assertAct($id, 'redo', 'add');
//    $this->assertFalse((bool)db()->selectRow("SELECT * FROM bcBlocks WHERE id=$id"));
//  }
//
//  function testCreateUndoRedo() {
//    $id = $this->create();
//    $this->blocks->undo();
//    $this->blocks->redo();
//    $this->assertTrue((bool)db()->selectRow("SELECT * FROM bcBlocks WHERE id=$id"));
//    $this->assertTrue((bool)db()->selectRow("SELECT * FROM bcBlocks_undo_stack WHERE blockId=$id"));
//  }
//
//  function testUpdateAndCheckUndo() {
//    $id = $this->create();
//    $this->blocks->update($id, ['font' => ['text' => ['1']]]);
//    $this->assertAct($id, 'undo', 'update');
//  }
//
//  function testUpdateUndo() {
//    $id = $this->create();
//    $this->blocks->update($id, ['font' => ['text' => ['1']]]);
//    $this->blocks->undo();
//    $this->assertTrue(empty($this->blocks->getItemF($id)['data']['font']));
//  }
//
//  function testUpdateUndoRedo() {
//    $id = $this->create();
//    $this->blocks->update($id, ['font' => ['text' => ['1']]]);
//    $this->blocks->undo();
//    $this->blocks->redo();
//    $this->assertFalse($this->blocks->getItemF($id)['data']['font']['text'] == 1);
//  }
//
//  function testUpdateUndoRedoUndo() {
//    $id = $this->create();
//    $this->blocks->update($id, ['font' => ['text' => ['1']]]);
//    $this->blocks->undo();
//    $this->blocks->redo();
//    $this->blocks->undo();
//    $this->assertTrue(empty($this->blocks->getItemF($id)['data']['font']));
//  }
//
//  function testUpdateUndoRedoUndoRedo() {
//    $id = $this->create();
//    $this->blocks->update($id, ['font' => ['text' => ['1']]]);
//    $this->blocks->undo();
//    $this->blocks->redo();
//    $this->blocks->undo();
//    $this->blocks->redo();
//    $this->assertFalse($this->blocks->getItemF($id)['data']['font']['text'] == 1);
//  }
//
//  function testDeleteUndoRedo() {
//    $id = $this->create();
//    $this->blocks->delete($id);
//    $this->assertAct($id, 'undo', 'delete');
//    $this->blocks->undo();
//    $this->assertAct($id, 'redo', 'delete');
//    $this->assertTrue((bool)$this->blocks->getItemF($id), 'item exists');
//    $this->blocks->redo();
//    $this->assertFalse((bool)db()->selectRow('SELECT * FROM bcBlocks WHERE id=?d', $id), 'delete on redo');
//  }
//
//  function testDeleteUndoRedoUndo() {
//    $id = $this->create();
//    $this->blocks->delete($id);
//    $this->assertAct($id, 'undo', 'delete');
//    $this->blocks->undo();
//    $this->assertAct($id, 'redo', 'delete');
//    $this->blocks->redo();
//    $this->assertAct($id, 'undo', 'delete');
//    $this->blocks->undo(true);
//    $this->assertTrue((bool)$this->blocks->getItemF($id), 'item exists');
//  }
//
//  function testDeleteCreateUndoUndo() {
//    $id = $this->create();
//    $this->blocks->delete($id);
//    $id2 = $this->create();
//    $this->blocks->undo();
//    $this->blocks->undo();
//    $this->assertFalse((bool)db()->selectRow('SELECT * FROM bcBlocks WHERE id=?d', $id2), 'item exists');
//    $this->assertTrue((bool)db()->selectRow('SELECT * FROM bcBlocks WHERE id=?d', $id), 'item exists');
//  }
//
//  function testOrderUndoRedo() {
//    $id1 = $this->create();
//    $id2 = $this->create();
//    $r1 = db()->selectCol("SELECT id AS ARRAY_KEY, orderKey FROM bcBlocks WHERE id IN ($id1, $id2)");
//    $newOrder = [
//      $id1 => '1',
//      $id2 => '2'
//    ];
//    $this->blocks->updateOrder($newOrder);
//    $this->blocks->undo();
//    $r2 = db()->selectCol("SELECT id AS ARRAY_KEY, orderKey FROM bcBlocks WHERE id IN ($id1, $id2)");
//    $this->assertTrue($r1 === $r2);
//    $this->blocks->redo();
//    $r2 = db()->selectCol("SELECT id AS ARRAY_KEY, orderKey FROM bcBlocks WHERE id IN ($id1, $id2)");
//    $this->assertTrue($r2 === $newOrder);
//  }

  function testUpdateImages() {
    $id = $this->create();
    $fs1 = filesize(__DIR__.'/test.png');
    $fs2 = filesize(__DIR__.'/test2.png');
    $this->blocks->updateMultiImages($id, 0, __DIR__.'/test.png');

    $lastUndo = db()->selectRow('SELECT * FROM bcBlocks_undo_stack WHERE blockId=?d ORDER BY id DESC LIMIT 1', $id);
    $data = unserialize($lastUndo['data']);
    $this->assertTrue(
      empty($data['images']),
      'undo last item has empty images data'
    );
    $this->assertFalse(
      (bool)glob($this->blocks->undoImagesFolder($lastUndo['id']).'/*'),
      'no images in last undo item folder'
    );

    $r = $this->blocks->updateMultiImages($id, 0, __DIR__.'/test2.png');
    $lastUndo = db()->selectRow('SELECT * FROM bcBlocks_undo_stack WHERE blockId=?d ORDER BY id DESC LIMIT 1', $id);
    $this->assertTrue(
      filesize(glob($this->blocks->undoImagesFolder($lastUndo['id']).'/*')[0]) == $fs1,
      'images in undo folder has the size of first update image'
    );

    $this->blocks->undo();
    $this->assertTrue(
      filesize(WEBROOT_PATH.$r[0]) == $fs1,
      'image reverted after undo'
    );

    $lastRedo = db()->selectRow('SELECT * FROM bcBlocks_redo_stack WHERE blockId=?d ORDER BY id DESC LIMIT 1', $id);
    $this->assertTrue(
      filesize(glob($this->blocks->redoImagesFolder($lastRedo['id']).'/*')[0]) == $fs2,
      'redo stack has image from previous update'
    );

    // make redo
    $this->blocks->redo();
    $this->assertTrue(
      filesize(WEBROOT_PATH.$r[0]) == $fs2,
      'second image placed in block images folder after redo'
    );

    $this->blocks->undo();
    $this->assertTrue(
      filesize(WEBROOT_PATH.$r[0]) == $fs1,
      'first image placed in block images folder after redo'
    );

    $this->blocks->redo();
    $this->assertTrue(
      filesize(WEBROOT_PATH.$r[0]) == $fs2,
      'second image placed in block images folder after repeated redo'
    );

    $this->blocks->delete($id);
    $lastUndo = db()->selectRow('SELECT * FROM bcBlocks_undo_stack WHERE blockId=?d ORDER BY id DESC LIMIT 1', $id);
    $file = glob($this->blocks->undoImagesFolder($lastUndo['id']).'/*')[0];
    $this->assertTrue(
      filesize($file) == $fs2,
      'file exists in undo folder after block was deleted'
    );

    $this->blocks->undo();
    $this->assertTrue(
      filesize(WEBROOT_PATH.$r[0]) == $fs2,
      'image exists after deletion undo'
    );

    $this->assertFalse(
      file_exists($file),
      'undo folder is empty'
    );

    $this->blocks->redo();
    $lastUndo = db()->selectRow('SELECT * FROM bcBlocks_undo_stack WHERE blockId=?d ORDER BY id DESC LIMIT 1', $id);
    $this->assertTrue(
      file_exists(glob($this->blocks->undoImagesFolder($lastUndo['id']).'/*')[0]),
      'image exists in undo folder after deletion redo'
    );
  }

}