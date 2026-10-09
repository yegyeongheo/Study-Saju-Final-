// Draft display content. Replace this object with approved policy text and a version
// when the production privacy policy is ready. This module records no legal consent.
export const CONSENT_NOTICE = {
  status: 'draft',
  version: null,
  introduction: '현재는 동의 화면 미리보기입니다. 아래 내용은 확정 전 안내이며, 실제 개인정보 처리 정책은 추후 안내됩니다.',
  retention: '정책 확정 후 안내 예정입니다.',
  purpose: '사주 분석과 학습·진로 해석 제공, 선택한 공부 종류 및 개인화 질문을 반영한 리포트 구성에 사용합니다. 최종 이용 목적은 정책 확정 후 안내됩니다.',
  refusal: '동의하지 않을 수 있습니다. 필수 동의 항목을 선택하지 않으면 다음 단계로 진행할 수 없습니다.',
  selfItems: '이름, 성별, 생년월일, 양력·음력 및 윤달 여부, 태어난 시간(시간 모름 포함), 출생 지역, 공부 종류, 개인화 질문의 선택 답변과 선택 입력 질문. 최종 수집 항목은 정책 확정 후 안내됩니다.',
  childItems: '자녀와 보호자의 이름, 성별, 생년월일, 양력·음력 및 윤달 여부, 태어난 시간(시간 모름 포함), 출생 지역, 자녀와의 관계, 자녀의 공부 종류, 개인화 질문의 선택 답변과 선택 입력 질문. 최종 수집 항목은 정책 확정 후 안내됩니다.',
  guardianVerification: '법정대리인 확인 방법과 절차는 추후 안내됩니다. 현재 체크박스 선택만으로 법정대리인 확인이 완료되는 것은 아닙니다.'
};

export function createConsentController() {
  const collection = document.getElementById('consent-collection');
  const guardian = document.getElementById('consent-guardian');
  const guardianRow = document.getElementById('guardian-consent-row');
  const nextButton = document.getElementById('intake-next');
  const dialog = document.getElementById('consent-dialog');
  const dialogTitle = document.getElementById('consent-dialog-title');
  const dialogContent = document.getElementById('consent-dialog-content');
  const drafts = {child:{collection:false, guardian:false}, self:{collection:false, guardian:false}};
  let audience = null;
  let opener = null;

  function isReady() {
    return !!audience && collection.checked && (audience !== 'child' || guardian.checked);
  }
  function sync() { nextButton.disabled = !isReady(); }
  function remember() {
    if (audience) drafts[audience] = {collection:collection.checked, guardian:guardian.checked};
    sync();
  }
  function setAudience(next) {
    remember();
    audience = next === 'child' || next === 'self' ? next : null;
    const draft = audience ? drafts[audience] : {collection:false, guardian:false};
    collection.checked = draft.collection;
    collection.disabled = !audience;
    guardian.checked = draft.guardian;
    guardianRow.hidden = audience !== 'child';
    guardian.disabled = audience !== 'child';
    guardian.required = audience === 'child';
    sync();
  }
  function snapshot() {
    return {
      noticeStatus:CONSENT_NOTICE.status,
      noticeVersion:CONSENT_NOTICE.version,
      collectionSelected:collection.checked,
      guardianDeclarationSelected:audience === 'child' ? guardian.checked : null,
      guardianVerification:'not_connected',
      recordStatus:'not_saved'
    };
  }
  function requireSelection() {
    sync();
    if (isReady()) return true;
    const missing = collection.checked && audience === 'child' ? guardian : collection;
    missing.focus();
    missing.reportValidity();
    return false;
  }
  function closeDialog() {
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove('consent-dialog-open');
  }
  function openDialog(kind, button) {
    opener = button;
    const isGuardian = kind === 'guardian';
    dialogTitle.textContent = isGuardian ? '자녀의 개인정보 처리 동의' : '개인정보 수집 및 이용 동의';
    document.getElementById('consent-dialog-intro').textContent = CONSENT_NOTICE.introduction;
    document.getElementById('consent-policy-status').textContent = CONSENT_NOTICE.status === 'draft' ? '정책 확정 전 안내' : '개인정보 처리 안내';
    const rows = [
      ['수집 항목', audience === 'child' ? CONSENT_NOTICE.childItems : CONSENT_NOTICE.selfItems],
      ['이용 목적', CONSENT_NOTICE.purpose],
      ['보유기간', CONSENT_NOTICE.retention],
      ['동의 거부권 및 불이익', CONSENT_NOTICE.refusal]
    ];
    if (isGuardian) rows.push(['법정대리인 확인 절차', CONSENT_NOTICE.guardianVerification]);
    dialogContent.replaceChildren();
    rows.forEach(([title, content]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt'); term.textContent = title;
      const description = document.createElement('dd'); description.textContent = content;
      row.append(term, description); dialogContent.append(row);
    });
    dialog.showModal();
    document.documentElement.classList.add('consent-dialog-open');
    dialog.scrollTop = 0;
    document.getElementById('consent-dialog-scroll').scrollTop = 0;
    dialogTitle.focus({preventScroll:true});
  }
  collection.addEventListener('change', remember);
  guardian.addEventListener('change', remember);
  document.querySelectorAll('[data-consent-details]').forEach(button => {
    button.addEventListener('click', () => openDialog(button.dataset.consentDetails, button));
  });
  document.querySelectorAll('[data-consent-close]').forEach(button => button.addEventListener('click', closeDialog));
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('consent-dialog-open');
    if (opener && opener.getClientRects().length) opener.focus({preventScroll:true});
    opener = null;
  });
  // Native dialog supplies the focus trap and Escape handling.
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
  });
  window.addEventListener('pagehide', closeDialog);
  setAudience(null);
  return {setAudience, isReady, requireSelection, snapshot, closeDialog};
}
