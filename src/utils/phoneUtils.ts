/**
 * 전화번호를 010-0000-0000 형식으로 포맷팅합니다.
 * @param value 입력된 전화번호 문자열
 * @returns 포맷팅된 전화번호 문자열
 */
export const formatPhoneNumber = (value: string): string => {
  // 숫자만 추출
  const phoneNumber = value.replace(/[^\d]/g, '');
  
  // 길이에 따라 포맷팅
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 7) {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
  } else if (phoneNumber.length <= 11) {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`;
  } else {
    // 11자리를 초과하면 11자리까지만 사용
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  }
};

/**
 * 포맷팅된 전화번호에서 숫자만 추출합니다.
 * @param formattedPhone 포맷팅된 전화번호 (예: 010-1234-5678)
 * @returns 숫자만 포함된 전화번호 (예: 01012345678)
 */
export const unformatPhoneNumber = (formattedPhone: string): string => {
  return formattedPhone.replace(/[^\d]/g, '');
};

/**
 * 전화번호가 유효한 형식인지 검증합니다.
 * @param phoneNumber 검증할 전화번호
 * @returns 유효하면 true, 그렇지 않으면 false
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const cleanPhone = unformatPhoneNumber(phoneNumber);
  
  // 한국 휴대폰 번호 패턴 (010, 011, 016, 017, 018, 019로 시작하는 11자리)
  const phonePattern = /^01[0-9]\d{8}$/;
  
  return phonePattern.test(cleanPhone);
};

/**
 * 전화번호 입력 시 커서 위치를 조정합니다.
 * @param input HTMLInputElement
 * @param prevValue 이전 값
 * @param newValue 새로운 값
 */
export const adjustCursorPosition = (
  input: HTMLInputElement,
  prevValue: string,
  newValue: string
): void => {
  const prevCursorPos = input.selectionStart || 0;
  const prevLength = prevValue.length;
  const newLength = newValue.length;
  
  // 문자가 추가된 경우
  if (newLength > prevLength) {
    const diff = newLength - prevLength;
    // 하이픈이 추가된 위치를 고려하여 커서 위치 조정
    if (newValue[prevCursorPos] === '-') {
      setTimeout(() => {
        input.setSelectionRange(prevCursorPos + diff, prevCursorPos + diff);
      }, 0);
    }
  }
}; 