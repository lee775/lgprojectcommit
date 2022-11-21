import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/L2_checklistExcelConstants';
import * as constants2 from 'js/constants/fmeaConstants';

export const COLOR_COL_DESC = 'FF808080';
export const COLOR_RED = 'FFFF0000';
export const COLOR_GROUP_COLS = 'FFD9D9D9';

export const RNLINE = '\r\n';
export const NLINE = '\n';

export const FONT = 'LG스마트체2.0 Regular';
export const COL_FONT_STYLE = { name: FONT, size: 10 };
export const BORDER_STYLE = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};
export const ALIGNMENT_CENTER = {
  vertical: 'middle',
  horizontal: 'center',
};

export const GROUPS = [
  { value: '부품 전개 Group', cell: 'D1', color: COLOR_GROUP_COLS },
  { value: '부품 전개 Group', cell: 'D1', color: COLOR_GROUP_COLS },
  { value: '변경 내용 Group', cell: 'H1', color: COLOR_GROUP_COLS },
  { value: '예방 설계 Group', cell: 'L1', color: COLOR_GROUP_COLS },
  { value: '점검 SOD Group', cell: 'S1', color: COLOR_GROUP_COLS },
  {
    richText: [
      {
        text: `권고시정 조치 Group ${NLINE}`,
      },
      {
        font: {
          ...COL_FONT_STYLE,
          color: {
            argb: COLOR_RED,
          },
        },
        text: '※ 리뷰진행 시 or 진행 후 작성하는 구간',
      },
    ],
    merge: true,
    cell: 'U1',
    mergeCell: 'AB1',
    color: COLOR_GROUP_COLS,
  },
];

export const COL_GROUPS = [
  {
    value: '현재의 설계 관리',
    cell: 'L2',
    mergeCell: 'N2',
  },
  { value: '권고조치결과', cell: 'X2', mergeCell: 'AB2', color: 'FFFFCC00' },
];

// TODO ::WIDTH가 동적으로 바뀔 수 있을까...
export const COLUMNS = [
  { header: `구분${RNLINE}/모듈`, key: 'className', cell: 'B', width: 8 },
  {
    header: `부품(1레벨)${RNLINE}상위Assembly`,
    key: 'upperAssy',
    cell: 'C',
    width: 31.25,
  },
  {
    header: `부품(2레벨)${RNLINE}하위Assembly`,
    key: 'lowerAssy',
    cell: 'D',
    width: 31.25,
  },
  {
    header: `부품(3레벨)${RNLINE}단품`,
    key: constants2.SINGLE_ITEM,
    cell: 'E',
    width: 31.25,
  },
  { header: '기능', key: 'function', cell: 'F', width: 70 },
  {
    header: '요구사항/ Specification',
    key: 'requirement',
    cell: 'G',
    width: 75,
  },
  {
    header: '변경사유/변경내용',
    key: 'change_reason',
    cell: 'H',
    color: 'FFFFFF00',
    width: 50,
  },
  {
    header: `잠재적 고장모드${RNLINE}(설계 고장 형태)`,
    key: 'failureMode',
    cell: 'I',
    width: 75,
  },
  {
    header: `고장의 영향${RNLINE}(소비자 고장 형태)`,
    key: 'failureEffect',
    cell: 'J',
    width: 75,
  },
  {
    header: `고장매커니즘${RNLINE}(고장원인)`,
    key: 'failureDetail',
    cell: 'K',
    width: 65,
  },
  {
    header: '예방(설계관점)',
    key: 'prevention',
    cell: 'L',
    nonmerge: true,
    width: 80,
  },
  {
    header: '관련자료(출처)',
    key: 'referenceData',
    cell: 'M',
    nonmerge: true,
    width: 18.75,
  },
  {
    header: '검출(시험관점)',
    key: 'detectivity',
    cell: 'N',
    nonmerge: true,
    width: 75,
  },
  { header: 'Classification', key: 'classification', cell: 'O', width: 15 },
  {
    header: `심각도${RNLINE}Sev`,
    key: 'refSeverity',
    cell: 'P',
    width: 13.75,
  },
  {
    header: `발생도${RNLINE}Occ`,
    key: 'refOccurence',
    cell: 'Q',
    width: 10,
  },
  {
    header: `검출도${RNLINE}Det`,
    key: 'refDetection',
    cell: 'R',
    width: 10,
  },
  {
    header: `조치우선${RNLINE}순위(AP)`,
    key: 'AP',
    cell: 'S',
    color: 'FF92D050',
    width: 13.75,
  },
  {
    header: '점검결과',
    key: 'refResult',
    cell: 'T',
    color: 'FFFFFF00',
    width: 80,
  },
  {
    header: '권고시정조치사항',
    key: 'refRecommend',
    cell: 'U',
    color: 'FFFFCC00',
    width: 80,
  },
  {
    header: '책임자',
    key: prop.BOMLINE_RESPONSIBILITY,
    cell: 'V',
    color: 'FFFFCC00',
    width: 15,
  },
  {
    header: '목표일자',
    key: prop.BOMLINE_TARGET_DATE,
    cell: 'W',
    color: 'FFFFCC00',
    width: 15,
  },
  {
    header: '결과',
    key: 'refRecommendResult',
    cell: 'X',
    color: 'FFFFCC00',
    nonmerge: true,
    width: 25,
  },
  {
    header: `New${RNLINE}SEV`,
    key: 'newSeverity',
    cell: 'Y',
    color: 'FFFFCC00',
    nonmerge: true,
    width: 20,
  },
  {
    header: `New${RNLINE}OCC`,
    key: 'newOccurence',
    cell: 'Z',
    color: 'FFFFCC00',
    nonmerge: true,
    width: 20,
  },
  {
    header: `New${RNLINE}DET`,
    key: 'newDetection',
    cell: 'AA',
    color: 'FFFFCC00',
    nonmerge: true,
    width: 13.75,
  },
  {
    header: `New${RNLINE}AP`,
    key: 'newAP',
    cell: 'AB',
    color: 'FF92D050',
    nonmerge: true,
    width: 15,
  },
];

export const COLUMNS_DESC = [
  { value: ' ', cell: 'B' },
  { value: `부품이름/${RNLINE}도면번호`, cell: 'C' },
  { value: `부품이름/${RNLINE}도면번호`, cell: 'D' },
  { value: `부품이름/${RNLINE}도면번호${RNLINE}그림/사진`, cell: 'E' },
  { value: `설계자의 의도된 부품의 기능을 작성`, cell: 'F' },
  { value: `각 기능에 대한 요구사항을개별적으로 나열함`, cell: 'G' },
  {
    value: `[변경사유]${RNLINE}[변경내용]${RNLINE}(기존)${RNLINE}(변경)`,
    cell: 'H',
  },
  {
    richText: [
      {
        font: {
          ...COL_FONT_STYLE,
          color: {
            argb: COLOR_COL_DESC,
          },
        },
        text: `발생 가능성이 있는${NLINE}(잠재적인) 고장의${NLINE}형태를 기입${NLINE}`,
      },
      {
        font: {
          ...COL_FONT_STYLE,
          color: {
            argb: COLOR_RED,
          },
        },
        text: '※설계(양산)변경의 경우, 변경점에 의해 발생할 수 있는 고장 모드를 추가',
      },
    ],
    cell: 'I',
  },
  { value: `소비자에 의해 인식되는${RNLINE}고장모드의 영향`, cell: 'J' },
  { value: `잠재적 고장 원인 및 매커니즘을 작성`, cell: 'K' },
  { value: `고장모드와 고장원인에 대한 예방 활동을 작성`, cell: 'L' },
  { value: `DGMS, QMS, 표준, 도면 등`, cell: 'M' },
  { value: `현재 적용중인 검사항목, 시험항목을 구체적으로 기술`, cell: 'N' },
  { value: `CTQ`, cell: 'O' },
  { value: `고객에게 미치는 영향의정도`, cell: 'P' },
  { value: `잠재적 고장 원인이 발생될 가능성의 정도`, cell: 'Q' },
  { value: `현재의 관리방법으로 발견될${RNLINE}가능성의 정도`, cell: 'R' },
  { value: `개발자 자체 검토 결과`, cell: 'T' },
  {
    value: `개선의 우선순위가 결정되었을 때의 설계위험을 줄이기 위한 방안 기록`,
    cell: 'U',
  },
  { value: `조치 결과에 대한 간략한 설명과 실제 완료일을 작성`, cell: 'X' },
  {
    value: `개선활동후 평가 결과를 재산출함`,
    cell: 'Y',
    merge: true,
    mergeCell: 'AB',
  },
];

export const IMAGE_CELLS = [
  'function',
  'requirement',
  'failureMode',
  'failureDetail',
  'failureEffect',
  'prevention',
  'detectivity',
  'refResult',
  'refRecommend',
  'refRecommendResult',
];

export const INSERT_CELLS = [
  'upperAssy',
  'lowerAssy',
  constants2.SINGLE_ITEM,
  'function',
  'requirement',
  'failureMode',
  'failureDetail',
  'failureEffect',
  'prevention',
  'referenceData',
  'detectivity',
  'classification',
  'refSeverity',
  'refOccurence',
  'refDetection',
  'refResult',
  'refRecommend',
  prop.BOMLINE_RESPONSIBILITY,
  prop.BOMLINE_TARGET_DATE,
  'refRecommendResult',
  'newSeverity',
  'newOccurence',
  'newDetection',
  'newAP',
  'AP',
];

export const SOD_CELLS = ['refSeverity', 'refOccurence', 'refDetection', 'newSeverity', 'newOccurence', 'newDetection'];

export const EXCEL_COLUMNS = [
  constants.COL_PARENT_ASSY_LANG,
  constants.COL_SUB_ASSY_LANG,
  constants.COL_SINGLE_ITEM_LANG,
  constants.COL_FAILURE_FUNCTION_LANG,
  constants.COL_FAILURE_REQUIREMENT_LANG,
  ['change_info', '변경사유/변경내용', 'ChangeInfo'],
  constants.COL_FAILURE_LANG,
  constants.COL_FAILURE_EFFECT_LANG,
  constants.COL_CAUSE_OF_FAILURE_LANG,
  constants.COL_PRECATUIONS_ACTION_LANG,
  constants.COL_RELATED_SOURCES_LANG,
  constants.COL_DETECTION_ACTION_LANG,
  constants.COL_CLASSIFICATION_LANG,
  constants.COL_SEVERITY_LANG, // 12
  constants.COL_OCCURENCE_LANG,
  constants.COL_DETECTION_LANG,
  constants.COL_AP_LANG,
  constants.COL_INSPECTION_RESULTS_LANG,
  constants.COL_RECOMMENDED_ACTION_LANG,
  ['manager', '책임자', 'Manager'],
  ['targetDate', '목표일자', 'Target date'],
  constants.COL_RECOMMENDED_ACTION_RESULT_LANG,
  constants.COL_RESULT_SEVERITY_LANG,
  constants.COL_RESULT_OCCURENCE_LANG,
  constants.COL_RESULT_DETECTION_LANG,
  constants.COL_RESULT_AP_LANG,
];

// 동일 내용 시 머지 필요 셀
export const MERGE_CELLS = [
  ['upperAssy', 3],
  ['lowerAssy', 4],
  //   [constants.SINGLE_ITEM, 5],
  ['function', 6],
  ['requirement', 7],
  ['failureMode', 9],
  ['failureDetail', 10],
  ['failureEffect', 11],
  ['prevention', 12],
  ['referenceData', 13],
  ['detectivity', 14],
  ['classification', 15],
  ['refResult', 20],
  ['refRecommend', 21],
  //   [prop.BOMLINE_RESPONSIBILITY, 22],
  //   [prop.BOMLINE_TARGET_DATE, 23],
  ['refRecommendResult', 24],
];
