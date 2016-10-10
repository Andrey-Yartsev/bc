<?php

class BcCore {

  static function createBanner($size, $title) {
    return db()->insert('bcBanners', [
      'title' => $title,
      'size' => $size,
      'userId' => BcCore::user()['id']
    ]);
  }

  static function user() {
    $id = Misc::checkEmpty(Auth::get('id'), 'authUserId');
    return [
      'id' => $id
    ];
  }

  static function zukulDb() {
    return new Db('developer', 'aK211foDyBXwf2', 's0.toasterbridge.com', 'zukul');
  }

  static protected $size;

  static function getSize($bannerId) {
    if (isset(self::$size)) return self::$size;
    list($r['w'], $r['h']) = explode(' x ', db()->selectCell("SELECT size FROM bcBanners WHERE id=?d", $bannerId));
    return self::$size = $r;
  }

  protected static $hasAnimation;

  static function hasAnimation($bannerId) {
    if (isset(self::$hasAnimation)) return self::$hasAnimation;
    return self::$hasAnimation = (new SdPageBlockItems($bannerId))->hasAnimation();
  }

  static function getPath($bannerId) {
    return '/banner/'. //
      (self::hasAnimation($bannerId) ? //
        'animated/result/'.$bannerId.'.gif' : 'static/'.$bannerId.'.png');
  }

  static function copyBanner($bannerId, $userId = null, $bannerIdFrom) {
    // copy banner record
    db()->query("DELETE FROM bcBlocks WHERE bannerId=?d", $bannerIdFrom);
    db()->query("DELETE FROM bcBlocks_undo_stack WHERE bannerId=?d", $bannerIdFrom);
    db()->query("DELETE FROM bcBlocks_redo_stack WHERE bannerId=?d", $bannerIdFrom);
    if ($userId) $banner['userId'] = $userId;
    // copy block records
    foreach (db()->query("SELECT * FROM bcBlocks WHERE bannerId=?d", $bannerId) as $v) {
        error_log("ghch".$v['bannerId'],0);
      $v['dateCreate'] = $v['dateUpdate'] = Date::db();
      $v['bannerId'] = $bannerIdFrom;
      if ($userId) $v['userId'] = $userId;
      unset($v['id']);
      db()->insert('bcBlocks', $v);
    }
    // copy files
    $path = BcCore::getPath($bannerId);
    $newPath = preg_replace('/\/\d+\./', '/'.$bannerIdFrom.'.', BcCore::getPath($bannerId));
    File::delete(UPLOAD_PATH.$newPath);
    copy(UPLOAD_PATH.$path, UPLOAD_PATH.$newPath);
    return $bannerIdFrom;
  }
}