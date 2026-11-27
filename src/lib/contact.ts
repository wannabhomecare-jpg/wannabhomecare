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

export type KakaoInfo = {
  /** 채널 ID (pf.kakao.com/_ 뒤의 영문·숫자) */
  id: string;
  /** 채널 홈 주소 https://pf.kakao.com/_<ID> */
  home: string;
  /** 1:1 채팅방 주소 https://pf.kakao.com/_<ID>/chat — 버튼은 이 주소를 쓴다 */
  url: string;
};

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

/**
 * 카카오톡 채널 주소를 정리한다.
 * 받는 것: http(s)://pf.kakao.com/_<영문·숫자> (뒤에 /chat, /friend, / 가 붙어도 된다. 쿼리·# 는 버린다)
 * 그 밖은 null.
 */
export function normalizeKakao(raw: string | null | undefined): KakaoInfo | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === "#") return null;
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.hostname.toLowerCase() !== "pf.kakao.com" || u.port) return null;
  const m = /^\/_([A-Za-z0-9]+)(?:\/(?:chat|friend)?)?\/?$/.exec(u.pathname);
  if (!m) return null;
  const id = m[1];
  const home = `https://pf.kakao.com/_${id}`;
  return { id, home, url: `${home}/chat` };
}

export function getContactInfo(): ContactInfo {
  return {
    phone: normalizePhone(process.env.NEXT_PUBLIC_PHONE),
    kakao: normalizeKakao(process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL),
  };
}

/** 카카오 버튼을 읽어 주는 이름 */
export const KAKAO_ARIA = "카카오톡 1:1 상담 (새 창)";
