import popupService from "js/popupService";
import appCtxService from "js/appCtxService";

import { makeTable } from "js/L2_interactionMatrixPopupTableService";
import { getLang } from "js/L2_ChecklistInteractionUtils";

let langIndex;

const FMEA_INERATION_INIT = "interaction_init"; // Interaction Table 편집창 init

// Interaction Matrix Popup open
export const openInteractionPopup = (ctx) => {
  const inputParam = {
    declView: "interactionMatrixPopup",
    locals: {
      caption: "Interaction Matrix",
      anchor: "closePopupAnchor",
    },
    options: {
      width: 1640,
      height: 950,
      isModal: false,
      clickOutsideToClose: false,
      draggable: true,
      hooks: {
        whenOpened: () => {
          initializePopup(ctx);
        },
      },
    },
  };
  popupService.show(inputParam);
};

const initializePopup = async (ctx) => {
  const grid = document.querySelector("#interaction-grid");
  grid.style.visibility = "hidden";
  langIndex = getLang();

  _setTextDesc();

  _resizePoup();

  await makeTable();

  grid.style.visibility = "visible";
  appCtxService.registerCtx(FMEA_INERATION_INIT, true);
};

//// popup make
const _resizePoup = () => {
  try {
    let height = document.childNodes[1].offsetHeight;
    let width = document.childNodes[1].offsetWidth;
    document
      .getElementsByClassName("aw-popup-contentContainer")[0]
      .children[0].setAttribute(
        "style",
        "height: " + (height - 20) + "px; width: " + (width - 40) + "px;"
      );
    window.onresize = function () {
      try {
        let height = document.childNodes[1].offsetHeight;
        let width = document.childNodes[1].offsetWidth;
        document
          .getElementsByClassName("aw-popup-contentContainer")[0]
          .children[0].setAttribute(
            "style",
            "height: " + (height - 20) + "px; width: " + (width - 40) + "px;"
          );
      } catch (error) {
        console.error("Failed to execute popup resizing");
      }
    };
  } catch (error) {
    console.error("Failed to execute popup resizing");
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
  const textDescEl = document.querySelector(".text-desc");
  textDescEl.innerHTML = langIndex === 1 ? INTERACTION_DESC_KR : "english..";
};

export default {
  openInteractionPopup,
  initializePopup,
};
