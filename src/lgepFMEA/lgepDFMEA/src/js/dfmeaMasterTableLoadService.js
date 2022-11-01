export const getData = (tableList, columns) => {
  const tableData = tableList.map((rowInfo) => {
    const row = columns.reduce((prev, col) => {
      const columnInfo = { [col.name]: _getValue(rowInfo, col.title) };
      return { ...prev, ...columnInfo };
    }, '');

    return { ...row, props: { ...rowInfo } };
  });
  return tableData;
};

const _getValue = (rowInfo, prop) => {
  if (rowInfo[prop]) {
    return rowInfo[prop].value;
  }
  return '';
};

