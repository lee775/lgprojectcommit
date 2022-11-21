export const explain =
  '\n1) 목적\n\n- 연관 부품 선정 및 유도환경에 따른 고장모드/매커니즘 분석\n\n2) 작성 내용\n\n- 어셈블리 혹은 서브 어셈블리 단위를 기준으로, Item 선정(영향 주는 측, 영향 받은 측으로 구분하여 List up)\n\n- 도출 된 Item 별 Interaction 분석 : 과거사례/경험 혹은 Reference 자료를 기준으로 하고, 필요 시 구성원 간 W/S(Brainstorming, Voting)을 통하여 분석을 진행 함\n\n3) 작성 순서 : 부품 간 Interaction 분석 → 고장모드/매커니즘 분석\n\n4) 주의 사항\n\n- 도출된 결과 중 영향도가 크게 미치는 항목에 대해 각 영향특성에 맞춰 색깔 구분하여 FMEA 전개에 반영함.';
export const explainCell = 'B2';
export const mergeExplainCell = 'F10';

export const cellWidth = 30;

export const interaction_guide = 'Interaction 영향검토 가이드';

export const cellRange1 = { start: 2, end: 12 };
export const rowRange1 = { start: 2, end: 10 };

const BORDER_STYLE_RIGHT = {
  right: { style: 'thin' },
};
const BORDER_STYLE_BOTTOM = {
  bottom: { style: 'thin' },
};
const BORDER_STYLE_RIGHTBOTTOM = {
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

export const textBg = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'e2efda' },
  bgColor: { argb: '#e2efda' },
};

export const divValues = [
  {
    val: interaction_guide,
    cell: 'G2',
    mergeCell: 'H2',
  },
  { val: 'A : 기계적', cell: 'G3' },
  {
    val: 'color',
    cell: 'H3',
    color: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '92d050' },
      bgColor: { argb: '92d050' },
    },
    border: BORDER_STYLE_RIGHT,
  },
  { val: 'B : 전기적', cell: 'G4' },
  {
    val: 'color',
    cell: 'H4',
    color: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ffff00' },
      bgColor: { argb: 'ffff00' },
    },
    border: BORDER_STYLE_RIGHT,
  },
  { val: 'C : 열', cell: 'G5' },
  {
    val: 'color',
    cell: 'H5',
    color: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ffc000' },
      bgColor: { argb: 'ffc000' },
    },
    border: BORDER_STYLE_RIGHT,
  },
  { val: 'D : 화학적', cell: 'G6' },
  {
    val: 'color',
    cell: 'H6',
    color: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '00b0f0' },
      bgColor: { argb: '00b0f0' },
    },
    border: BORDER_STYLE_RIGHT,
  },
  { val: 'E : 방사적', cell: 'G7' },
  {
    val: 'color',
    cell: 'H7',
    color: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '632523' },
      bgColor: { argb: '632523' },
    },
    border: BORDER_STYLE_RIGHT,
  },
  { val: 'AB : 기계 - 전기', cell: 'G8' },
  {
    val: 'color',
    cell: 'H8',
    color: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'fcd5b4' },
      bgColor: { argb: 'fcd5b4' },
    },
    border: BORDER_STYLE_RIGHT,
  },
  { val: 'AC : 기계 - 열', cell: 'G9' },
  {
    val: 'color',
    cell: 'H9',
    color: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '7030a0' },
      bgColor: { argb: '7030a0' },
    },
    border: BORDER_STYLE_RIGHT,
  },
  { val: 'AD : 기계 - 화학', cell: 'G10', border: BORDER_STYLE_BOTTOM },
  // { val: '', cell: 'K10', border: BORDER_STYLE_BOTTOM },
  {
    val: 'color',
    cell: 'H10',
    color: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '31869b' },
      bgColor: { argb: '31869b' },
    },
    border: BORDER_STYLE_RIGHTBOTTOM,
  },
];

export const cellRange2 = { start: 'G3', end: 'H10' };

export const header = ['구분', 'ITEM\n(영향주는 측↓)'];

export const color = {
  A: '92d050',
  B: 'ffff00',
  C: 'ffc000',
  D: '00b0f0',
  E: '632523',
  AB: 'fcd5b4',
  AC: '7030a0',
  AD: '31869b',
};

export const valueHeaderMerge = [
  { cell: 'B12', mergeCell: 'B13' },
  { cell: 'C12', mergeCell: 'C13' },
];
