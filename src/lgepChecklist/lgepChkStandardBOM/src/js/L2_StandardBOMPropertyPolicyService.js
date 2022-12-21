import app from 'app';
import propertyPolicyService from 'soa/kernel/propertyPolicyService';
import * as standardBOMConstants from 'js/L2_StandardBOMConstants';

let exports = {};
let policyId;

/**
 * Register property policy
 */
export let registerPropertyPolicy = function () {
  let policy = {
    types: [
      {
        name: standardBOMConstants.Awb0DesignElement,
        properties: [
          {
            name: standardBOMConstants.l2_importance,
          },
          {
            name: standardBOMConstants.l2_is_selected,
          },
          {
            name: standardBOMConstants.l2_importance,
          },
          {
            name: standardBOMConstants.l2_ref_ap,
          },
          {
            name: standardBOMConstants.l2_ref_detection,
          },
          {
            name: standardBOMConstants.l2_ref_occurence,
          },
          {
            name: standardBOMConstants.l2_ref_severity,
          },
          {
            name: standardBOMConstants.l2_reference_dataset,
          },
          {
            name: standardBOMConstants.l2_result_ap,
          },
          {
            name: standardBOMConstants.l2_result_detection,
          },
          {
            name: standardBOMConstants.l2_result_occurence,
          },
          {
            name: standardBOMConstants.l2_result_severity,
          },
          {
            name: standardBOMConstants.l2_is_checklist_target,
          },
          {
            name: 'l2_comments',
          },
        ],
      },
      {
        name: standardBOMConstants.BOMLine,
        properties: [
          {
            name: standardBOMConstants.bl_has_children,
          },
          {
            name: standardBOMConstants.l2_is_checklist_target,
          },
        ],
      },
      {
        name: standardBOMConstants.Folder,
        properties: [
          {
            name: standardBOMConstants.contents,
          },
        ],
      },
      {
        name: standardBOMConstants.L2_StructureRevision,
        properties: [
          {
            name: standardBOMConstants.object_name,
          },
          {
            name: standardBOMConstants.object_string,
          },
          {
            name: 'l2_comments',
          },
        ],
      },
      {
        name: 'L2_FunctionRevision',
        properties: [
          {
            name: standardBOMConstants.object_name,
          },
          {
            name: standardBOMConstants.object_string,
          },
          {
            name: 'l2_files',
          },
        ],
      },
      {
        name: 'L2_FailureRevision',
        properties: [
          {
            name: standardBOMConstants.object_name,
          },
          {
            name: standardBOMConstants.object_string,
          },
          {
            name: 'l2_files',
          },
        ],
      },
    ],
  };
  policyId = propertyPolicyService.register(policy);
};

export let unRegisterPropertyPolicy = function () {
  if (policyId) {
    propertyPolicyService.unregister(policyId);
    policyId = null;
  }
};

export default exports = {
  registerPropertyPolicy,
  unRegisterPropertyPolicy,
};
app.factory('L2_StandardBOMPropertyPolicyService', () => exports);
