<?php

class BcRender {

  protected $items, $bannerId;

  function __construct($bannerId) {
    $this->bannerId = $bannerId;
    $this->items = new SdPageBlockItems($bannerId);
  }

  function render() {
    if ($this->items->hasAnimation()) {
      $path = $this->renderAnimated();
    } else {
      $path = $this->renderStatic();
    }
    db()->update('bcBanners', $this->bannerId, ['dateRender' => Date::db()]);
    return $path;
  }

  protected function renderStatic() {
    $cufonBlocksNumber = $this->items->cufonBlocksNumber();
    Dir::make(UPLOAD_PATH.'/banner/static');
    $cmd = '/usr/local/bin/phantomjs '.SD_PATH.'/phantomjs/genStatic.js '.PROJECT_KEY.' '.SITE_DOMAIN.' '. //
      $this->bannerId.' '.Config::getVar('adminKey').' '.WEBROOT_PATH.' '.$cufonBlocksNumber;
    system($cmd);
    $path = 'banner/static/'.$this->bannerId.'.png';
    $file = UPLOAD_PATH.'/'.$path;
    $src = imagecreatefrompng($file);
    $size = BcCore::getSize($this->bannerId);
    $src = imagecrop($src, [
      'width'  => $size['w'],
      'height' => $size['h'],
      'x'      => 1300 / 2 - $size['w'] / 2,
      'y'      => 100
    ]);
    imagepng($src, $file, 4);
    db()->update('bcBanners', $this->bannerId, ['dateRender' => Date::db()]);
    system("/home/developer/bin/pngquant -f --speed 1 --quality=85-95 $file -o $file");
    return $path;
  }

  protected function renderAnimated() {
    $cufonBlocksNumber = $this->items->cufonBlocksNumber();
    $framesCount = $this->items->maxFramesNumber();
    $sdPath = SD_PATH;
    $tempFolder = UPLOAD_PATH.'/banner/animated/temp/'.$this->bannerId;
    Dir::make($tempFolder);
    Dir::clear($tempFolder);
    $cmd = '/usr/local/bin/phantomjs '.$sdPath.'/phantomjs/genAnimated.js '. //
      PROJECT_KEY.' '.SITE_DOMAIN.' '.$this->bannerId.' '.$framesCount.' '.Config::getVar('adminKey').' '. //
      WEBROOT_PATH.' '.$cufonBlocksNumber;
    system($cmd);
    $size = BcCore::getSize($this->bannerId);
    $x = 1300 / 2 - $size['w'] / 2;
    foreach (glob($tempFolder.'/*') as $file) {
      $src = imagecreatefrompng($file);
      $src = imagecrop($src, [
        'width'  => $size['w'],
        'height' => $size['h'],
        'x'      => $x,
        'y'      => 100
      ]);
      imagepng($src, $file, 4);
    }
    // for debug
    // $this->ajaxOutput = '<img src="/'.UPLOAD_DIR.'/'.'/banner/animated/temp/'.$this->bannerId.'/1.png?'.Misc::randString().'">';
    // return
    Dir::make(UPLOAD_PATH.'/banner/animated/result');
    $frames = [];
    $framed = [];
    foreach (glob($tempFolder.'/*') as $file) {
      $image = imagecreatefrompng($file);
      ob_start();
      imagegif($image);
      $frames[] = ob_get_contents();
      $framed[] = 150; // delay
      ob_end_clean();
    }
    $gif = new GifEncoder($frames, $framed, 0, 2, 0, 0, 0, 'bin');
    $path = 'banner/animated/result/'.$this->bannerId.'.gif';
    output('Generating gif "'.UPLOAD_PATH.'/'.$path.'"');
    file_put_contents(UPLOAD_PATH.'/'.$path, $gif->getAnimation());
    return $path;
  }

}
