// Copyrights for LG Electronics, 2022
// Written by MH.ROH

import app from 'app';

let exports = {};

/**
 * Properties
 */
// BusinessObject
const PROP_OBJECT_STRING = 'object_string';

// POM_application_object
const PROP_CREATION_DATE = 'creation_date';
const PROP_LAST_MOD_DATE = 'last_mod_date';
const PROP_LAST_MOD_USER = 'last_mod_user';
const PROP_OWNING_GROUP = 'owning_group';
const PROP_OWNING_USER = 'owning_user';

// WorkspaceObject
const PROP_DATE_RELEASED = 'date_released';
const PROP_FND0INPROCESS = 'fnd0InProcess';
const PROP_OBJECT_DESC = 'object_desc';
const PROP_OBJECT_NAME = 'object_name';
const PROP_OBJECT_TYPE = 'object_type';
const PROP_RELEASE_STATUS_LIST = 'release_status_list';

// Item, ItemRevision
const PROP_ITEM_ID = 'item_id';
const PROP_ITEM_REVISION_ID = 'item_revision_id';
const PROP_ITEMS_TAG = 'items_tag';

/**
 * Query
 */
const QUERY_GENERAL = 'General...';

/**
 * Relation
 */
const REL_IMAN_REFERENCE = 'IMAN_reference';
const REL_IMAN_SPECIFICATION = 'IMAN_specification';

/**
 * Type
 */
const TYPE_GROUP = 'Group';
const TYPE_ITEM = 'Item';
const TYPE_ITEMREVISION = 'ItemRevision';
const TYPE_ROLE = 'Role';
const TYPE_USER = 'User';

export default exports = {
  PROP_OBJECT_STRING,

  PROP_CREATION_DATE,
  PROP_LAST_MOD_DATE,
  PROP_LAST_MOD_USER,
  PROP_OWNING_GROUP,
  PROP_OWNING_USER,

  PROP_DATE_RELEASED,
  PROP_FND0INPROCESS,
  PROP_OBJECT_DESC,
  PROP_OBJECT_NAME,
  PROP_OBJECT_TYPE,
  PROP_RELEASE_STATUS_LIST,

  PROP_ITEM_ID,
  PROP_ITEM_REVISION_ID,
  PROP_ITEMS_TAG,

  QUERY_GENERAL,

  REL_IMAN_REFERENCE,
  REL_IMAN_SPECIFICATION,

  TYPE_GROUP,
  TYPE_ITEM,
  TYPE_ITEMREVISION,
  TYPE_ROLE,
  TYPE_USER,
};

/**
 * LGEP Constants
 */
app.factory('lgepTcConstants', () => exports);
