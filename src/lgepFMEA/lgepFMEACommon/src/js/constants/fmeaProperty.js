import lgepTcConstants from 'js/constants/lgepTcConstants';

/** TYPES */
export const TYPE_DATASET = 'Dataset';
export const TYPE_DFMEA_MASTER_ITEM = 'L2_DFMEA'; // DFMEA 아이템
export const TYPE_DFMEA_MASTER_REVISION = 'L2_DFMEARevision';
export const TYPE_FMEA_STRUCTURE = 'L2_FMEAStructure'; // 구조
export const TYPE_FMEA_STRUCTURE_REV = 'L2_FMEAStructureRevision';
export const TYPE_FMEA_FUNC = 'L2_FMEAFunc'; // 기능
export const TYPE_FMEA_FUNC_REVISION = 'L2_FMEAFuncRevision';
export const TYPE_FMEA_FAILURE = 'L2_FMEAFailure';
export const TYPE_FMEA_FAILURE_REVISION = 'L2_FMEAFailureRevision';
export const TYPE_FMEA_REVISION = 'L2_FMEARevision';
export const TYPE_FMEA_REQ = 'L2_FRequirement';
export const TYPE_FMEA_REQ_REVISION = 'L2_FRequirementRevision';
export const TYPE_FMEA_PREACUTION_ACTION = 'L2_PrecautionAction';
export const TYPE_FMEA_DETECTION_ACTION = 'L2_DetectionAction';
export const TYPE_SOD = 'L2_SODTable';
export const TYPE_SOD_ROW = 'L2_SODTableRow';
export const TYPE_INTERACTION = 'L2_INTERACTION_TYPE';
export const TYPE_AP_ROW = 'L2_APTableRow';

/** FMEA PROPS */
export const PRODUCT_CATEGORY = 'l2_product_category'; // 제품 (128)
export const CLASS = 'l2_class'; // 구조 분류 (LOV)
export const IS_MASTER = 'l2_is_master'; // 마스터 템플릿 여부
export const CALSS = 'l2_class'; // 구조 분류

export const PRODUCT = 'l2_product'; // 제품 (128)
export const FUNCTION = 'l2_function'; // 기능 (long)
export const FUNCTION_SHORT = 'l2_function_s'; // 기능 요약 (1024)
export const POTENTIAL_FAILURE_MODE = 'l2_potential_failure_mode'; // 잠재적 고장 모드 (long)
export const FAILURE_EFFECT = 'l2_failure_effect'; // 고장 영향(long)
export const CAUSE_OF_FAILURE = 'l2_cause_of_failure'; // 고장 원인(long)
export const FAILURE_EFFECT_SHORT = 'l2_failure_effect_s'; // 고장 영향(1024)
export const CAUSE_OF_FAILURE_SHORT = 'l2_cause_of_failure_s'; // 고장 원인(1024)
export const POTENTIAL_FAILURE_MODE_SHORT = 'l2_potential_failure_mode_s'; // 잠재적 고장 모드 (1024)

export const TYPE_ACTION_PRECAUTION = 'L2_PrecautionAction'; // 고장 객체의 예방 조치 ref
export const TYPE_ACTION_DETECTION = 'L2_DetectionAction'; // 고장 객체의 검출 조치 ref

export const REF_REQUIREMENTS = 'l2_reqs'; // 기능 객체의 요구사항 ref
export const REQUIREMENT = 'l2_requirements'; // 요구사항 (long)
export const REQUIREMENT_SHORT = 'l2_requirements_s'; // 요구사항 요약(1024)

export const REF_PREVENTION_ACTION = 'l2_prevention_action'; // 예방 조치 ref
export const REF_DETECTION_ACTION = 'l2_detection_action'; // 검출 조치 ref
export const PRECATUIONS_ACTION = 'l2_precautions_action'; // 예방 조치 (long)
export const DETECTION_ACTION = 'l2_detection_action'; // 검출 조치 (long)
export const PRECATUIONS_ACTION_SHORT = 'l2_precautions_action_s'; // 예방 조치 (1024)
export const DETECTION_ACTION_SHORT = 'l2_detection_action_s'; // 검출 조치 (1024)

/** 신규 추가 속성 항목 FMEA Failure Revision */
export const DETECTION_ACTIONS = 'l2_detection_actions'; // 검출 조치 (long)
export const DETECTION_ACTIONS_SHORT = 'l2_detection_actions_s'; // 검출 조치 (1024)
export const FUNCTION_REQUIREMENTS = "l2_fun_requirements"; // 기능 요구사항(고장리비전)
export const FUNCTION_REQUIREMENTS_SHORT = "l2_fun_requirements_s"; // 기능 요구사항(고장리비전)
export const PRECATUION_ACTION = 'l2_precaution_action'; // 예방 조치 (고장리비전)
export const PRECATUION_ACTION_SHORT = 'l2_precaution_action_s'; // 예방 조치 (고장리비전)


export const SEVERITY = 'l2_severity'; // 심각도 (integer)
export const OCCURENCE = 'l2_occurence'; // 발생도 (integer)
export const DETECTION = 'l2_detection'; // 검출도 (integer)

export const RELATED_SOURCES = 'l2_related_sources'; // 참고 자료 출처 (1024)
export const CLASSFICATION = 'l2_classification'; // classification (512)

export const PARENT_ASSY = 'l2_parent_assy'; // 상위 ASSY (512)
export const SUB_ASSY = 'l2_sub_assy'; // 하위 ASSY (512)
export const SINGLE_ITEM = 'l2_single_item'; 

export const REF_SOD_STANDARD = 'l2_sod_ref'; // SOD 테이블 참조 ref

/** SOD */
export const SOD_GRADE = 'l2_grade'; // 등급
export const SOD_TYPE = 'l2_type'; // 타입 (심각도/발생도/검출도)
export const SOD_EFFECT = 'l2_effect'; // 영향
export const SOD_CAUSE_EFFECT = 'l2_cause_effect'; // 영향원인
export const SOD_EVALUATION_STANDARD = 'l2_evaluation_standard'; // 평가 기준
export const SOD_DETECTION_OPPORTUNITY = 'l2_detection_opportunity'; // 검출 기회
export const SOD_DETECTION_RANGE = 'l2_detection_range'; // 검출 방법에 대한 제안된 범위
export const SOD_POSSIBILITY_OF_FAILURE = 'l2_possibility_of_failure'; // 고장 가능성
export const SOD_DETECTABILITY = 'l2_detectability'; // 검출 가능성
export const SOD_DESIGN_LIFE_RELIABILITY = 'l2_design_life_reliability'; // 부품/제품의 설계수명/신뢰성
export const SOD_NUMBER_OF_OCCURRENCES = 'l2_number_of_occurrences'; // 제품당 발생 횟수

export const SOD_AP = 'l2_ap';
export const SOD_DETECTION_CAPABILITY = 'l2_detection_capability';
export const SOD_DETECTION_E = 'l2_detection_e';
export const SOD_DETECTION_S = 'l2_detection_s';
export const SOD_EFFECTIVITY = 'l2_effectivity';
export const SOD_INDEX = 'l2_index';
export const SOD_OCCURENCE_E = 'l2_occurence_e';
export const SOD_OCCURENCE_S = 'l2_occurence_s';
export const SOD_SEVERITY_E = 'l2_severity_e';
export const SOD_SEVERITY_S = 'l2_severity_s';
export const SOD_POTENTIAL_FAILURE_CAUSE = 'l2_potential_failure_cause';
export const SOD_OPINION = 'l2_opinion';

export const SOD_SEVERITY_TABLE = 'l2_severity_table'; // 심각도 테이블
export const SOD_OCCURENCE_TABLE = 'l2_occurence_table'; // 검출도 테이블
export const SOD_DETECTION_TABLE = 'l2_detection_table'; // 발생도 테이블
export const SOD_AP_TABLE = 'l2_ap_table';

/** INTERACTION */
export const SECONDARY_OBJECT = 'secondary_object';
export const PRIMARY_OBJECT = 'primary_object';
export const RELATION_INTERACTION = 'L2_InteractionRelation';
export const INNTERACTION_TYPE = 'l2_interaction_type';

/** COMMON PROPS */
export const OBJECT_NAME = lgepTcConstants.PROP_OBJECT_NAME;
export const OBJECT_DESC = lgepTcConstants.PROP_OBJECT_DESC;
export const CREATION_DATE = lgepTcConstants.PROP_CREATION_DATE;
export const OWNING_USER = lgepTcConstants.PROP_OWNING_USER;
export const IMAN_SPECIFICATION = lgepTcConstants.REL_IMAN_SPECIFICATION;
export const IMAN_REFERENCE = lgepTcConstants.REL_IMAN_REFERENCE;
export const ITEMS_TAG = lgepTcConstants.PROP_ITEMS_TAG;
export const REVISION_ID = lgepTcConstants.PROP_ITEM_REVISION_ID;
export const OBJECT_STRING = lgepTcConstants.PROP_OBJECT_STRING;
export const ITEM_ID = lgepTcConstants.PROP_ITEM_ID;
export const REF_LIST = 'ref_list';
export const REVISION_LIST = 'revision_list';
export const IMAN_BASED_ON = 'IMAN_based_on';
export const GROUP_NAME = 'group_name';

/** QUERY */
export const QUERY_FMEA_STRUCTURE = 'FMEA_Structure_search2';
export const QUERY_FMEA_FUNCTION = 'FMEA_Function_search2';
export const QUERY_FMEA_FAILURE = 'FMEA_Failure_search2';
export const QUERY_DFMEA_MASTER = 'FMEA_dfmea_master_search';
export const QUERY_FMEA_SOD = 'FMEA_Sod_Table_Search';

export const QUERY_DFMEA_MASTER_PRODUCT = 'PRODUCT';
export const QUERY_ENTRY_ISMASTER = 'IS_MASTER'; // MASTER 조회 쿼리 - is_master 조건
export const QUERY_ENTRY_NAME = 'NAME'; // SOD TABEL 이름 조회

export const QUERY_INTERACTION_RELATION = 'SearchInteractionRelation'; // Interaction 관계 조회
export const QUERY_ENTRY_PRIMARY_NAME = 'PRIMARY_NAME'; // Interaction Name
export const QUERY_ENTRY_PRIMARY_REV_ID = 'PRIMARY_REV_ID'; // Interaction Primary RevId
export const QUERY_ENTRY_PRIMARY_ID = 'PRIMARY_ID'; // Interaction Primary id
export const QUERY_ENTRY_SECONDARY_ID = 'SECONDARY_ID'; // Interaction Name
export const QUERY_ENTRY_SECONDARY_REV_ID = 'SECONDARY_REV_ID'; // Interaction Primary RevId
export const QUERY_ENTRY_SECONDARY_NAME = 'SECONDARY_NAME'; // Interaction Primary id

/** BOM */
export const BOMLINE_ETC_NOTE = 'L2_EtcNote'; // 기타 사항 (결과)
export const BOMLINE_TARGET_DATE = 'L2_Target_Date'; // 목표일자
export const BOMLINE_RESULT_SEVERITY = 'L2_Result_Severity'; // 결과 심각도
export const BOMLINE_RESULT_OCCURENCE = 'L2_Result_Occurence'; // 결과 발생도
export const BOMLINE_RESULT_DETECTION = 'L2_Result_Detection'; // 결과 검출도
export const BOMLINE_RESULT_ACTION_PRIORITY = 'L2_Result_AP'; // 결과 조치 우선순위
export const BOMLINE_RESPONSIBILITY = 'L2_Responsibility'; // 책임자
export const BOMLINE_PRECAUTIONS = 'L2_Precautions'; // 권고조치사항
export const BOMLINE_INSPECTION_RESULTS = 'L2_InspectionResults'; // 점검 결과
export const BOMLINE_ACTION_PRIORITY = 'L2_AP'; // 조치 우선순위
export const BOMLINE_COMPLETE_DATE = 'L2_Complete_Date'; // 완료 날짜
export const BOMLINE_SEVERITY = 'L2_Severity'; // 심각도
export const BOMLINE_OCCURENCE = 'L2_Occurence'; // 검출도
export const BOMLINE_DETECTION = 'L2_Detection'; // 발생도
export const BOMLINE_REQUIREMENT = 'L2_Requirement'; // 요구사항 uid
export const BOMLINE_FAILURE_EFFECT = 'L2_Failure_Effect'; // 임시 uid
export const BOMLINE_CAUSE_OF_FAILURE = 'L2_Cause_Failure'; // 임시 uid
export const BOMLINE_PRECAUTION_ACTION = 'L2_Precaution_Action'; // 예방 조치 uid
export const BOMLINE_DETECTION_ACTION = 'L2_Detection_Action'; // 검출 조치 uid

export const BOMLINE_OBJECT_NAME = 'bl_rev_object_name';
export const BOMLINE_SEQUENCE = 'bl_sequence_no';
export const BOMLINE_LINE_LEVEL = 'bl_level_starting_0';
export const BOMLINE_FAILURE_CAUSE_OF_FAILURE = 'bl_L2_FMEAFailureRevision_l2_cause_of_failure'; // 고장 원인
export const BOMLINE_FAILURE_CAUSE_OF_FAILURE_SHORT = 'bl_L2_FMEAFailureRevision_l2_cause_of_failure_s'; // 고장 원인(1024)
export const BOMLINE_FAILURE_CLASSIFICATION = 'bl_L2_FMEAFailureRevision_l2_classification'; // 분류
export const BOMLINE_FAILURE_DETECTION_ACTIONS = 'bl_L2_FMEAFailureRevision_l2_detection_actions'; // 검출조치
export const BOMLINE_FAILURE_DETECTION_ACTIONS_SHORT = 'bl_L2_FMEAFailureRevision_l2_detection_actions_s'; // 검출조치(1024)
export const BOMLINE_FAILURE_FAILURE_EFFECT = 'bl_L2_FMEAFailureRevision_l2_failure_effect'; // 고장영향
export const BOMLINE_FAILURE_FAILURE_EFFECT_SHORT = 'bl_L2_FMEAFailureRevision_l2_failure_effect_s'; // 고장영향(1024)
export const BOMLINE_FAILURE_REQUIREMENT = 'bl_L2_FMEAFailureRevision_l2_fun_requirements'; // 기능 요구사항
export const BOMLINE_FAILURE_REQUIREMENT_SHORT = 'bl_L2_FMEAFailureRevision_l2_fun_requirements_s'; // 기능 요구사항(1024)
export const BOMLINE_FAILURE_POTENTIAL_FAILURE_MODE = 'bl_L2_FMEAFailureRevision_l2_potential_failure_mode'; // 잠재적 고장모드
export const BOMLINE_FAILURE_POTENTIAL_FAILURE_MODE_SHORT = 'bl_L2_FMEAFailureRevision_l2_potential_failure_mode_s'; // 잠재적 고장모드(1024)
export const BOMLINE_FAILURE_PRECAUTION_ACTION = 'bl_L2_FMEAFailureRevision_l2_precaution_action'; // 예방조치
export const BOMLINE_FAILURE_PRECAUTION_ACTION_SHORT = 'bl_L2_FMEAFailureRevision_l2_precaution_action_s'; // 예방조치(1024)
export const BOMLINE_FAILURE_RELATED_SOURCES = 'bl_L2_FMEAFailureRevision_l2_related_sources'; // 예방조치(1024)
export const BOMLINE_FUNC_FUNCTION = 'bl_L2_FMEAFuncRevision_l2_function'; // 기능
export const BOMLINE_FUNC_FUNCTION_SHORT = 'bl_L2_FMEAFuncRevision_l2_function_s'; // 기능(1024)


