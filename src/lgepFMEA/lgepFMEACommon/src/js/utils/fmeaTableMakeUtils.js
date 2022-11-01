import uwPropertySvc from 'js/uwPropertyService';
import { getLangIndex } from 'js/utils/fmeaCommonUtils';

export const makeVmPropertyOnTextTable = (
  rev,
  dbValueProp,
  displayProp = dbValueProp
) => {
  try {
    const dbValue = rev.props[dbValueProp].dbValues[0];
    const displayValue = rev.props[displayProp].dbValues[0];
    const vmProperty = uwPropertySvc.createViewModelProperty(
      dbValueProp,
      dbValue,
      'STRING',
      dbValue,
      [displayValue]
    );
    vmProperty.uid = rev.uid;
    uwPropertySvc.setIsEditable(vmProperty, true);
    uwPropertySvc.setIsPropertyModifiable(vmProperty, true);
    return vmProperty;
  } catch (e) {
    //console.log('makeVmPropertyOnTextTable', e);
  }
};

/**
 * @param {*} prop
 * @param {*} dbValue
 * @param {*} dispValue
 * @returns
 */
export const makeVmProperty = (prop, dbValue, dispValue = dbValue) => {
  const vmProperty = uwPropertySvc.createViewModelProperty(
    prop,
    dbValue,
    'STRING',
    dbValue,
    [dispValue]
  );
  uwPropertySvc.setIsEditable(vmProperty, true);
  uwPropertySvc.setIsPropertyModifiable(vmProperty, true);
  return vmProperty;
};

export const makeEmptyProperty = () => {
  const vmProperty = uwPropertySvc.createViewModelProperty(
    '',
    '',
    'STRING',
    '',
    ['displayValue']
  );
  vmProperty.uid = null;
  uwPropertySvc.setIsEditable(vmProperty, true);
  uwPropertySvc.setIsPropertyModifiable(vmProperty, true);
  return vmProperty;
};

export const getHeaderData = (columnArr, width = 150) => {
  const localIndex = getLangIndex();
  return _getLangColumns(columnArr, localIndex, width);
};

export const getLongHeaderData = (columnArr) => {
  const localIndex = getLangIndex();
  return _getLongClumns(columnArr, localIndex);
};

const _getLangColumns = (columnArr, langIndex, width) => {
  const columnData = columnArr.map((column, index) => {
    return {
      name: column[0],
      propertyName: column[0],
      displayName: column[langIndex],
      typeName: 'String',
      width: width,
      modifiable: false,
      enableColumnResizing: true,
      enableColumnMoving: false,
    };
  });
  return columnData;
};

const _getLongClumns = (columnArr, langIndex) => {
  const columnData = columnArr.map((column, index) => {
    return {
      name: column[0],
      propertyName: column[0],
      displayName: column[langIndex],
      typeName: 'String',
      width: index === 0 ? 550 : 150,
      modifiable: false,
      enableColumnResizing: true,
      enableColumnMoving: false,
    };
  });
  return columnData;
};
