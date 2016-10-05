<?php

$expirationDate = Date::db(time()-60*60*6);
db()->query("DELETE FROM bcBlocks_redo_stack WHERE dateUpdate < ?", $expirationDate);
db()->query("DELETE FROM bcBlocks_undo_stack WHERE dateUpdate < ?", $expirationDate);
