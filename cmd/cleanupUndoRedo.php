<?php

db()->query("DELETE FROM bcBlocks_redo_stack");
db()->query("DELETE FROM bcBlocks_undo_stack");
