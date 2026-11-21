/**
 * 연락처 정리. 값이 없거나 형식이 틀리면 null 을 돌려주고, 화면은 그때의 규칙을 따른다
 * (미리보기: 버튼은 보이고 누르면 '아직 연결 전입니다' 안내 / 오픈: 버튼을 숨긴다).
 */

export type PhoneInfo = {
  /** 숫자만 (예: 01083682552) */
  raw: string;
  /** tel: 뒤에 붙일 값 (숫자만) */
  tel: string;
  /** 화면에 보일 형식 (예: 010-8368-2552) */
  display: string;
};

export type KakaoInfo = { url: string };

export type ContactInfo = {
  phone: PhoneInfo | null;
  kakao: KakaoInfo | null;
};

/** 국내 휴대폰·일반 전화 번호를 숫자만 남겨 정리한다. */
export function normalizePhone(raw: string | null | undefined): PhoneInfo | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  let display: string | null = null;
  if (/^01[016-9]\d{7,8}$/.test(digits)) {
    display =
      digits.length === 10
        ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
        : `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  } else if (/^02\d{7,8}$/.test(digits)) {
    display =
      digits.length === 9
        ? `02-${digits.slice(2, 5)}-${digits.slice(5)}`
        : `02-${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else if (/^0[3-9]\d{8,9}$/.test(digits)) {
    display =
      digits.length === 10
        ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
        : `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (!display) return null;
  return { raw: digits, tel: digits, display };
}

/** 카카오톡 채널 주소(https://pf.kakao.com/...)만 받는다. */
export function normalizeKakao(raw: string | null | undefined): KakaoInfo | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === "#") return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:") return null;
    if (!/^pf\.kakao\.com$/i.test(u.host)) return null;
    return { url: u.toString() };
  } catch {
    return null;
  }
}

export function getContactInfo(): ContactInfo {
  return {
    phone: normalizePhone(process.env.NEXT_PUBLIC_PHONE),
    kakao: normalizeKakao(process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL),
  };
}
