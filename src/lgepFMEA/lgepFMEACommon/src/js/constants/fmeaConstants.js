import * as prop from 'js/constants/fmeaProperty';

/** CTX */
export const IS_PIN = 'fmea_isPin'; // (boolean) panel, popup창의 패널 고정 여부 - 공통
export const INIT_COMPLETE = 'fmea_table_init'; // (boolean) table Data가 전부 Load 되었는지 여부
export const EDITING = 'fmea_editing'; // (boolean) 편집 여부
export const ROW_SELECT = 'fmea_row_select'; // (ViewModelObject || ModelObject || ToastUI Row Data) 선택한 tableRow.
export const FMEA_POPUP = 'fmea_popup'; // (boolean) 팝업 호출 여부
export const DFMEA_DETAIL_INIT = 'fmea_detail_init'; // 선택한 마스터의 속성 뷰 에디터 init완료 여부
export const FMEA_SELECT = 'fmea_select'; // [ModelObject]  선택한 DFMEA Revision
export const DFMEA_ALL_MASTER_DATA = 'fmea_all_master_datas'; //[{string, [{}]}]  master list
export const DFMEA_TABLE_MODE = 'fmea_table_mode'; // (string) 현재 테이블 모드 (text/image)
export const FMEA_TABLE_LIST = 'fmea_table_list'; // ([ViewModelObject]) dfmea master table list
export const DFMEA_DETAIL_MODE = 'fmea_detail_mode'; // (boolean) 상세 보기 모드 실행 여부
export const FMEA_EXECUTE = 'fmea_execute'; // (string) 생성/삭제 실행 여부
export const FMEA_EDIT_INIT = 'fmea_edit_init'; // (boolean) 편집시 필요한 데이터 모두 init 여부
export const DFMEA_ROW_EDIT = 'fmea_row_edit'; //  (boolean) FMEA_EDIT_INIT시트에서 로우 편집 실행 여부
export const DFMEA_ROW_EDIT_INIT_VALUES = 'fmea_row_edit_init_values'; // ([Object]) 로우 편집 전 에디터 내용
export const CHANGE_INFO = 'fmea_chagne_info'; // (object) 편집 정보
export const DFMEA_CHANGE_TABLE_LIST = 'fmea_change_table_list'; // ([ViewModelObject])변경된 테이블 리스트
export const FMEA_REFRESH = 'fmea_refresh'; //(boolean)  강제 새로고침
export const FMEA_ROW_EDIT_SAVE = 'fema_row_edit_save'; //(boolean)  로우 편집 저장 여부
export const FMEA_SOD = 'fmea_sod'; // (Object) 현재 FMEA의 SOD 정보
export const INTERACTION_ROW = 'fmea_interaction_row'; // (ViewModelObject) interaction 기능에서 선택한 row
export const INTERACTION_INIT_ROW_SELECT = 'fmea_init_row_select'; // (object) interaction 기능 실행 전 초기 선택 row
export const INIT_CREATE_VIEW = 'fmea_create_view'; // FMEA 생성
export const FMEA_SOD_SELECT_COL = 'fmea_sod_select_column'; // 편집 모드에서 SOD 수정 한 컬럼명
export const FMEA_INERATION_INIT = 'interaction_init'; // Interaction Table 편집창 init
export const FMEA_GROUP_PRODUCT = 'fmea_product'; // (object) 유저 그룹에 따른 제품명
export const FMEA_PANEL = 'fmea_panel'; // 패널 호출 여부
export const FMEA_TREE_LIST = 'fmea_tree_list'; // ([ViewModelObject]) FMEA TreeList
export const FMEA_LABEL_INIT = 'fmea_label_init'; // (boolean) 트리 모드 상세 보기에서 라벨 먼저 뜨는것 방지
export const FMEA_SELECT_STRUCTURE = 'fmea_tree_structure'; //(boolean) 트리 모드에서 구조 선택
export const FMEA_SELECT_STRUCTURE_MODEL = 'fmea_structure_model'; //(boolean) 트리 모드에서 구조 선택
export const FMEA_IS_RESIZE = 'fmea_is_resize'; //(boolean) 테이블 확대/축소시에 true
export const FMEA_IMAGE_GRID = 'fmea_image_grid';
export const FMEA_SET_VMO = 'fmea_set_vmo'; //sod 객체 저장

export const MASTER_CTX_LIST = [
  IS_PIN,
  INIT_COMPLETE,
  EDITING,
  ROW_SELECT,
  FMEA_POPUP,
  DFMEA_DETAIL_INIT,
  FMEA_SELECT,
  DFMEA_TABLE_MODE,
  FMEA_TABLE_LIST,
  DFMEA_DETAIL_MODE,
  FMEA_EXECUTE,
  FMEA_EDIT_INIT,
  DFMEA_ROW_EDIT,
  DFMEA_ROW_EDIT_INIT_VALUES,
  CHANGE_INFO,
  DFMEA_CHANGE_TABLE_LIST,
  FMEA_REFRESH,
  FMEA_ROW_EDIT_SAVE,
  INTERACTION_ROW,
  INTERACTION_INIT_ROW_SELECT,
  INIT_CREATE_VIEW,
  FMEA_SOD_SELECT_COL,
  FMEA_INERATION_INIT,
  FMEA_GROUP_PRODUCT,
  FMEA_PANEL,
  FMEA_TREE_LIST,
  FMEA_LABEL_INIT,
  FMEA_IS_RESIZE,
  FMEA_SET_VMO,
];

export const FMEA_CTX_LIST = [
  IS_PIN,
  INIT_COMPLETE,
  EDITING,
  ROW_SELECT,
  FMEA_POPUP,
  DFMEA_DETAIL_INIT,
  FMEA_SELECT,
  FMEA_TABLE_LIST,
  DFMEA_DETAIL_MODE,
  FMEA_EXECUTE,
  FMEA_EDIT_INIT,
  DFMEA_ROW_EDIT,
  DFMEA_ROW_EDIT_INIT_VALUES,
  CHANGE_INFO,
  DFMEA_CHANGE_TABLE_LIST,
  FMEA_REFRESH,
  FMEA_ROW_EDIT_SAVE,
  INTERACTION_ROW,
  INTERACTION_INIT_ROW_SELECT,
  FMEA_SOD_SELECT_COL,
  FMEA_INERATION_INIT,
  FMEA_GROUP_PRODUCT,
  FMEA_PANEL,
  FMEA_TREE_LIST,
  FMEA_LABEL_INIT,
  FMEA_IS_RESIZE,
  FMEA_SET_VMO,
];

export const MASTER_DATA_KEY_STRUCTURE = 'structureValues'; // DFMEA_ALL_MASTER_DATA 키.
export const MASTER_DATA_KEY_FUNCTION = 'functionValues'; // DFMEA_ALL_MASTER_DATA 키.
export const MASTER_DATA_KEY_FAILURE = 'failureValues'; // DFMEA_ALL_MASTER_DATA 키.
export const DFMEA_TABLE_MODE_KEY_IMAGE = 'imageTable'; // DFMEA_TABLE_MODE value.
export const DFMEA_TABLE_MODE_KEY_TREE = 'treeTable'; // DFMEA_TABLE_MODE value.
export const DFMEA_TABLE_MODE_KEY_TEXT = 'textTable'; // DFMEA_TABLE_MODE value.
export const FMEA_EXECUTE_SAVE = 'saving'; // FMEA_EXECUTE value. 생성 실행
export const FMEA_EXECUTE_REMOVE = 'remove'; // FMEA_EXECUTE value. 삭제 실행
export const CHANGE_ADD_ROWS = 'add_rows'; // 추가된 로우
export const CHANGE_REMOVE_ROWS = 'remove_rows'; // 제거된 로우
export const CHANGE_EDIT_ROWS = 'edit_rows'; // 편집된 로우
export const UID = 'uid'; // key
export const VALUE = 'value'; // key

export const CLASS_LIST = [
  'Parent Assembly',
  'Sub Assembly',
  'Single Assembly',
]; // TODO :: 구분 LOV List

/** Editors */
export const CREATE_SUFFIX = '_create'; // 생성창 editor id 접미사

/** TABLE */
export const COL_STRUTURE_NAME_LANG = [
  prop.OBJECT_NAME,
  '구조명',
  'Structure Name',
];
export const COL_PRODUCT_OBJECT_NAME_LANG = [
  prop.PRODUCT_CATEGORY,
  '제품',
  'Product',
];
export const COL_CATEGORY_LANG = [prop.CLASS, '분류', 'Category'];
export const COL_OWNING_USER_LANG = [prop.OWNING_USER, '등록자', 'Registrant'];
export const COL_CREATION_DATE_LANG = [
  prop.CREATION_DATE,
  '등록일',
  'Registration date',
];
export const COL_FUNCTION_LANG = [prop.FUNCTION_SHORT, '기능', 'Fcuntion'];
export const COL_FAILURE_LANG = [
  prop.POTENTIAL_FAILURE_MODE,
  '고장 모드',
  'Potential Failure Mode',
];

export const COL_FAILURE_EFFECT_LANG = [
  prop.FAILURE_EFFECT,
  '고장의 영향',
  'Failure Effect',
];
export const COL_CAUSE_OF_FAILURE_LANG = [
  prop.CAUSE_OF_FAILURE,
  '고장 매커니즘',
  'Cause of Failure',
];
export const COL_REVISION_ID = [prop.REVISION_ID, 'Revision ID', 'Revision ID'];
export const COL_OBJECT_NAME_LANG = [prop.OBJECT_STRING, '이름', 'Name'];
export const COL_PRECATUIONS_ACTION_LANG = [
  prop.PRECATUIONS_ACTION,
  '예방',
  'Precautions Action',
];
export const COL_PRECATUIONS_ACTION_SHORT_LANG = [
  prop.PRECATUIONS_ACTION_SHORT,
  '예방',
  'Precautions Action',
];
export const COL_DETECTION_ACTION_LANG_SHORT_LANG = [
  prop.DETECTION_ACTION_SHORT,
  '검출',
  'Detection Action',
];
export const COL_DETECTION_ACTION_LANG = [
  prop.DETECTION_ACTION,
  '검출',
  'Detection Action',
];
export const COL_FAILURE_FUNCTION_LANG = [prop.FUNCTION, '기능', ' Function'];
export const COL_FAILURE_REQUIREMENT_LANG = [
  prop.REQUIREMENT,
  '요구사항',
  'Requirements',
];
export const COL_AP_LANG = [
  prop.BOMLINE_ACTION_PRIORITY,
  '조치우선순위',
  'Action Priority',
];
export const COL_CLASSIFICATION_LANG = [
  prop.CLASSFICATION,
  'Classification',
  'Classification',
];
export const COL_SEVERITY_LANG = [prop.BOMLINE_SEVERITY, '심각도', 'Severity'];
export const COL_OCCURENCE_LANG = [
  prop.BOMLINE_OCCURENCE,
  '발생도',
  'Occurence',
];
export const COL_DETECTION_LANG = [
  prop.BOMLINE_DETECTION,
  '검출도',
  'Detection',
];

export const COL_INSPECTION_RESULTS_LANG = [
  prop.BOMLINE_INSPECTION_RESULTS,
  '점검결과',
  'InspectionResults',
];

export const COL_PARENT_ASSY_LANG = [
  prop.PARENT_ASSY,
  '상위 Assembly',
  'Parent Assembly',
];
export const COL_SUB_ASSY_LANG = [
  prop.SUB_ASSY,
  '하위 Assembly',
  'Sub Assembly',
];
export const SINGLE_ITEM = 'l2_single_item';
export const COL_SINGLE_ITEM_LANG = [SINGLE_ITEM, '단품', 'Single Assembly'];
export const COL_RECOMMENDED_ACTION_LANG = [
  prop.BOMLINE_PRECAUTIONS,
  '권고조치사항',
  'Precautions',
];
export const COL_RESPONSIBLE_LANG = [
  prop.BOMLINE_RESPONSIBILITY,
  '책임자',
  'Responsibility',
];
export const COL_TARGET_DATE_LANG = [
  prop.BOMLINE_TARGET_DATE,
  '목표일자',
  'Target Date',
];
export const COL_RECOMMENDED_ACTION_RESULT_LANG = [
  prop.BOMLINE_ETC_NOTE,
  '권고조치결과',
  'Result',
];
export const COL_RELATED_SOURCES_LANG = [
  prop.RELATED_SOURCES,
  '관련자료',
  'Related Sources',
];
export const COL_RESULT_SEVERITY_LANG = [
  prop.BOMLINE_RESULT_SEVERITY,
  'New SEV',
  'New Severity',
];
export const COL_RESULT_OCCURENCE_LANG = [
  prop.BOMLINE_RESULT_OCCURENCE,
  'New OCC',
  'New Occurence',
];
export const COL_RESULT_DETECTION_LANG = [
  prop.BOMLINE_RESULT_DETECTION,
  'New DET',
  'New Detection',
];
export const COL_RESULT_AP_LANG = [
  prop.BOMLINE_RESULT_ACTION_PRIORITY,
  'New AP',
  'New Action Priority',
];
export const COL_NAME = [prop.OBJECT_NAME, 'SOD 기준 명', 'Name'];
export const COL_TYPE = [prop.PRODUCT, '제품', 'Product'];

export const COL_GRADE = [prop.SOD_GRADE, '등급', 'Grade'];
export const COL_CAUSE_EFFECT = [
  prop.SOD_CAUSE_EFFECT,
  '영향 원인',
  'Cause Effect',
];
export const COL_EFFECT = [prop.SOD_EFFECT, '영향', 'Effect'];
export const COL_EVALUATION_STANDARD = [
  prop.SOD_EVALUATION_STANDARD,
  '평가 기준',
  'Evauluation Standard',
];

export const COL_NUMBER_OF_OCCURRENCES = [
  prop.SOD_NUMBER_OF_OCCURRENCES,
  '제품당 발생횟수',
  'Number of occurrences per product',
]
export const COL_POSSIBILITY_OF_FAILURE = [
  prop.SOD_POSSIBILITY_OF_FAILURE,
  '고장 가능성',
  'Possibility Of Failure',
];

export const COL_DETECTION_RANGE = [
  prop.SOD_DETECTION_RANGE,
  '검출 방법에 대한 제안된 범위',
  'Detection Range',
];
export const COL_DETECTION_OPPORTUNITY = [
  prop.SOD_DETECTION_OPPORTUNITY,
  '검출 기회',
  'Detection Opportunity',
];
export const COL_DETECTABILITY = [
  prop.SOD_DETECTABILITY,
  '검출 가능성',
  'Detectability',
];
export const COL_DESIGN_LIFE_RELIABILITY = [
  prop.SOD_DESIGN_LIFE_RELIABILITY,
  '부품/제품의 설계수명/신뢰성',
  'Design Life Reliablity',
];

export const COL_SHORT_FUNCTION_LANG = [
  prop.FUNCTION_SHORT,
  '기능',
  ' Function',
];
export const COL_REQUIREMENT_SHORT_LANG = [
  prop.REQUIREMENT_SHORT,
  '요구사항',
  'Requirements',
];

export const COL_REQUIREMENT_LANG = [
  prop.REQUIREMENT,
  '요구사항',
  'Requirements',
];
export const COL_FAILURE_SHORT_LANG = [
  prop.POTENTIAL_FAILURE_MODE_SHORT,
  '고장 모드',
  'Potential Failure Mode',
];
export const COL_FAILURE_EFFECT_SHORT_LANG = [
  prop.FAILURE_EFFECT_SHORT,
  '고장의 영향',
  'Failure Effect',
];
export const COL_FAILURE_EFFECT_SHORT = [
  prop.FAILURE_EFFECT,
  '고장의 영향',
  'Failure Effect',
];
export const COL_CAUSE_OF_FAILURE_SHORT_LANG = [
  prop.CAUSE_OF_FAILURE_SHORT,
  '고장 매커니즘',
  'Cause of Failure',
];

export const PART_NAME = 'part_name';
export const COL_PART = [PART_NAME, '파트', 'Part'];
export const COL_EFFECT_TYPE = [prop.INNTERACTION_TYPE, '영향', 'Effect Type'];

export const COL_AP = [prop.SOD_AP, '조치 우선순위(AP)', 'AP'];
export const COL_DETECTION_CAPABILITY = [prop.SOD_DETECTION_CAPABILITY, '검출 능력', 'Detection capability'];
export const COL_DETECTION_E = [prop.SOD_DETECTION_E, '검출도(Detection) 상한', 'Detection End'];
export const COL_DETECTION_S = [prop.SOD_DETECTION_S, '검출도(Detection) 하한', 'Detection Start'];
export const COL_EFFECTIVITY = [prop.SOD_EFFECTIVITY, '영향', 'Effectivity'];
export const COL_INDEX = [prop.SOD_INDEX, '순서', 'Index'];
export const COL_OCCURENCE_E = [prop.SOD_OCCURENCE_E, '발생도(Occurrence) 상한', 'Occurrence End'];
export const COL_OCCURENCE_S = [prop.SOD_OCCURENCE_S, '발생도(Occurrence) 하한', 'Occurrence Start'];
export const COL_SEVERITY_E = [prop.SOD_SEVERITY_E, '심각도(Serveruty) 상한', 'Serverity End'];
export const COL_SEVERITY_S = [prop.SOD_SEVERITY_S, '심각도(Serveruty) 하한', 'Serverity Start'];
export const COL_POTENTIAL_FAILURE_CAUSE = [prop.SOD_POTENTIAL_FAILURE_CAUSE, '발생한 잠재적 고장 원인 예측', 'Potential Failure Cause'];
export const COL_OPINION = [prop.SOD_OPINION, '의견', 'Opinion'];

export const SEVERITY = 'severity';
export const COL_SEVERITY = [SEVERITY, 'S', 'S'];
export const OCCURRENCE = 'occurence';
export const COL_OCCURRENCE = [OCCURRENCE, 'O', 'O'];
export const DETECTION = 'detection';
export const COL_DETECTION = [DETECTION, 'D', 'D'];

export const NOTETYPE_PROPS = [
  prop.BOMLINE_REQUIREMENT,
  prop.BOMLINE_PRECAUTION_ACTION,
  prop.BOMLINE_DETECTION_ACTION,
  prop.BOMLINE_FAILURE_EFFECT,
  prop.BOMLINE_CAUSE_OF_FAILURE,
  prop.BOMLINE_SEVERITY,
  prop.BOMLINE_OCCURENCE,
  prop.BOMLINE_DETECTION,
  prop.BOMLINE_ACTION_PRIORITY,
];

export const RESULT_NOTETYPES_PROPS = [
  prop.BOMLINE_SEVERITY,
  prop.BOMLINE_OCCURENCE,
  prop.BOMLINE_DETECTION,
  prop.BOMLINE_ACTION_PRIORITY,
  prop.BOMLINE_RESULT_SEVERITY,
  prop.BOMLINE_RESULT_OCCURENCE,
  prop.BOMLINE_RESULT_DETECTION,
  prop.BOMLINE_RESULT_ACTION_PRIORITY,
  // prop.BOMLINE_ETC_NOTE,
  // prop.BOMLINE_TARGET_DATE,
  // prop.BOMLINE_RESPONSIBILITY,
  // prop.BOMLINE_PRECAUTIONS,
  // prop.BOMLINE_INSPECTION_RESULTS,
  // prop.BOMLINE_COMPLETE_DATE,
];

export const RESULT_AP_PROPS = [
  prop.BOMLINE_RESULT_SEVERITY,
  prop.BOMLINE_RESULT_OCCURENCE,
  prop.BOMLINE_RESULT_DETECTION,
  prop.BOMLINE_RESULT_ACTION_PRIORITY,
];

export const EDITOR_NOTETYPES_COLS = [
  COL_FAILURE_REQUIREMENT_LANG,
  COL_FAILURE_EFFECT_LANG,
  COL_CAUSE_OF_FAILURE_LANG,
  COL_PRECATUIONS_ACTION_LANG,
  COL_DETECTION_ACTION_LANG,
  COL_INSPECTION_RESULTS_LANG,
  COL_RECOMMENDED_ACTION_LANG,
  COL_RECOMMENDED_ACTION_RESULT_LANG,
];

export const EDITOR_NOTETYPES_PROPS = [
  prop.BOMLINE_INSPECTION_RESULTS,
  prop.BOMLINE_PRECAUTIONS,
  prop.BOMLINE_ETC_NOTE,
];

export const INTERACTION_TYPES = [
  {
    propDisplayValue: 'A: 기계적',
    propInternalValue: 'A',
  },
  {
    propDisplayValue: 'B: 전기적',
    propInternalValue: 'B',
  },
  {
    propDisplayValue: 'C: 열',
    propInternalValue: 'C',
  },
  {
    propDisplayValue: 'D: 화학적',
    propInternalValue: 'D',
  },
  {
    propDisplayValue: 'E: 방사적',
    propInternalValue: 'E',
  },
  {
    propDisplayValue: 'AB: 기계 - 전기',
    propInternalValue: 'AB',
  },
  {
    propDisplayValue: 'AC: 기계 - 열',
    propInternalValue: 'AC',
  },
  {
    propDisplayValue: 'AD: 기계 - 화학',
    propInternalValue: 'AD',
  },
];

export const INTERACTION_INIT_SELECT_CLASSNAME = 'interaction-init-select'; // Interaction 기능 실행 시 css 위한 ClassName
export const INTERACTION_INIT_SAME_SELECT = 'interaction-same';

export const GROUP_PRODUCT = [
  { DVZ: '청소기' },
  { CNZ: '냉장고' },
  { DGZ: '에어컨' },
  { DFZ: '세탁기' },
];

// -RAC(DGZ) : 에어컨
// -SAC(DMZ) : 에어컨
// -Dishwasher(CDZ) : 디시워셔
// -Kitchen Package(CVZ) : 키친패키지(블랜더, 오븐 등)
// -Water Purifier(CWZ) : 정수기
// -WM(DFZ) : 세탁기, 건조기, 스타일러

export const SPACING = '\u00a0\u00a0';
export const TWOSPACING = SPACING + SPACING;

export const INTERACTION_CELL_HEADER_CLASS = ['Class', '구분'];
export const INTERACTION_CELL_HEADER_SIDE = ['Influencing side', '영향주는 측'];

export const SOD_VACUUM_TABLE_INFO = {
  [prop.SOD_SEVERITY_TABLE]: {
    cols: [COL_GRADE, COL_EFFECT, COL_EVALUATION_STANDARD],
  },
  [prop.SOD_OCCURENCE_TABLE]: {
    cols: [COL_GRADE, COL_EVALUATION_STANDARD, COL_NUMBER_OF_OCCURRENCES],
  },
  [prop.SOD_DETECTION_TABLE]: {
    cols: [
      COL_GRADE,
      COL_DETECTION_OPPORTUNITY,
      COL_DETECTION_RANGE,
      COL_DETECTABILITY,
    ],
  },
  [prop.SOD_AP_TABLE]: {
    cols: [
      COL_EFFECTIVITY,
      COL_SEVERITY,
      COL_POTENTIAL_FAILURE_CAUSE,
      COL_OCCURRENCE,
      COL_DETECTION_CAPABILITY,
      COL_DETECTION,
      COL_AP,
      COL_OPINION,
    ],
  },
};

export const SOD_REFRIGERATOR_TABLE_INFO = {
  [prop.SOD_SEVERITY_TABLE]: {
    cols: [COL_GRADE, COL_CAUSE_EFFECT, COL_EFFECT, COL_EVALUATION_STANDARD],
  },
  [prop.SOD_OCCURENCE_TABLE]: {
    cols: [COL_GRADE, COL_POSSIBILITY_OF_FAILURE, COL_DESIGN_LIFE_RELIABILITY],
  },
  [prop.SOD_DETECTION_TABLE]: {
    cols: [
      COL_GRADE,
      COL_DETECTION_OPPORTUNITY,
      COL_DETECTION_RANGE,
      COL_DETECTABILITY,
    ],
  },
  [prop.SOD_AP_TABLE]: {
    cols: [
      COL_EFFECTIVITY,
      COL_SEVERITY,
      COL_POTENTIAL_FAILURE_CAUSE,
      COL_OCCURRENCE,
      COL_DETECTION_CAPABILITY,
      COL_DETECTION,
      COL_AP,
      COL_OPINION,
    ],
  },
};
