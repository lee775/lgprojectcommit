import popupService from 'js/popupService';
import appCtxService from 'js/appCtxService';

import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import { makeTable } from 'js/L2_interactionMatrixPopupTableService';
import { getLang } from 'js/L2_ChecklistInteractionUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

let langIndex;

const FMEA_INERATION_INIT = 'interaction_init'; // Interaction Table 편집창 init

// Interaction Matrix Popup open
export const openInteractionPopup = (ctx) => {
  const inputParam = {
    declView: 'L2_interactionMatrixPopup',
    locals: {
      caption: 'Interaction Matrix',
      anchor: 'closeInteraction',
    },
    options: {
      width: 1640,
      height: 950,
      isModal: true,
      clickOutsideToClose: false,
      draggable: true,
      hooks: {
        whenOpened: () => {
          initializePopup(ctx);
        },
      },
    },
  };
  popupService.show(inputParam).then((response) => {
    console.log({ response });
    response.panelEl.id = 'interactionMatrixPopup';
  });
  let whetherReleased = ctx.checklist.target.props.release_status_list.dbValues.length;
  appCtxService.registerCtx('checkReleased', whetherReleased);
};

const initializePopup = async (ctx) => {
  const grid = document.querySelector('#interaction-grid');
  grid.style.visibility = 'hidden';
  langIndex = getLang();

  _setTextDesc();

  _resizePoup();

  await makeTable();

  appCtxService.registerCtx(FMEA_INERATION_INIT, true);
  grid.style.visibility = 'visible';
};
//// popup make
const _resizePoup = () => {
  try {
    let height = document.childNodes[1].offsetHeight;
    let width = document.childNodes[1].offsetWidth;
    document
      .getElementsByClassName('aw-popup-contentContainer')[0]
      .children[0].setAttribute('style', 'height: ' + (height - 20) + 'px; width: ' + (width - 40) + 'px;');
    window.onresize = function () {
      try {
        let height = document.childNodes[1].offsetHeight;
        let width = document.childNodes[1].offsetWidth;
        document
          .getElementsByClassName('aw-popup-contentContainer')[0]
          .children[0].setAttribute('style', 'height: ' + (height - 20) + 'px; width: ' + (width - 40) + 'px;');
      } catch (error) {
        // console.error('Failed to execute popup resizing');
      }
    };
  } catch (error) {
    // console.error('Failed to execute popup resizing');
  }
};

const _setTextDesc = () => {
  const INTERACTION_DESC_KR = `
  <p>1) 목적</p>
  <p>- 연관 부품 선정 및 유도환경에 따른 고장모드/매커니즘 분석</p>
  <p>2) 작성 내용</p>
  <p>
    - 어셈블리 혹은 서브 어셈블리 단위를 기준으로, Item 선정(영향 주는
    측, 영향 받은 측으로 구분하여 List up)
  </p>
  <p>
    - 도출 된 Item 별 Interaction 분석 : 과거사례/경험 혹은 Reference
    자료를 기준으로 하고, 필요 시 구성원 간 W/S(Brainstorming, Voting)을
    통하여 분석을 진행 함
  </p>
  <p>
    3) 작성 순서 : 부품 간 Interaction 분석 → 고장모드/매커니즘 분석
  </p>
  <p>4) 주의 사항</p>
  <p>
    <strong>- 도출된 결과 중 영향도가 크게 미치는 항목에 대해
      <span>각 영향특성에 맞춰 색깔 구분하여 FMEA 전개에 반영함.</span>
    </strong>
  </p>
  `;
  const INTERACTION_DESC_EN = `
  <p>1) Purpose</p>
  <p>- Failure mode/mechanism analysis according to selection 
  of related parts and induction environment</p>
  <p>2) Written content</p>
  <p>
    - Item selection based on assembly or sub-assembly unit 
      (list up by dividing the affected side and the affected side)
  </p>
  <p>
    - Interaction analysis for each derived item: Based on past 
    cases/experiences or reference data, if necessary, analysis 
    is carried out through W/S (Brainstorming, Voting) between members
  </p>
  <p>
    3) Creation order: Interaction analysis between parts → Failure mode/mechanism analysis
  </p>
  <p>4) Caution</p>
  <p>
    <strong>- Among the derived results, the items with the 
    greatest influence are classified by color according to 
    each influence characteristic and reflected in the development of the FMEA.
    </strong>
  </p>
  `;
  const textDescEl = document.querySelector('.text-desc');
  textDescEl.innerHTML = langIndex === 1 ? INTERACTION_DESC_KR : INTERACTION_DESC_EN;
};

const closeInteractionPopup = () => {
  window.onbeforeunload = function (e) {
    return e.preventDefault();
  };
};

export default {
  openInteractionPopup,
  initializePopup,
};
